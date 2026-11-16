import { describe, expect, it } from "vitest";
import { buildSimulatedVitals } from "@/features/vitals/vitals-simulation";
import {
  buildDashboardSnapshot,
  elapsedClock,
  HMC_RANGES,
  pointsInRange,
} from "./dashboard-data";

const NOW = new Date("2026-11-16T12:00:00Z");

describe("HMC simulation data boundary", () => {
  it("reuses deterministic simulation without personal or research inputs", () => {
    const first = buildDashboardSnapshot(NOW);
    expect(first).toEqual(buildDashboardSnapshot(NOW));
    expect(first.generator).toBe("astatine.vitals-simulation");
    expect(first.note).toMatch(/not personal observations/);
    expect(first.series.heartRate).toHaveLength(1441);
    expect(first.series.heartRate[0]?.observedAt).toBe("2026-11-15T12:00:00.000Z");
    expect(first.capturedAt).toBe(NOW.toISOString());
  });
  it.each(HMC_RANGES)(
    "filters the actual $label window without rewriting timestamps",
    ({ minutes }) => {
      const snapshot = buildDashboardSnapshot(NOW);
      const points = pointsInRange(
        snapshot.series.heartRate,
        snapshot.capturedAt,
        minutes,
      );
      expect(points).toHaveLength(minutes + 1);
      expect(points.at(-1)).toBe(snapshot.series.heartRate.at(-1));
      expect(
        Date.parse(points.at(-1)!.observedAt) - Date.parse(points[0]!.observedAt),
      ).toBe(minutes * 60_000);
    },
  );
  it("keeps systolic and diastolic channels paired", () => {
    for (const point of buildDashboardSnapshot(NOW).series.bloodPressure) {
      expect(point.secondaryValue).toBeGreaterThan(0);
      expect(point.secondaryValue).toBeLessThan(point.value);
    }
  });
  it("does not change the existing Vitals sampling defaults", () => {
    const snapshot = buildSimulatedVitals(NOW);
    expect(snapshot.series.heartRate).toHaveLength(13);
    expect(
      Date.parse(snapshot.series.heartRate[1]!.observedAt) -
        Date.parse(snapshot.series.heartRate[0]!.observedAt),
    ).toBe(7_200_000);
  });
  it("leaves an empty time window empty instead of inventing measurements", () => {
    expect(pointsInRange([], NOW.toISOString(), 15)).toEqual([]);
    expect(
      pointsInRange(
        [{ observedAt: "2026-11-16T12:01:00Z", value: 70 }],
        NOW.toISOString(),
        15,
      ),
    ).toEqual([]);
  });
  it("formats elapsed time without wrapping after 24 hours", () => {
    expect(elapsedClock(767_000)).toBe("T+ 00:12:47");
    expect(elapsedClock(90_061_000)).toBe("T+ 25:01:01");
    expect(elapsedClock(-1000)).toBe("T+ 00:00:00");
  });
});
