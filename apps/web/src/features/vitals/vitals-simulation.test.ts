import { describe, expect, it } from "vitest";

import {
  VITALS_SIMULATION_GENERATOR,
  VITALS_SIMULATION_SEED,
  buildSimulatedVitals,
  buildSimulatedVitalsMonitor,
} from "./vitals-simulation";

const NOW = new Date("2026-11-16T12:00:00.000Z");

describe("simulated vitals", () => {
  it("is deterministic for the same seed and display time", () => {
    const first = buildSimulatedVitals(NOW);
    const second = buildSimulatedVitals(NOW);

    expect(first).toEqual(second);
    expect(first.generator).toBe(VITALS_SIMULATION_GENERATOR);
    expect(first.seed).toBe(VITALS_SIMULATION_SEED);
    expect(first.capturedAt).toBe(NOW.toISOString());
  });

  it("produces plausible demonstration ranges with a systolic above diastolic", () => {
    const simulation = buildSimulatedVitals(NOW);

    for (const point of simulation.series.heartRate) {
      expect(point.value).toBeGreaterThanOrEqual(60);
      expect(point.value).toBeLessThanOrEqual(80);
    }
    for (const point of simulation.series.spo2) {
      expect(point.value).toBeGreaterThanOrEqual(94);
      expect(point.value).toBeLessThanOrEqual(99.9);
    }
    for (const point of simulation.series.bloodPressure) {
      expect(point.secondaryValue).toBeTypeOf("number");
      expect(point.value).toBeGreaterThan(point.secondaryValue ?? 0);
    }
    expect(simulation.series.heartRate).toHaveLength(13);
    expect(simulation.note).toMatch(/synthetic/i);
  });

  it("builds a four-channel monitor snapshot from the same simulation", () => {
    const monitor = buildSimulatedVitalsMonitor(NOW);

    expect(monitor.readings.map((reading) => reading.channel)).toEqual([
      "heartRate",
      "respiratoryRate",
      "spo2",
      "bloodPressure",
    ]);
    expect(monitor.capturedAt).toBe(NOW.toISOString());
    expect(monitor.note).toMatch(/never enter readiness, reports, or recorded views/i);
  });

  it("rejects an invalid display time", () => {
    expect(() => buildSimulatedVitals(new Date(Number.NaN))).toThrow(RangeError);
  });
});
