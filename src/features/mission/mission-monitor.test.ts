import { describe, expect, it } from "vitest";

import {
  buildMissionTimeline,
  validateMissionPlan,
} from "@/features/mission/mission-engine";
import {
  MISSION_MONITOR_SEED,
  buildMissionMonitorSnapshot,
  formatMissionClock,
} from "@/features/mission/mission-monitor";
import {
  SIMULATED_MISSION_PHASES,
  createSimulatedMission,
} from "@/features/mission/simulated-mission";

describe("simulated mission plan", () => {
  it("creates a valid simulated plan with the repository-defined phases", () => {
    const plan = createSimulatedMission(new Date("2026-01-01T00:00:00.000Z"));
    const result = validateMissionPlan(plan);

    expect(result.ok).toBe(true);
    expect(plan.label).toBe("simulated");
    expect(plan.startAt).toBe("2026-01-01T00:00:00.000Z");
    expect(plan.phases).toHaveLength(SIMULATED_MISSION_PHASES.length);
    expect(plan.phases.map((phase) => phase.id)).toEqual([
      "systems-check",
      "science-block",
      "meal-rest",
      "maintenance",
      "crew-conference",
    ]);
  });
});

describe("buildMissionMonitorSnapshot", () => {
  const plan = createSimulatedMission(new Date("2026-01-01T00:00:00.000Z"));

  it("returns a deterministic synthetic snapshot for the active phase", () => {
    const timeline = buildMissionTimeline(plan, "2026-01-01T02:05:00.000Z");
    const snapshot = buildMissionMonitorSnapshot(timeline);

    expect(snapshot).not.toBeNull();
    if (!snapshot) return;
    expect(snapshot.phaseId).toBe("science-block");
    expect(snapshot.phaseLabel).toBe("Science block");
    expect(snapshot.scenarioId).toBe("steady-orbit");
    expect(snapshot.readings.map((reading) => reading.channel)).toEqual([
      "heartRate",
      "respiratoryRate",
      "skinTemperature",
    ]);
    for (const reading of snapshot.readings) {
      expect(reading.value).toBeGreaterThan(0);
      expect(reading.signalQuality).toBeGreaterThanOrEqual(0);
      expect(reading.signalQuality).toBeLessThanOrEqual(1);
      expect(Date.parse(reading.capturedAt)).toBeGreaterThanOrEqual(
        Date.parse("2026-01-01T00:45:00.000Z"),
      );
    }
  });

  it("produces the same snapshot for the same timeline and seed", () => {
    const timeline = buildMissionTimeline(plan, "2026-01-01T02:05:00.000Z");

    expect(buildMissionMonitorSnapshot(timeline, MISSION_MONITOR_SEED)).toEqual(
      buildMissionMonitorSnapshot(timeline, MISSION_MONITOR_SEED),
    );
  });

  it("returns no snapshot outside an active phase", () => {
    const before = buildMissionTimeline(plan, "2025-12-31T23:00:00.000Z");
    const after = buildMissionTimeline(plan, "2026-01-02T00:00:00.000Z");

    expect(buildMissionMonitorSnapshot(before)).toBeNull();
    expect(buildMissionMonitorSnapshot(after)).toBeNull();
  });
});

describe("formatMissionClock", () => {
  it("formats minute values as a compact mission clock", () => {
    expect(formatMissionClock(0)).toBe("0 min");
    expect(formatMissionClock(45)).toBe("45 min");
    expect(formatMissionClock(125)).toBe("2 h 05 min");
    expect(formatMissionClock(300)).toBe("5 h 00 min");
    expect(formatMissionClock(-4)).toBe("0 min");
  });
});
