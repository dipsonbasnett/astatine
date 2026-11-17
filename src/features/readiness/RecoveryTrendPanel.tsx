import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SourceBadge } from "@/components/ui/SourceBadge";
import type { SimulatedRecoveryTrend } from "@/types/health";

export interface RecoveryTrendPanelProps {
  trend: SimulatedRecoveryTrend;
}

export function RecoveryTrendPanel({ trend }: RecoveryTrendPanelProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const active =
    trend.points.find((point) => point.dayOffset === selectedDay) ??
    trend.points[trend.points.length - 1];

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-label text-ink-subtle uppercase">Illustration</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
            {trend.label}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <SourceBadge category="simulated">Simulated</SourceBadge>
          <Badge>Not used in readiness</Badge>
        </div>
      </div>

      <ul
        aria-label="Simulated daily recovery values"
        className="mt-6 grid grid-cols-7 items-end gap-x-2 gap-y-5"
      >
        {trend.points.map((point) => {
          const isActive = point.dayOffset === active?.dayOffset;

          return (
            <li key={point.dayOffset}>
              <button
                type="button"
                aria-label={`${point.label}: simulated recovery ${point.value} of 100`}
                aria-pressed={isActive}
                onMouseEnter={() => {
                  setSelectedDay(point.dayOffset);
                }}
                onFocus={() => {
                  setSelectedDay(point.dayOffset);
                }}
                onClick={() => {
                  setSelectedDay(point.dayOffset);
                }}
                className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              >
                <span
                  aria-hidden="true"
                  className="flex h-24 w-full items-end overflow-hidden rounded-sm bg-raised/50"
                >
                  <span
                    className={`w-full rounded-sm transition-colors motion-reduce:transition-none ${
                      isActive ? "bg-accent" : "bg-ink-subtle/60"
                    }`}
                    style={{ height: `${point.value}%` }}
                  />
                </span>
                <span
                  className={`font-mono text-[0.625rem] ${
                    isActive ? "text-ink" : "text-ink-subtle"
                  }`}
                >
                  {point.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-control border border-line bg-raised/40 px-3 py-2">
        <span className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
          Selected day
        </span>
        <span className="font-mono text-sm text-ink">
          {active ? `${active.label} · ${active.value} of 100` : "No simulated values"}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-ink-subtle">
        Select a day to inspect its simulated value. Hovering or focusing a bar also
        updates this readout.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
          {trend.source.generator} · v{trend.source.generatorVersion} · seed{" "}
          {trend.source.seed}
        </span>
      </div>
      <p className="mt-3 max-w-prose text-xs leading-5 text-ink-subtle">{trend.note}</p>
    </Card>
  );
}
