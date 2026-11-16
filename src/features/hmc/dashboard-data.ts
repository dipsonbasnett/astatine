import { buildSimulatedVitals } from "@/features/vitals/vitals-simulation";
import type { VitalPoint } from "@/types/health";

export const HMC_RANGES = [
  { minutes: 15, label: "15 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 360, label: "6 hours" },
  { minutes: 1440, label: "24 hours" },
] as const;
export type HmcRange = (typeof HMC_RANGES)[number]["minutes"];

export function buildDashboardSnapshot(now: Date, pointCount = 1441) {
  return buildSimulatedVitals(now, undefined, { intervalMinutes: 1, pointCount });
}

export function pointsInRange(
  points: readonly VitalPoint[],
  end: string,
  minutes: HmcRange,
) {
  const endMs = Date.parse(end);
  const startMs = endMs - minutes * 60_000;
  return points.filter((point) => {
    const time = Date.parse(point.observedAt);
    return time >= startMs && time <= endMs;
  });
}

export function elapsedClock(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `T+ ${[
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((part) => String(part).padStart(2, "0"))
    .join(":")}`;
}

export function clockTime(timestamp: string) {
  return new Date(timestamp).toISOString().slice(11, 16);
}
