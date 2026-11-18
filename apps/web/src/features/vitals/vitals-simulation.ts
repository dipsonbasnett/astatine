import type {
  SimulatedMonitorReading,
  SimulatedVitalsMonitor,
  VitalMonitorChannel,
  VitalPoint,
} from "@/types/health";

export const VITALS_SIMULATION_GENERATOR = "astatine.vitals-simulation";
export const VITALS_SIMULATION_VERSION = 1;
export const VITALS_SIMULATION_SEED = 20261116;
export const VITALS_SIMULATION_SCENARIO_ID = "steady-demonstration-day";
export const VITALS_SIMULATION_SCENARIO_LABEL = "Steady demonstration day";

export const VITALS_SIMULATION_NOTE =
  "Synthetic values generated in this browser at display time from a fixed scenario and seed. They are not sensor measurements, not personal observations, and never enter readiness, reports, or recorded views.";

const POINT_INTERVAL_HOURS = 2;
const POINT_COUNT = 13;

interface SimulatedVitalsSeries {
  heartRate: VitalPoint[];
  respiratoryRate: VitalPoint[];
  spo2: VitalPoint[];
  bloodPressure: VitalPoint[];
}

export interface SimulatedVitalsSnapshot {
  capturedAt: string;
  scenarioId: string;
  scenarioLabel: string;
  generator: string;
  generatorVersion: number;
  seed: number;
  series: SimulatedVitalsSeries;
  note: string;
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

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function buildSimulatedVitals(
  now: Date = new Date(),
  seed = VITALS_SIMULATION_SEED,
  sampling = { intervalMinutes: POINT_INTERVAL_HOURS * 60, pointCount: POINT_COUNT },
): SimulatedVitalsSnapshot {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) {
    throw new RangeError("Simulated vitals require a valid display time.");
  }
  if (!Number.isFinite(seed)) {
    throw new RangeError("Simulated vitals require a finite seed.");
  }

  const random = mulberry32(seed);
  const series: SimulatedVitalsSeries = {
    heartRate: [],
    respiratoryRate: [],
    spo2: [],
    bloodPressure: [],
  };
  const intervalMs = sampling.intervalMinutes * 60_000;

  for (let index = 0; index < sampling.pointCount; index += 1) {
    const observedAt = new Date(
      nowMs - (sampling.pointCount - 1 - index) * intervalMs,
    ).toISOString();
    const heartRate = round(70 + (random() * 2 - 1) * 6);
    const respiratoryRate = round(14 + (random() * 2 - 1) * 2, 1);
    const spo2 = round(clamp(97.2 + (random() * 2 - 1) * 1.4, 94, 99.9), 1);
    const systolic = round(117 + (random() * 2 - 1) * 7);
    const diastolic = round(76 + (random() * 2 - 1) * 4);

    series.heartRate.push({ observedAt, value: heartRate });
    series.respiratoryRate.push({ observedAt, value: respiratoryRate });
    series.spo2.push({ observedAt, value: spo2 });
    series.bloodPressure.push({
      observedAt,
      value: systolic,
      secondaryValue: Math.min(systolic - 20, diastolic),
    });
  }

  const capturedAt =
    series.heartRate[series.heartRate.length - 1]?.observedAt ??
    new Date(nowMs).toISOString();

  return {
    capturedAt,
    scenarioId: VITALS_SIMULATION_SCENARIO_ID,
    scenarioLabel: VITALS_SIMULATION_SCENARIO_LABEL,
    generator: VITALS_SIMULATION_GENERATOR,
    generatorVersion: VITALS_SIMULATION_VERSION,
    seed,
    series,
    note: VITALS_SIMULATION_NOTE,
  };
}

const MONITOR_DEFINITIONS: Readonly<
  Record<
    VitalMonitorChannel,
    { label: string; unit: string; decimals: number; series: keyof SimulatedVitalsSeries }
  >
> = {
  heartRate: {
    label: "Heart rate",
    unit: "bpm",
    decimals: 0,
    series: "heartRate",
  },
  respiratoryRate: {
    label: "Respiratory rate",
    unit: "breaths/min",
    decimals: 1,
    series: "respiratoryRate",
  },
  spo2: {
    label: "Oxygen saturation",
    unit: "%",
    decimals: 1,
    series: "spo2",
  },
  bloodPressure: {
    label: "Blood pressure style",
    unit: "mmHg",
    decimals: 0,
    series: "bloodPressure",
  },
};

export function buildSimulatedVitalsMonitor(
  now: Date = new Date(),
  seed = VITALS_SIMULATION_SEED,
): SimulatedVitalsMonitor {
  const simulation = buildSimulatedVitals(now, seed);
  const readings: SimulatedMonitorReading[] = [];

  for (const channel of Object.keys(MONITOR_DEFINITIONS) as VitalMonitorChannel[]) {
    const definition = MONITOR_DEFINITIONS[channel];
    const points = simulation.series[definition.series];
    const latest = points[points.length - 1];
    if (!latest) continue;

    readings.push({
      channel,
      label: definition.label,
      value: latest.value,
      ...(latest.secondaryValue === undefined
        ? {}
        : { secondaryValue: latest.secondaryValue }),
      unit: definition.unit,
      decimals: definition.decimals,
    });
  }

  return {
    capturedAt: simulation.capturedAt,
    scenarioId: simulation.scenarioId,
    scenarioLabel: simulation.scenarioLabel,
    generator: simulation.generator,
    generatorVersion: simulation.generatorVersion,
    seed: simulation.seed,
    readings,
    note: VITALS_SIMULATION_NOTE,
  };
}
