import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";
import type { CheckInRecord, VitalsSnapshot, VitalViewId } from "@/types/health";

import { buildVitalsSnapshot } from "./vitals-engine";

const NOW = new Date("2026-11-16T12:00:00.000Z");

function atDaysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

function checkIn(days: number, overrides: Partial<CheckInRecord> = {}): CheckInRecord {
  return makeCheckIn({
    id: `checkin-${days}-${overrides.sleepHours ?? "default"}`,
    observedAt: atDaysAgo(days),
    ...overrides,
  });
}

function view(snapshot: VitalsSnapshot, id: VitalViewId) {
  const found = snapshot.views.find((candidate) => candidate.id === id);
  if (!found) throw new Error(`Expected a ${id} view.`);
  return found;
}

describe("buildVitalsSnapshot", () => {
  it("returns seven ordered views with honest gaps and separate simulations", () => {
    const snapshot = buildVitalsSnapshot({ checkIns: [], now: NOW });
    if (!snapshot) throw new Error("Expected a snapshot.");

    expect(snapshot.windowDays).toBe(7);
    expect(snapshot.checkInsInWindow).toBe(0);
    expect(snapshot.views.map((entry) => entry.id)).toEqual([
      "heartRate",
      "spo2",
      "bloodPressure",
      "sleepRecovery",
      "activity",
      "hydration",
      "nutrition",
    ]);

    const heartRate = view(snapshot, "heartRate");
    expect(heartRate.recorded.available).toBe(false);
    expect(heartRate.recorded.points).toEqual([]);
    expect(heartRate.recorded.missing.join(" ")).toMatch(/not part of the check-in form/);
    expect(heartRate.simulated?.category).toBe("simulated");
    expect(heartRate.simulated?.points).toHaveLength(13);

    expect(view(snapshot, "spo2").simulated?.points).toHaveLength(13);
    expect(view(snapshot, "bloodPressure").simulated?.latest.secondaryValue).toBeTypeOf(
      "number",
    );

    for (const id of ["sleepRecovery", "activity", "hydration", "nutrition"] as const) {
      expect(view(snapshot, id).simulated).toBeNull();
    }
  });

  it("filters recorded values to the selected window", () => {
    const checkIns = [checkIn(2, { sleepHours: 7 }), checkIn(10, { sleepHours: 6 })];

    const seven = buildVitalsSnapshot({ checkIns, now: NOW, windowDays: 7 });
    const fourteen = buildVitalsSnapshot({ checkIns, now: NOW, windowDays: 14 });
    if (!seven || !fourteen) throw new Error("Expected snapshots.");

    expect(seven.checkInsInWindow).toBe(1);
    expect(fourteen.checkInsInWindow).toBe(2);
    expect(view(seven, "sleepRecovery").recorded.points).toHaveLength(1);
    expect(view(fourteen, "sleepRecovery").recorded.points).toHaveLength(2);
    expect(view(fourteen, "sleepRecovery").recorded.coverageText).toContain(
      "2 of 14 days",
    );
  });

  it("describes recorded sleep direction without clinical interpretation", () => {
    const rising = buildVitalsSnapshot({
      checkIns: [
        checkIn(3, { sleepHours: 5 }),
        checkIn(2, { sleepHours: 6 }),
        checkIn(1, { sleepHours: 7 }),
      ],
      now: NOW,
    });
    const falling = buildVitalsSnapshot({
      checkIns: [
        checkIn(3, { sleepHours: 8 }),
        checkIn(2, { sleepHours: 7 }),
        checkIn(1, { sleepHours: 6 }),
      ],
      now: NOW,
    });
    const steady = buildVitalsSnapshot({
      checkIns: [
        checkIn(3, { sleepHours: 7 }),
        checkIn(2, { sleepHours: 7.1 }),
        checkIn(1, { sleepHours: 7 }),
      ],
      now: NOW,
    });
    const single = buildVitalsSnapshot({
      checkIns: [checkIn(1, { sleepHours: 7 })],
      now: NOW,
    });
    if (!rising || !falling || !steady || !single) {
      throw new Error("Expected snapshots.");
    }

    expect(view(rising, "sleepRecovery").recorded.trend).toBe("rising");
    expect(view(falling, "sleepRecovery").recorded.trend).toBe("falling");
    expect(view(steady, "sleepRecovery").recorded.trend).toBe("steady");
    expect(view(single, "sleepRecovery").recorded.trend).toBe("insufficient");
    expect(view(rising, "sleepRecovery").recorded.trendDetail).toMatch(
      /Direction is descriptive only/,
    );
    expect(view(rising, "sleepRecovery").recorded.trendDetail).not.toMatch(
      /diagnos|recover|risk/i,
    );
  });

  it("keeps missing and partial coverage visible instead of filling gaps", () => {
    const checkIns = [
      checkIn(2, {
        exercisePlannedMinutes: 30,
        hydrationEntries: 2,
      }),
      checkIn(1, { hydration: 2 }),
    ];
    const snapshot = buildVitalsSnapshot({ checkIns, now: NOW });
    if (!snapshot) throw new Error("Expected a snapshot.");

    const sleep = view(snapshot, "sleepRecovery");
    expect(sleep.recorded.points).toHaveLength(2);
    expect(sleep.recorded.missing.join(" ")).toMatch(/Recorded coverage is 2 of 7 days/);

    const activity = view(snapshot, "activity");
    expect(activity.recorded.available).toBe(false);
    expect(activity.recorded.missing.join(" ")).toMatch(
      /recorded a plan without completed minutes/,
    );

    const hydration = view(snapshot, "hydration");
    expect(hydration.recorded.available).toBe(true);
    expect(hydration.recorded.missing.join(" ")).toMatch(
      /Fluid entry counts were recorded on 1 of 2 check-ins/,
    );

    const nutrition = view(snapshot, "nutrition");
    expect(nutrition.recorded.available).toBe(false);
    expect(nutrition.recorded.missing.join(" ")).toMatch(
      /Nutrition entry counts were not recorded/,
    );
  });

  it("links research context only where a verified entry exists", () => {
    const snapshot = buildVitalsSnapshot({
      checkIns: [checkIn(1)],
      now: NOW,
    });
    if (!snapshot) throw new Error("Expected a snapshot.");

    for (const id of ["sleepRecovery", "activity"] as const) {
      const research = view(snapshot, id).research;
      expect(research?.publisher).toBe("NASA");
      expect(research?.url.startsWith("https://")).toBe(true);
      expect(research?.limitations).toMatch(/Program overview only/);
    }

    for (const id of [
      "heartRate",
      "spo2",
      "bloodPressure",
      "hydration",
      "nutrition",
    ] as const) {
      const entry = view(snapshot, id);
      expect(entry.research).toBeNull();
      expect(entry.researchNote).toMatch(/No verified research source is linked/);
    }
  });

  it("marks every recorded point as recorded and every simulation as simulated", () => {
    const checkIns = [checkIn(2, { sleepHours: 6 }), checkIn(1, { sleepHours: 7.5 })];
    const snapshot = buildVitalsSnapshot({ checkIns, now: NOW });
    if (!snapshot) throw new Error("Expected a snapshot.");

    for (const entry of snapshot.views) {
      for (const point of entry.recorded.points) {
        expect(checkIns.map((record) => record.observedAt)).toContain(point.observedAt);
      }
      expect(entry.recorded.category).toBe("recorded");
      if (entry.simulated) {
        expect(entry.simulated.category).toBe("simulated");
        expect(entry.simulated.generator).toBe("astatine.vitals-simulation");
        expect(entry.simulated.points).toHaveLength(13);
      }
      expect(entry.dataClasses).toContain("recorded");
    }
  });

  it("returns null for an invalid display time", () => {
    expect(buildVitalsSnapshot({ checkIns: [], now: new Date(Number.NaN) })).toBeNull();
  });
});
