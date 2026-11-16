import type { SimulatedRecoveryTrend, SimulatedTrendPoint } from "@/types/health";

export const RECOVERY_TREND_GENERATOR = "astatine.recovery-trend";
export const RECOVERY_TREND_GENERATOR_VERSION = 1;
export const RECOVERY_TREND_LABEL = "Simulated recovery trend";
export const RECOVERY_TREND_SEED = 20261116;

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

export interface BuildRecoveryTrendOptions {
  windowDays?: 7 | 14;
  seed?: number;
}

export function buildSimulatedRecoveryTrend({
  windowDays = 7,
  seed = RECOVERY_TREND_SEED,
}: BuildRecoveryTrendOptions = {}): SimulatedRecoveryTrend {
  const random = mulberry32(seed ^ windowDays);
  const points: SimulatedTrendPoint[] = [];

  for (let index = 0; index < windowDays; index += 1) {
    const dayOffset = index - (windowDays - 1);
    const wave = Math.sin((index / Math.max(1, windowDays - 1)) * Math.PI * 1.6);
    const drift = (index / Math.max(1, windowDays - 1)) * 4;
    const noise = (random() - 0.5) * 6;
    const value = Math.min(88, Math.max(45, 64 + wave * 5 + drift + noise));
    points.push({
      dayOffset,
      label: dayOffset === 0 ? "D0" : `D${dayOffset}`,
      value: Math.round(value * 10) / 10,
    });
  }

  return {
    label: RECOVERY_TREND_LABEL,
    source: {
      category: "simulated",
      origin: "generator",
      label: "Simulated · generated illustration",
      generator: RECOVERY_TREND_GENERATOR,
      generatorVersion: RECOVERY_TREND_GENERATOR_VERSION,
      scenarioId: `recovery-trend-${windowDays}-day`,
      seed,
    },
    points,
    note: "Illustrative synthetic values only. This trend is generated in the browser, is not stored as an observation, and never affects the recorded readiness band.",
    affectsReadinessBand: false,
  };
}
