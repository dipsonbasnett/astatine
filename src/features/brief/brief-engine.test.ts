import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";

import {
  BRIEF_LIMITS,
  BRIEF_SCOPE_NOTE,
  BRIEF_WINDOW_DAYS,
  briefToPlainText,
  buildMissionHealthBrief,
} from "./brief-engine";

const GENERATED_AT = "2026-11-16T12:00:00.000Z";

function recentCheckIns() {
  return [
    makeCheckIn({ id: "checkin-a", observedAt: "2026-11-16T08:00:00.000Z" }),
    makeCheckIn({
      id: "checkin-b",
      observedAt: "2026-11-15T08:00:00.000Z",
      sleepHours: 6.5,
    }),
    makeCheckIn({
      id: "checkin-c",
      observedAt: "2026-11-14T08:00:00.000Z",
      sleepHours: 7,
    }),
  ];
}

describe("buildMissionHealthBrief", () => {
  it("returns null without a recorded check-in in the window", () => {
    expect(
      buildMissionHealthBrief({ checkIns: [], generatedAt: GENERATED_AT }),
    ).toBeNull();
  });

  it("composes a recorded-only brief from the fixed rubric", () => {
    const brief = buildMissionHealthBrief({
      checkIns: recentCheckIns(),
      generatedAt: GENERATED_AT,
    });

    expect(brief).not.toBeNull();
    expect(brief?.windowDays).toBe(BRIEF_WINDOW_DAYS);
    expect(brief?.checkInCount).toBe(3);
    expect(brief?.headline).toContain("3 recorded check-ins in the last 7 days");
    expect(brief?.dataClasses).toEqual(["recorded"]);
    expect(brief?.scoredFactors.map((line) => line.id)).toEqual([
      "sleepDuration",
      "sleepRegularity",
      "exerciseAdherence",
      "workloadFatigue",
    ]);
    expect(brief?.contextFactors.map((line) => line.id)).toEqual([
      "checkInAdherence",
      "hydrationLogging",
      "nutritionLogging",
    ]);
    expect(brief?.observations).toHaveLength(7);
    expect(brief?.observations[0]).toMatchObject({
      id: "sleepHours",
      value: "7.5 h",
    });
    expect(brief?.observations[1]).toMatchObject({
      id: "sleepQuality",
      value: "Fair",
    });
    expect(brief?.limits).toEqual([...BRIEF_LIMITS]);
    expect(brief?.countermeasures.dataClasses).toEqual(["recorded"]);
  });

  it("ignores check-ins outside the seven-day window", () => {
    const brief = buildMissionHealthBrief({
      checkIns: [
        makeCheckIn({ id: "fresh", observedAt: "2026-11-16T08:00:00.000Z" }),
        makeCheckIn({ id: "stale", observedAt: "2026-11-01T08:00:00.000Z" }),
      ],
      generatedAt: GENERATED_AT,
    });

    expect(brief?.checkInCount).toBe(1);
    expect(brief?.latestObservedAt).toBe("2026-11-16T08:00:00.000Z");
  });

  it("states a low recorded window in the rest band without naming a person or mission", () => {
    const brief = buildMissionHealthBrief({
      checkIns: [
        makeCheckIn({
          id: "low",
          observedAt: "2026-11-16T08:00:00.000Z",
          sleepHours: 4,
          fatigue: 5,
          exercisePlannedMinutes: 30,
          exerciseCompletedMinutes: 0,
        }),
      ],
      generatedAt: GENERATED_AT,
    });

    expect(brief?.readiness.band).toBe("rest");
    expect(brief?.headline).toContain("rest and recover band");
    expect(brief?.headline).not.toMatch(/astronaut|crew member|patient/i);
  });

  it("rejects an invalid generation timestamp", () => {
    expect(() =>
      buildMissionHealthBrief({ checkIns: recentCheckIns(), generatedAt: "not-a-time" }),
    ).toThrow(RangeError);
  });
});

describe("briefToPlainText", () => {
  it("produces a self-contained, explicitly limited text brief", () => {
    const brief = buildMissionHealthBrief({
      checkIns: recentCheckIns(),
      generatedAt: GENERATED_AT,
    });
    if (!brief) throw new Error("Expected a brief");

    const text = briefToPlainText(brief);

    expect(text).toContain("Astatine mission health brief");
    expect(text).toContain(BRIEF_SCOPE_NOTE);
    expect(text).toContain("Scored factors");
    expect(text).toContain("Sleep duration");
    expect(text).toContain("Suggested focus");
    expect(text).toContain("weight 25%");
    expect(text).toContain("What this brief is not");
    expect(text).toContain(BRIEF_LIMITS[0]);
    expect(text).not.toContain("Simulated sample");
  });
});
