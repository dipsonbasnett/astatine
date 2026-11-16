import {
  TELEMETRY_CHANNELS,
  findTelemetryScenario,
  simulateTelemetry,
} from "@/features/telemetry/telemetry-engine";
import type { MissionTimeline, TelemetryChannel } from "@/types/health";

import { MISSION_MONITOR_SCENARIO_BY_PHASE } from "./simulated-mission";

export const MISSION_MONITOR_SEED = 20261116;

export interface MissionTelemetryReading {
  channel: TelemetryChannel;
  label: string;
  value: number;
  unit: string;
  decimals: number;
  signalQuality: number;
  capturedAt: string;
}

export interface MissionMonitorSnapshot {
  phaseId: string;
  phaseLabel: string;
  scenarioId: string;
  capturedAt: string;
  readings: MissionTelemetryReading[];
}

export function buildMissionMonitorSnapshot(
  timeline: MissionTimeline,
  seed = MISSION_MONITOR_SEED,
): MissionMonitorSnapshot | null {
  const activePhase = timeline.phases.find((phase) => phase.status === "active");
  if (!activePhase) return null;

  const scenarioId = MISSION_MONITOR_SCENARIO_BY_PHASE[activePhase.id] ?? "steady-orbit";
  const scenario = findTelemetryScenario(scenarioId);
  if (!scenario) return null;

  const elapsedWithinPhase = (activePhase.progress / 100) * activePhase.durationMinutes;
  const cycleMinutes = elapsedWithinPhase % scenario.durationMinutes;
  const sampleIndex = Math.floor(cycleMinutes / scenario.intervalMinutes);
  const capturedAt = new Date(
    Date.parse(activePhase.startsAt) + sampleIndex * scenario.intervalMinutes * 60_000,
  ).toISOString();

  const samples = simulateTelemetry({
    scenarioId,
    seed,
    startedAt: activePhase.startsAt,
  });

  const readings: MissionTelemetryReading[] = [];
  for (const channel of Object.keys(TELEMETRY_CHANNELS) as TelemetryChannel[]) {
    const definition = TELEMETRY_CHANNELS[channel];
    const sample = samples.find(
      (candidate) => candidate.channel === channel && candidate.capturedAt === capturedAt,
    );
    if (!sample) return null;

    readings.push({
      channel,
      label: definition.label,
      value: sample.value,
      unit: sample.unit,
      decimals: definition.decimals,
      signalQuality: sample.signalQuality,
      capturedAt: sample.capturedAt,
    });
  }

  return {
    phaseId: activePhase.id,
    phaseLabel: activePhase.label,
    scenarioId,
    capturedAt,
    readings,
  };
}

export function formatMissionClock(totalMinutes: number): string {
  const wholeMinutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(wholeMinutes / 60);
  const minutes = wholeMinutes % 60;

  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${String(minutes).padStart(2, "0")} min`;
}
