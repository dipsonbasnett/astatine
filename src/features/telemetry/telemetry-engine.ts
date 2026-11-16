import type { TelemetryChannel, TelemetrySampleDraft } from "@/types/health";

export const TELEMETRY_GENERATOR = "astatine.telemetry";
export const TELEMETRY_GENERATOR_VERSION = 1;
export const SIMULATED_TELEMETRY_LABEL = "Simulated demonstration telemetry";

export interface TelemetryChannelDefinition {
  label: string;
  unit: string;
  decimals: number;
}

export const TELEMETRY_CHANNELS: Record<TelemetryChannel, TelemetryChannelDefinition> = {
  heartRate: { label: "Heart rate", unit: "bpm", decimals: 0 },
  respiratoryRate: { label: "Respiratory rate", unit: "breaths/min", decimals: 1 },
  skinTemperature: { label: "Skin temperature", unit: "°C", decimals: 1 },
};

interface ChannelSimulation {
  base: number;
  variance: number;
}

export interface TelemetryScenario {
  id: string;
  label: string;
  description: string;
  durationMinutes: number;
  intervalMinutes: number;
  channels: Record<TelemetryChannel, ChannelSimulation>;
}

export const SIMULATED_SCENARIOS: readonly TelemetryScenario[] = [
  {
    id: "steady-orbit",
    label: "Steady orbit shift",
    description:
      "Synthetic values around a calm, seated demonstration period. Not a measurement of any person.",
    durationMinutes: 24,
    intervalMinutes: 4,
    channels: {
      heartRate: { base: 68, variance: 5 },
      respiratoryRate: { base: 14, variance: 1.6 },
      skinTemperature: { base: 35.2, variance: 0.4 },
    },
  },
  {
    id: "light-activity",
    label: "Light activity block",
    description:
      "Synthetic values around a mild movement demonstration. Not exercise guidance or a health assessment.",
    durationMinutes: 24,
    intervalMinutes: 4,
    channels: {
      heartRate: { base: 98, variance: 9 },
      respiratoryRate: { base: 20.5, variance: 1.8 },
      skinTemperature: { base: 35.8, variance: 0.4 },
    },
  },
  {
    id: "rest-window",
    label: "Rest window",
    description:
      "Synthetic values around a quiet demonstration period. Not sleep tracking or a measurement of any person.",
    durationMinutes: 24,
    intervalMinutes: 4,
    channels: {
      heartRate: { base: 60, variance: 4 },
      respiratoryRate: { base: 12.2, variance: 1.2 },
      skinTemperature: { base: 35.0, variance: 0.3 },
    },
  },
];

export function findTelemetryScenario(scenarioId: string): TelemetryScenario | undefined {
  return SIMULATED_SCENARIOS.find((scenario) => scenario.id === scenarioId);
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export interface SimulateTelemetryOptions {
  scenarioId: string;
  seed: number;
  startedAt: string;
}

export function simulateTelemetry({
  scenarioId,
  seed,
  startedAt,
}: SimulateTelemetryOptions): TelemetrySampleDraft[] {
  const scenario = findTelemetryScenario(scenarioId);
  if (!scenario) throw new RangeError(`Unknown telemetry scenario: ${scenarioId}`);
  if (!Number.isFinite(seed)) throw new RangeError("Telemetry seed must be finite.");
  if (!Number.isFinite(Date.parse(startedAt))) {
    throw new RangeError("Telemetry start time must be a valid timestamp.");
  }

  const random = mulberry32(seed);
  const startMs = Date.parse(startedAt);
  const captureCount =
    Math.floor(scenario.durationMinutes / scenario.intervalMinutes) + 1;
  const samples: TelemetrySampleDraft[] = [];

  for (let index = 0; index < captureCount; index += 1) {
    const capturedAt = new Date(
      startMs + index * scenario.intervalMinutes * 60_000,
    ).toISOString();

    for (const channel of Object.keys(TELEMETRY_CHANNELS) as TelemetryChannel[]) {
      const definition = TELEMETRY_CHANNELS[channel];
      const channelSimulation = scenario.channels[channel];
      const value = round(
        channelSimulation.base + (random() * 2 - 1) * channelSimulation.variance,
        definition.decimals,
      );

      samples.push({
        scenarioId: scenario.id,
        channel,
        capturedAt,
        value,
        unit: definition.unit,
        signalQuality: round(0.82 + random() * 0.15, 2),
        source: {
          category: "simulated",
          origin: "generator",
          label: SIMULATED_TELEMETRY_LABEL,
          generator: TELEMETRY_GENERATOR,
          generatorVersion: TELEMETRY_GENERATOR_VERSION,
          scenarioId: scenario.id,
          seed,
        },
      });
    }
  }

  return samples;
}
