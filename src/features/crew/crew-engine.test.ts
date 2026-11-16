import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";
import type { CheckInRecord, CrewMetricId } from "@/types/health";

import { CREW_DISPLAY_NAME_FALLBACK, buildCrewReadinessSnapshot } from "./crew-engine";

const NOW = new Date("2026-11-16T12:00:00.000Z");

function observed(daysAgo: number, extraHours = 0): string {
  return new Date(Date.UTC(2026, 10, 16 - daysAgo, 8 + extraHours)).toISOString();
}

function record(
  id: string,
  daysAgo: number,
  overrides: Partial<CheckInRecord> = {},
  extraHours = 0,
): CheckInRecord {
  return makeCheckIn({ id, observedAt: observed(daysAgo, extraHours), ...overrides });
}

function build(
  checkIns: readonly CheckInRecord[],
  options: {
    now?: Date;
    windowDays?: number;
    displayName?: string;
  } = {},
) {
  return buildCrewReadinessSnapshot({
    checkIns,
    now: NOW,
    windowDays: 7,
    displayName: "Rook",
    ...options,
  });
}

function metric(snapshot: NonNullable<ReturnType<typeof build>>, id: CrewMetricId) {
  const entry = snapshot.metrics.find((item) => item.id === id);
  if (!entry) throw new Error(`Expected the ${id} metric.`);
  return entry;
}

describe("buildCrewReadinessSnapshot", () => {
  it("returns null when no valid check-in falls inside the window", () => {
    expect(build([])).toBeNull();
    expect(build([record("old", 9)])).toBeNull();
    expect(build([makeCheckIn({ observedAt: "2026-11-17T08:00:00.000Z" })])).toBeNull();
    expect(build([record("bad-time", 0, { observedAt: "not-a-time" })])).toBeNull();
    expect(build([record("valid", 0)], { now: new Date("invalid") })).toBeNull();
  });

  it("aggregates distinct recorded days and keeps the latest local context", () => {
    const snapshot = build([
      record("older", 6),
      record("same-day-morning", 1),
      record("same-day-evening", 1, {}, 10),
      record("latest", 0),
    ]);

    expect(snapshot).not.toBeNull();
    if (!snapshot) return;

    expect(snapshot.windowDays).toBe(7);
    expect(snapshot.member.displayName).toBe("Rook");
    expect(snapshot.member.checkInCount).toBe(4);
    expect(snapshot.member.recordedDays).toBe(3);
    expect(snapshot.member.coveragePercent).toBe(43);
    expect(snapshot.member.latestObservedAt).toBe(observed(0));
    expect(snapshot.member.latestAgeHours).toBe(4);

    const completion = metric(snapshot, "checkInCompletion");
    expect(completion.headline).toBe("3 of 7 days");
    expect(completion.status).toBe("partial");
    expect(completion.detail).toMatch(/UTC date/);

    expect(snapshot.dataGaps.map((gap) => gap.id)).toContain("recording-coverage");
    expect(snapshot.dataClasses).toEqual(["recorded"]);
  });

  it("describes sleep variation only after three recorded durations", () => {
    const twoNights = build([
      record("one", 2, { sleepHours: 6 }),
      record("two", 1, { sleepHours: 8 }),
    ]);
    if (!twoNights) throw new Error("Expected a snapshot.");
    expect(metric(twoNights, "sleepVariation")).toMatchObject({
      status: "missing",
      headline: "Needs at least three check-ins",
    });

    const threeNights = build([
      record("one", 2, { sleepHours: 6 }),
      record("two", 1, { sleepHours: 7.5 }),
      record("three", 0, { sleepHours: 9 }),
    ]);
    if (!threeNights) throw new Error("Expected a snapshot.");
    const sleep = metric(threeNights, "sleepVariation");
    expect(sleep.status).toBe("available");
    expect(sleep.headline).toBe("±1.22 h variation");
    expect(sleep.detail).toMatch(/ranged from 6 to 9 h/);
    expect(sleep.detail).toMatch(/not sleep quality or a sleep assessment/);
  });

  it("compares only paired exercise entries and states when a plan is absent", () => {
    const paired = build([
      record("one", 2, {
        exercisePlannedMinutes: 30,
        exerciseCompletedMinutes: 15,
      }),
      record("two", 1, {
        exercisePlannedMinutes: 40,
        exerciseCompletedMinutes: 20,
      }),
      record("three", 0, { exercisePlannedMinutes: 20 }),
    ]);
    if (!paired) throw new Error("Expected a snapshot.");
    expect(metric(paired, "exerciseAdherence")).toMatchObject({
      status: "partial",
      headline: "50% of planned minutes",
    });
    expect(metric(paired, "exerciseAdherence").detail).toMatch(/35 completed minutes/);
    expect(metric(paired, "exerciseAdherence").detail).toMatch(/2 paired days/);
    expect(paired.dataGaps.map((gap) => gap.id)).toContain("exercise");

    const noPlan = build([
      record("one", 0, { exercisePlannedMinutes: 0, exerciseCompletedMinutes: 20 }),
    ]);
    if (!noPlan) throw new Error("Expected a snapshot.");
    expect(metric(noPlan, "exerciseAdherence")).toMatchObject({
      status: "partial",
      headline: "20 min completed · no plan",
    });

    const unpaired = build([record("one", 0, { exerciseCompletedMinutes: 20 })]);
    if (!unpaired) throw new Error("Expected a snapshot.");
    expect(metric(unpaired, "exerciseAdherence").status).toBe("missing");
  });

  it("counts logging days without treating entries as intake or status", () => {
    const snapshot = build([
      record("one", 1, { hydrationEntries: 2 }),
      record("two", 0, { hydrationEntries: 3 }),
      record("three", 0, { hydrationEntries: 1 }, 2),
    ]);
    if (!snapshot) throw new Error("Expected a snapshot.");

    const hydration = metric(snapshot, "hydrationLogging");
    expect(hydration.headline).toBe("2 of 7 days logged");
    expect(hydration.detail).toMatch(/6 fluid entries/);
    expect(hydration.detail).toMatch(/not hydration status or intake/);

    const nutrition = metric(snapshot, "nutritionLogging");
    expect(nutrition.status).toBe("missing");
    expect(nutrition.headline).toBe("No entries recorded");
    expect(snapshot.dataGaps.map((gap) => gap.id)).toEqual(
      expect.arrayContaining(["hydration", "nutrition"]),
    );
  });

  it("averages workload and fatigue without combining them into a score", () => {
    const snapshot = build([
      record("one", 2, { fatigue: 2, workload: 2 }),
      record("two", 1, { fatigue: 3, workload: 4 }),
      record("three", 0, { fatigue: 5, workload: 5 }),
    ]);
    if (!snapshot) throw new Error("Expected a snapshot.");

    const workload = metric(snapshot, "workloadFatigue");
    expect(workload.status).toBe("available");
    expect(workload.headline).toBe("Fatigue 3.3/5 · workload 3.7/5");
    expect(workload.detail).toMatch(/Fatigue self-report was higher/);
    expect(workload.detail).toMatch(/Workload self-report was higher/);
    expect(workload.detail).toMatch(/not clinical severity ratings/);

    const partial = build([
      record("one", 1, { fatigue: 3 }),
      record("two", 0, { fatigue: 4 }),
    ]);
    if (!partial) throw new Error("Expected a snapshot.");
    expect(metric(partial, "workloadFatigue").status).toBe("partial");
    expect(metric(partial, "workloadFatigue").headline).toMatch(/workload not recorded/);
    expect(partial.dataGaps.map((gap) => gap.id)).toContain("workload");
  });

  it("shows the fixed-rubric readiness band without averaging people", () => {
    const snapshot = build([
      record("one", 0, {
        sleepHours: 5,
        fatigue: 5,
        workload: 5,
        exercisePlannedMinutes: 30,
        exerciseCompletedMinutes: 0,
        hydrationEntries: 1,
        nutritionEntries: 1,
      }),
    ]);
    if (!snapshot) throw new Error("Expected a snapshot.");

    const readiness = metric(snapshot, "readinessBand");
    expect(readiness.headline).not.toBe("");
    expect(readiness.status).not.toBe("missing");
    expect(readiness.category).toBe("recorded");
    expect(readiness.detail).toMatch(/Bands are not averaged across people/);
    expect(readiness.detail).toMatch(/not fitness-for-duty findings/);
  });

  it("raises only the documented non-clinical review item", () => {
    const high = build([
      record("one", 1, { fatigue: 5, workload: 4 }),
      record("two", 0, { fatigue: 5, workload: 5 }),
    ]);
    if (!high) throw new Error("Expected a snapshot.");
    expect(high.attentionItems).toHaveLength(1);
    expect(high.attentionItems[0]).toMatchObject({
      id: "workload-fatigue-review",
      category: "recorded",
      sourceLabel: "Recorded · local rule",
    });
    expect(high.attentionItems[0]?.detail).toMatch(/not a medical alert/);

    const single = build([record("one", 0, { fatigue: 5, workload: 5 })]);
    if (!single) throw new Error("Expected a snapshot.");
    expect(single.attentionItems).toEqual([]);

    const mixed = build([
      record("one", 1, { fatigue: 3, workload: 5 }),
      record("two", 0, { fatigue: 3, workload: 5 }),
    ]);
    if (!mixed) throw new Error("Expected a snapshot.");
    expect(mixed.attentionItems).toEqual([]);
  });

  it("uses a 14-day window and a local fallback name on request", () => {
    const snapshot = build([record("recent", 0), record("ten-days-ago", 10)], {
      windowDays: 14,
      displayName: "   ",
    });
    if (!snapshot) throw new Error("Expected a snapshot.");

    expect(snapshot.windowDays).toBe(14);
    expect(snapshot.member.checkInCount).toBe(2);
    expect(snapshot.member.recordedDays).toBe(2);
    expect(snapshot.member.displayName).toBe(CREW_DISPLAY_NAME_FALLBACK);
  });

  it("never includes raw private fields or record identifiers in the view model", () => {
    const snapshot = build([
      record("private-checkin-id-9", 0, {
        sleepQuality: 1,
        mood: 5,
        soreness: 4,
        stress: 5,
        hydration: 1,
      }),
    ]);
    if (!snapshot) throw new Error("Expected a snapshot.");

    const serialized = JSON.stringify(snapshot);
    for (const key of [
      "sleepQuality",
      "mood",
      "soreness",
      "stress",
      "hydration",
      "source",
      "observedAt",
    ]) {
      expect(serialized).not.toContain(`"${key}":`);
    }
    expect(serialized).not.toContain("private-checkin-id-9");

    const completion = metric(snapshot, "checkInCompletion");
    expect(Object.keys(completion).sort()).toEqual([
      "category",
      "detail",
      "headline",
      "id",
      "label",
      "sourceLabel",
      "status",
    ]);
  });
});
