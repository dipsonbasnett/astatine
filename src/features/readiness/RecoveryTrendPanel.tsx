import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SourceBadge } from "@/components/ui/SourceBadge";
import type { SimulatedRecoveryTrend } from "@/types/health";

export interface RecoveryTrendPanelProps {
  trend: SimulatedRecoveryTrend;
}

export function RecoveryTrendPanel({ trend }: RecoveryTrendPanelProps) {
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
        {trend.points.map((point) => (
          <li key={point.dayOffset} className="flex flex-col items-center gap-1.5">
            <div
              aria-hidden="true"
              className="flex h-24 w-full items-end overflow-hidden rounded-sm bg-raised/50"
            >
              <div
                className="w-full rounded-sm bg-ink-subtle/60"
                style={{ height: `${point.value}%` }}
              />
            </div>
            <span className="font-mono text-[0.625rem] text-ink-subtle">
              {point.label}
            </span>
            <span className="sr-only">
              Simulated recovery value {point.value} of 100 on {point.label}
            </span>
          </li>
        ))}
      </ul>

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
