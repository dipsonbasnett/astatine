import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";
import type { CheckInRecord } from "@/types/health";

import {
  FACTOR_META,
  READINESS_CAVEATS,
  READINESS_FORMULA,
  assessReadiness,
  isReadinessAssessment,
  readinessStatusForScore,
  sleepDurationScore,
  sleepRegularityScore,
} from "./readiness-engine";

const NOW = new Date("2026-11-16T10:00:00.000Z");

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

function fullPracticeWeek(overrides: Partial<CheckInRecord> = {}): CheckInRecord[] {
  return Array.from({ length: 7 }, (_, index) =>
    makeCheckIn({
      id: `checkin-${index}`,
      observedAt: daysAgo(index),
      fatigue: 1,
      workload: 1,
      exercisePlannedMinutes: 30,
      exerciseCompletedMinutes: 30,
      hydrationEntries: 4,
      nutritionEntries: 4,
      ...overrides,
    }),
  );
}

describe("assessReadiness", () => {
  it("returns null when there is no usable or in-window check-in", () => {
    expect(assessReadiness({ checkIns: [], now: NOW })).toBeNull();
    expect(
      assessReadiness({
        checkIns: [makeCheckIn({ observedAt: "not-a-date" })],
        now: NOW,
      }),
    ).toBeNull();
    expect(
      assessReadiness({
        checkIns: [makeCheckIn({ observedAt: daysAgo(10) })],
        now: NOW,
        windowDays: 7,
      }),
    ).toBeNull();
    expect(
      assessReadiness({ checkIns: [makeCheckIn()], now: new Date("invalid") }),
    ).toBeNull();
  });

  it("computes a transparent monitor band from a single default check-in", () => {
    const assessment = assessReadiness({ checkIns: [makeCheckIn()], now: NOW });
    if (!assessment) throw new Error("Expected a readiness fixture.");

    expect(
      assessment.factors.map((factor) => [factor.id, factor.score, factor.status]),
    ).toEqual([
      ["checkInAdherence", 14, "limits"],
      ["sleepDuration", 100, "supports"],
      ["sleepRegularity", null, "missing"],
      ["exerciseAdherence", null, "missing"],
      ["workloadFatigue", 50, "mixed"],
      ["hydrationLogging", null, "missing"],
      ["nutritionLogging", null, "missing"],
    ]);
    expect(assessment.averageScore).toBe(69);
    expect(assessment.coverage).toBe(43);
    expect(assessment.band).toBe("monitor");
    expect(assessment.confidence.level).toBe("low");
    expect(assessment.inputs).toMatchObject({
      checkInId: "checkin-1",
      observedAt: "2026-11-16T08:00:00.000Z",
      ageHours: 2,
      checkInsInWindow: 1,
      windowDays: 7,
      formula: READINESS_FORMULA,
    });
    expect(assessment.caveats).toEqual([...READINESS_CAVEATS]);
    expect(assessment.actions[0]?.id).toBe("action-workloadFatigue");
    expect(assessment.actions[0]?.priority).toBe("primary");
    expect(assessment.dataClasses).toEqual(["recorded"]);
  });

  it("labels every factor with a recorded source and never estimates missing inputs", () => {
    const assessment = assessReadiness({ checkIns: [makeCheckIn()], now: NOW });
    if (!assessment) throw new Error("Expected a readiness fixture.");

    for (const factor of assessment.factors) {
      expect(factor.category).toBe("recorded");
      expect(factor.sourceLabel).toMatch(/^Recorded/);
      if (factor.score === null) {
        expect(factor.missingReason).toBeTruthy();
      }
    }

    expect(assessment.missingData).toContain(
      "At least three check-ins in this window are needed to describe sleep regularity.",
    );
    expect(assessment.missingData).toContain(
      "No planned or completed exercise minutes were recorded in this window.",
    );
    expect(assessment.missingData).toContain(
      "No fluid entries were recorded in this window.",
    );
    expect(assessment.missingData).toContain(
      "No nutrition entries were recorded in this window.",
    );
    expect(assessment.missingData).toContain(
      "Only one check-in was recorded in the 7-day window, so trends cannot be described.",
    );
  });

  it("reaches Ready with high confidence when a full week of paired entries is present", () => {
    const assessment = assessReadiness({
      checkIns: fullPracticeWeek(),
      now: NOW,
    });
    if (!assessment) throw new Error("Expected a readiness fixture.");

    expect(assessment.band).toBe("ready");
    expect(assessment.averageScore).toBe(100);
    expect(assessment.coverage).toBe(100);
    expect(assessment.confidence.level).toBe("high");
    expect(assessment.missingData).toEqual([]);
    expect(assessment.actions[0]?.id).toBe("maintain-routines");
    expect(assessment.factors.every((factor) => factor.status === "supports")).toBe(true);
  });

  it("rests when a scored input falls below the strain threshold", () => {
    const assessment = assessReadiness({
      checkIns: [
        makeCheckIn({
          sleepHours: 4,
          fatigue: 5,
          workload: 5,
          exercisePlannedMinutes: 30,
          exerciseCompletedMinutes: 0,
          hydrationEntries: 1,
          nutritionEntries: 1,
        }),
      ],
      now: NOW,
    });
    if (!assessment) throw new Error("Expected a readiness fixture.");

    expect(assessment.band).toBe("rest");
    expect(
      assessment.factors.find((factor) => factor.id === "sleepDuration"),
    ).toMatchObject({ score: 25, status: "limits" });
    expect(
      assessment.factors.find((factor) => factor.id === "workloadFatigue"),
    ).toMatchObject({ score: 0, status: "limits" });
    expect(assessment.actions.map((action) => action.id)).toContain(
      "action-workloadFatigue",
    );
  });

  it("derives sleep regularity from three or more recorded durations", () => {
    const assessment = assessReadiness({
      checkIns: [
        makeCheckIn({ id: "a", observedAt: daysAgo(0), sleepHours: 6 }),
        makeCheckIn({ id: "b", observedAt: daysAgo(1), sleepHours: 8 }),
        makeCheckIn({ id: "c", observedAt: daysAgo(2), sleepHours: 10 }),
      ],
      now: NOW,
    });
    if (!assessment) throw new Error("Expected a readiness fixture.");

    expect(
      assessment.factors.find((factor) => factor.id === "sleepRegularity"),
    ).toMatchObject({
      score: 35,
      valueLabel: "±1.63 h across 3 check-ins",
      status: "limits",
    });
  });

  it("counts check-ins inside the selected window only", () => {
    const tenDaysOld = makeCheckIn({ observedAt: daysAgo(10) });
    const twoDaysOld = makeCheckIn({ id: "recent", observedAt: daysAgo(2) });

    const week = assessReadiness({
      checkIns: [tenDaysOld, twoDaysOld],
      now: NOW,
      windowDays: 7,
    });
    const fortnight = assessReadiness({
      checkIns: [tenDaysOld, twoDaysOld],
      now: NOW,
      windowDays: 14,
    });

    expect(week?.inputs.checkInsInWindow).toBe(1);
    expect(week?.inputs.windowDays).toBe(7);
    expect(fortnight?.inputs.checkInsInWindow).toBe(2);
    expect(fortnight?.inputs.windowDays).toBe(14);
  });

  it("marks the finding as low confidence when logged coverage is sparse", () => {
    const assessment = assessReadiness({
      checkIns: [makeCheckIn({ observedAt: daysAgo(5) })],
      now: NOW,
    });
    if (!assessment) throw new Error("Expected a readiness fixture.");

    expect(assessment.confidence.level).toBe("low");
    expect(assessment.confidence.reasons.join(" ")).toContain(
      "The latest check-in is 120 h old.",
    );
  });
});

describe("readiness scoring helpers", () => {
  it("maps status thresholds without an opaque middle band", () => {
    expect(readinessStatusForScore(70)).toBe("supports");
    expect(readinessStatusForScore(69)).toBe("mixed");
    expect(readinessStatusForScore(45)).toBe("mixed");
    expect(readinessStatusForScore(44)).toBe("limits");
    expect(readinessStatusForScore(null)).toBe("missing");
  });

  it("scores sleep duration against a documented 7–9 hour reference band", () => {
    expect(sleepDurationScore(7.5)).toBe(100);
    expect(sleepDurationScore(7)).toBe(100);
    expect(sleepDurationScore(9)).toBe(100);
    expect(sleepDurationScore(6)).toBe(75);
    expect(sleepDurationScore(5)).toBe(50);
    expect(sleepDurationScore(10)).toBe(75);
    expect(sleepDurationScore(4)).toBe(25);
  });

  it("scores regularity from recorded variation", () => {
    expect(sleepRegularityScore(0.4)).toBe(100);
    expect(sleepRegularityScore(0.8)).toBe(80);
    expect(sleepRegularityScore(1.4)).toBe(60);
    expect(sleepRegularityScore(1.9)).toBe(35);
    expect(sleepRegularityScore(2.5)).toBe(15);
  });

  it("uses published weights that sum to one for band-affecting factors", () => {
    const bandWeights = Object.values(FACTOR_META)
      .filter((meta) => meta.affectsBand)
      .reduce((total, meta) => total + meta.weight, 0);

    expect(bandWeights).toBeCloseTo(1);
  });
});

describe("isReadinessAssessment", () => {
  const assessment = assessReadiness({ checkIns: [makeCheckIn()], now: NOW });

  it("accepts an assessment produced by the engine", () => {
    expect(isReadinessAssessment(assessment)).toBe(true);
  });

  it("rejects malformed or relabeled assessments", () => {
    expect(isReadinessAssessment(null)).toBe(false);
    expect(isReadinessAssessment({ ...assessment, band: "great" })).toBe(false);
    expect(isReadinessAssessment({ ...assessment, dataClasses: ["simulated"] })).toBe(
      false,
    );
    expect(
      isReadinessAssessment({
        ...assessment,
        factors: [{ id: "fatigue", score: 50 }],
      }),
    ).toBe(false);
  });
});
