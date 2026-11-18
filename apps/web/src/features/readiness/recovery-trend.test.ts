import { describe, expect, it } from "vitest";

import {
  RECOVERY_TREND_GENERATOR,
  RECOVERY_TREND_GENERATOR_VERSION,
  RECOVERY_TREND_LABEL,
  buildSimulatedRecoveryTrend,
} from "./recovery-trend";

describe("buildSimulatedRecoveryTrend", () => {
  it("builds a deterministic, clearly labeled simulated trend", () => {
    const first = buildSimulatedRecoveryTrend({ windowDays: 7 });
    const second = buildSimulatedRecoveryTrend({ windowDays: 7 });

    expect(first).toEqual(second);
    expect(first.label).toBe(RECOVERY_TREND_LABEL);
    expect(first.affectsReadinessBand).toBe(false);
    expect(first.source).toMatchObject({
      category: "simulated",
      origin: "generator",
      generator: RECOVERY_TREND_GENERATOR,
      generatorVersion: RECOVERY_TREND_GENERATOR_VERSION,
      scenarioId: "recovery-trend-7-day",
    });
    expect(first.note).toMatch(/never affects the recorded readiness band/i);
  });

  it("returns one point per day with stable relative labels", () => {
    const week = buildSimulatedRecoveryTrend({ windowDays: 7 });
    const fortnight = buildSimulatedRecoveryTrend({ windowDays: 14 });

    expect(week.points).toHaveLength(7);
    expect(week.points.map((point) => point.label)).toEqual([
      "D-6",
      "D-5",
      "D-4",
      "D-3",
      "D-2",
      "D-1",
      "D0",
    ]);
    expect(fortnight.points).toHaveLength(14);
    expect(fortnight.points[0]?.label).toBe("D-13");
    expect(fortnight.source.scenarioId).toBe("recovery-trend-14-day");
  });

  it("keeps illustrative values inside a bounded range", () => {
    for (const point of buildSimulatedRecoveryTrend({ windowDays: 14 }).points) {
      expect(point.value).toBeGreaterThanOrEqual(45);
      expect(point.value).toBeLessThanOrEqual(88);
    }
  });
});
