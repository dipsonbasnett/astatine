import { describe, expect, it } from "vitest";

import {
  SIMULATED_SCENARIOS,
  SIMULATED_TELEMETRY_LABEL,
  TELEMETRY_CHANNELS,
  TELEMETRY_GENERATOR,
  TELEMETRY_GENERATOR_VERSION,
  findTelemetryScenario,
  simulateTelemetry,
} from "./telemetry-engine";

const START = "2026-11-16T09:00:00.000Z";

describe("simulateTelemetry", () => {
  it("produces deterministic, complete samples for a scenario and seed", () => {
    const first = simulateTelemetry({
      scenarioId: "steady-orbit",
      seed: 42,
      startedAt: START,
    });
    const second = simulateTelemetry({
      scenarioId: "steady-orbit",
      seed: 42,
      startedAt: START,
    });

    expect(first).toEqual(second);
    expect(first).toHaveLength(7 * 3);
    expect(new Set(first.map((sample) => sample.capturedAt)).size).toBe(7);
    expect(first.map((sample) => sample.channel)).toEqual(
      Array.from({ length: 7 }, () => Object.keys(TELEMETRY_CHANNELS)).flat(),
    );
  });

  it("varies output with the seed and scenario", () => {
    const seedA = simulateTelemetry({
      scenarioId: "steady-orbit",
      seed: 1,
      startedAt: START,
    });
    const seedB = simulateTelemetry({
      scenarioId: "steady-orbit",
      seed: 2,
      startedAt: START,
    });
    const otherScenario = simulateTelemetry({
      scenarioId: "light-activity",
      seed: 1,
      startedAt: START,
    });

    expect(seedA.map((sample) => sample.value)).not.toEqual(
      seedB.map((sample) => sample.value),
    );
    expect(seedA.map((sample) => sample.value)).not.toEqual(
      otherScenario.map((sample) => sample.value),
    );
  });

  it("spaces captures by the scenario interval", () => {
    const samples = simulateTelemetry({
      scenarioId: "rest-window",
      seed: 7,
      startedAt: START,
    });
    const captures = Array.from(new Set(samples.map((sample) => sample.capturedAt)));

    expect(captures).toEqual([
      "2026-11-16T09:00:00.000Z",
      "2026-11-16T09:04:00.000Z",
      "2026-11-16T09:08:00.000Z",
      "2026-11-16T09:12:00.000Z",
      "2026-11-16T09:16:00.000Z",
      "2026-11-16T09:20:00.000Z",
      "2026-11-16T09:24:00.000Z",
    ]);
  });

  it("labels every sample as simulated with generator provenance", () => {
    const samples = simulateTelemetry({
      scenarioId: "steady-orbit",
      seed: 99,
      startedAt: START,
    });

    for (const sample of samples) {
      expect(sample.source).toEqual({
        category: "simulated",
        origin: "generator",
        label: SIMULATED_TELEMETRY_LABEL,
        generator: TELEMETRY_GENERATOR,
        generatorVersion: TELEMETRY_GENERATOR_VERSION,
        scenarioId: "steady-orbit",
        seed: 99,
      });
      expect(sample.scenarioId).toBe(sample.source.scenarioId);
      expect(sample.signalQuality).toBeGreaterThanOrEqual(0.82);
      expect(sample.signalQuality).toBeLessThanOrEqual(0.97);
      expect(sample.unit).toBe(TELEMETRY_CHANNELS[sample.channel].unit);
    }
  });

  it("keeps values inside each scenario's declared band", () => {
    for (const scenario of SIMULATED_SCENARIOS) {
      const samples = simulateTelemetry({
        scenarioId: scenario.id,
        seed: 123,
        startedAt: START,
      });
      for (const sample of samples) {
        const channel = scenario.channels[sample.channel];
        const factor = 10 ** TELEMETRY_CHANNELS[sample.channel].decimals;
        const minimum = Math.round((channel.base - channel.variance) * factor) / factor;
        const maximum = Math.round((channel.base + channel.variance) * factor) / factor;
        expect(sample.value).toBeGreaterThanOrEqual(minimum);
        expect(sample.value).toBeLessThanOrEqual(maximum);
      }
    }
  });

  it("rejects unknown scenarios, invalid seeds, and invalid start times", () => {
    expect(() =>
      simulateTelemetry({ scenarioId: "unknown", seed: 1, startedAt: START }),
    ).toThrow(RangeError);
    expect(() =>
      simulateTelemetry({
        scenarioId: "steady-orbit",
        seed: Number.NaN,
        startedAt: START,
      }),
    ).toThrow(RangeError);
    expect(() =>
      simulateTelemetry({ scenarioId: "steady-orbit", seed: 1, startedAt: "nope" }),
    ).toThrow(RangeError);
  });
});

describe("findTelemetryScenario", () => {
  it("finds bundled scenarios by id", () => {
    expect(findTelemetryScenario("steady-orbit")?.label).toBe("Steady orbit shift");
    expect(findTelemetryScenario("missing")).toBeUndefined();
  });
});
