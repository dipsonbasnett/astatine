import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";
import type { CheckInRecord } from "@/types/health";

import { assessReadiness } from "@/features/readiness/readiness-engine";

import {
  COUNTERMEASURE_BASIS,
  buildCountermeasureCoach,
  buildCountermeasurePlan,
  isCountermeasurePlan,
} from "./countermeasure-engine";

const NOW = new Date("2026-11-16T10:00:00.000Z");

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

function fullPracticeWeek(): CheckInRecord[] {
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
    }),
  );
}

function assessmentFor(overrides: Parameters<typeof makeCheckIn>[0] = {}) {
  const assessment = assessReadiness({
    checkIns: [makeCheckIn(overrides)],
    now: NOW,
  });
  if (!assessment) throw new Error("Expected an assessment fixture.");
  return assessment;
}

describe("buildCountermeasureCoach", () => {
  it("covers every coach domain in a stable order with source labels", () => {
    const coach = buildCountermeasureCoach(assessmentFor());

    expect(coach.items.map((item) => item.id)).toEqual([
      "exercise",
      "sleep",
      "hydration",
      "nutrition",
      "workload",
      "checkIn",
    ]);
    expect(coach.items.every((item) => item.sources.length > 0)).toBe(true);
    expect(coach.windowDays).toBe(7);
    expect(coach.generatedFor).toBe("2026-11-16T08:00:00.000Z");
  });

  it("marks partial and missing domains honestly instead of inventing data", () => {
    const coach = buildCountermeasureCoach(assessmentFor());
    const byId = new Map(coach.items.map((item) => [item.id, item]));

    expect(byId.get("exercise")?.status).toBe("missing-data");
    expect(byId.get("hydration")?.status).toBe("missing-data");
    expect(byId.get("nutrition")?.status).toBe("missing-data");
    expect(byId.get("sleep")?.status).toBe("attention");
    expect(byId.get("sleep")?.missingData).toMatch(/three check-ins/i);
    expect(byId.get("workload")?.missingData).toMatch(/Workload was not recorded/);
    expect(byId.get("checkIn")?.status).toBe("attention");
  });

  it("links verified research context only where one is available", () => {
    const coach = buildCountermeasureCoach(assessmentFor());
    const byId = new Map(coach.items.map((item) => [item.id, item]));

    expect(byId.get("sleep")?.research).toMatchObject({
      publisher: "NASA",
      url: "https://www.nasa.gov/hrp/",
      accessedAt: "2026-11-16",
    });
    expect(byId.get("exercise")?.research?.url).toBe("https://www.nasa.gov/hrp/");
    expect(byId.get("nutrition")?.research).toBeNull();
    expect(byId.get("hydration")?.research).toBeNull();
    expect(
      byId.get("sleep")?.sources.some((source) => source.category === "research"),
    ).toBe(true);
    expect(coach.dataClasses).toEqual(["recorded", "research"]);
    expect(coach.researchNote).toMatch(/verified public NASA program page/i);
  });

  it("summarizes attention and data gaps without clinical language", () => {
    const coach = buildCountermeasureCoach(assessmentFor());

    expect(coach.summary).toContain("Monitor");
    expect(coach.summary).toContain("3 of 6 coach areas need attention");
    expect(coach.summary).toContain("3 areas have no usable recorded data");
    for (const caveat of coach.caveats) {
      expect(caveat).not.toMatch(/you should treat|prescribe/i);
    }
    expect(coach.caveats.join(" ")).toMatch(/not diagnosis/);
  });

  it("reports every domain on track with a full paired week", () => {
    const assessment = assessReadiness({ checkIns: fullPracticeWeek(), now: NOW });
    if (!assessment) throw new Error("Expected an assessment fixture.");
    const coach = buildCountermeasureCoach(assessment);

    expect(coach.items.every((item) => item.status === "on-track")).toBe(true);
    expect(coach.items.every((item) => item.missingData === null)).toBe(true);
    expect(coach.summary).toContain("0 of 6 coach areas need attention");
  });
});

describe("buildCountermeasurePlan", () => {
  it("targets the lowest band-affecting factor with an explainable trigger", () => {
    const plan = buildCountermeasurePlan(assessmentFor());

    expect(plan.suggestions).toHaveLength(2);
    expect(plan.suggestions[0]).toMatchObject({
      factorId: "workloadFatigue",
      priority: "primary",
      trigger: { label: "Workload and fatigue", score: 50, status: "mixed" },
    });
    expect(plan.suggestions[1]?.priority).toBe("supporting");
    expect(plan.suggestions[1]?.factorId).not.toBe("workloadFatigue");
    expect(plan.basis).toBe(COUNTERMEASURE_BASIS);
    expect(plan.dataClasses).toEqual(["recorded"]);
  });

  it("suggests maintaining routines when every scored factor is strong", () => {
    const assessment = assessReadiness({ checkIns: fullPracticeWeek(), now: NOW });
    if (!assessment) throw new Error("Expected an assessment fixture.");
    const plan = buildCountermeasurePlan(assessment);

    expect(plan.suggestions).toHaveLength(1);
    expect(plan.suggestions[0]).toMatchObject({
      id: "countermeasure.sleepDuration",
      priority: "primary",
      title: "Maintain current routines",
    });
    expect(plan.suggestions[0]?.rationale).toContain("at or above 70");
  });

  it("keeps every suggestion non-clinical and caution-bearing", () => {
    const plan = buildCountermeasurePlan(assessmentFor({ fatigue: 5 }));

    for (const suggestion of plan.suggestions) {
      expect(suggestion.caution.length).toBeGreaterThan(0);
      expect(suggestion.rationale).toContain(`${suggestion.trigger.score}/100`);
      expect(suggestion.title).not.toMatch(/treat|diagnos|prescrib/i);
    }
    expect(plan.caveats.join(" ")).toMatch(/not diagnosis/);
  });

  it("passes its own structural guard", () => {
    expect(isCountermeasurePlan(buildCountermeasurePlan(assessmentFor()))).toBe(true);
    expect(isCountermeasurePlan(null)).toBe(false);
    expect(
      isCountermeasurePlan({
        suggestions: [],
        basis: COUNTERMEASURE_BASIS,
        caveats: [],
        dataClasses: ["recorded"],
      }),
    ).toBe(false);
    expect(
      isCountermeasurePlan({
        suggestions: [
          {
            id: "x",
            factorId: "fatigue",
            title: "x",
            rationale: "x",
            caution: "x",
            priority: "primary",
            trigger: { label: "x", score: 10, status: "mixed" },
          },
        ],
        basis: COUNTERMEASURE_BASIS,
        caveats: ["x"],
        dataClasses: ["recorded"],
      }),
    ).toBe(false);
  });
});
