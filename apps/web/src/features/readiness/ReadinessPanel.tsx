import { useId } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import type {
  ReadinessAssessment,
  ReadinessFactor,
  ReadinessFactorStatus,
} from "@/types/health";

import {
  READINESS_BAND_DESCRIPTIONS,
  READINESS_BAND_LABELS,
  READINESS_CONFIDENCE_LABELS,
} from "./readiness-engine";

const STATUS_LABELS: Record<ReadinessFactorStatus, string> = {
  supports: "Supports",
  mixed: "Mixed",
  limits: "Limits",
  missing: "Missing",
};

function FactorRow({ factor }: { factor: ReadinessFactor }) {
  return (
    <li className="rounded-control border border-line bg-canvas/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">{factor.label}</p>
          <p className="mt-0.5 text-xs leading-5 text-ink-muted">{factor.valueLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={factor.status === "supports" ? "accent" : "neutral"}>
            {STATUS_LABELS[factor.status]}
          </Badge>
          <span className="font-mono text-xs text-ink-subtle">
            {factor.score === null ? "—" : `${factor.score}/100`}
          </span>
        </div>
      </div>

      {factor.score !== null ? (
        <div
          role="meter"
          aria-label={`${factor.label} rubric score`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={factor.score}
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised"
        >
          <div
            aria-hidden="true"
            className={cn(
              "h-full rounded-full bg-accent",
              factor.status === "supports" && "opacity-100",
              factor.status === "mixed" && "opacity-60",
              factor.status === "limits" && "opacity-35",
            )}
            style={{ width: `${factor.score}%` }}
          />
        </div>
      ) : (
        <p className="mt-3 rounded-control border border-dashed border-line px-3 py-2 text-xs leading-5 text-ink-subtle">
          Not enough data for this input. It is left empty and excluded from the band.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SourceBadge category="recorded">{factor.sourceLabel}</SourceBadge>
        <span className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
          {factor.affectsBand
            ? `${Math.round(factor.weight * 100)}% of band`
            : "Context and confidence only"}
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-ink-subtle">{factor.explanation}</p>
      {factor.missingReason && (
        <p className="mt-2 text-xs leading-5 text-ink-subtle">
          Gap: {factor.missingReason}
        </p>
      )}
    </li>
  );
}

export interface ReadinessPanelProps {
  assessment: ReadinessAssessment;
  title?: string;
  className?: string;
}

export function ReadinessPanel({
  assessment,
  title = "Recorded readiness",
  className,
}: ReadinessPanelProps) {
  const headingId = useId();
  const bandTone = assessment.band === "ready" ? "accent" : "neutral";

  return (
    <Card className={cn("space-y-8 p-6 sm:p-8", className)}>
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={bandTone}>{READINESS_BAND_LABELS[assessment.band]}</Badge>
          <Badge>Recorded only</Badge>
          <Badge>Non-diagnostic</Badge>
        </div>
        <h2
          id={headingId}
          className="mt-4 text-2xl font-semibold tracking-tight text-ink"
        >
          {title}
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          {READINESS_BAND_DESCRIPTIONS[assessment.band]}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-control border border-line bg-canvas/40 p-4">
          <p className="font-mono text-label text-ink-subtle uppercase">Weighted score</p>
          <p className="mt-2 font-mono text-2xl text-ink">
            {assessment.averageScore === null ? "—" : assessment.averageScore}
            <span className="text-sm text-ink-subtle"> / 100</span>
          </p>
        </div>
        <div className="rounded-control border border-line bg-canvas/40 p-4">
          <p className="font-mono text-label text-ink-subtle uppercase">Confidence</p>
          <p className="mt-2 text-lg text-ink">
            {READINESS_CONFIDENCE_LABELS[assessment.confidence.level]}
            <span className="ml-2 font-mono text-xs text-ink-subtle">
              {assessment.coverage}% coverage
            </span>
          </p>
        </div>
        <div className="rounded-control border border-line bg-canvas/40 p-4">
          <p className="font-mono text-label text-ink-subtle uppercase">Window</p>
          <p className="mt-2 text-lg text-ink">
            {assessment.inputs.windowDays} days
            <span className="ml-2 font-mono text-xs text-ink-subtle">
              {assessment.inputs.checkInsInWindow} check-in
              {assessment.inputs.checkInsInWindow === 1 ? "" : "s"}
            </span>
          </p>
        </div>
      </div>

      <p className="max-w-prose text-sm leading-6 text-ink-muted">
        {assessment.explanation}
      </p>

      <section aria-labelledby={`${headingId}-factors`}>
        <h3
          id={`${headingId}-factors`}
          className="text-sm font-semibold tracking-tight text-ink"
        >
          Contributing factors and sources
        </h3>
        <ul className="mt-4 space-y-3">
          {assessment.factors.map((factor) => (
            <FactorRow key={factor.id} factor={factor} />
          ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby={`${headingId}-confidence`}>
          <h3
            id={`${headingId}-confidence`}
            className="text-sm font-semibold tracking-tight text-ink"
          >
            Why confidence is{" "}
            {READINESS_CONFIDENCE_LABELS[assessment.confidence.level].toLowerCase()}
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-muted">
            {assessment.confidence.reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby={`${headingId}-missing`}>
          <h3
            id={`${headingId}-missing`}
            className="text-sm font-semibold tracking-tight text-ink"
          >
            Missing data
          </h3>
          {assessment.missingData.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-muted">
              {assessment.missingData.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm leading-6 text-ink-muted">
              No gaps in the rubric inputs for this window.
            </p>
          )}
        </section>
      </div>

      <section aria-labelledby={`${headingId}-actions`}>
        <h3
          id={`${headingId}-actions`}
          className="text-sm font-semibold tracking-tight text-ink"
        >
          Suggested non-diagnostic actions
        </h3>
        <ul className="mt-4 space-y-3">
          {assessment.actions.map((action) => (
            <li
              key={action.id}
              className="rounded-control border border-line bg-canvas/40 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={action.priority === "primary" ? "accent" : "neutral"}>
                  {action.priority === "primary" ? "Primary" : "Supporting"}
                </Badge>
                <SourceBadge category="recorded">{action.sourceLabel}</SourceBadge>
              </div>
              <p className="mt-3 text-sm font-medium text-ink">{action.title}</p>
              <p className="mt-1 text-sm leading-6 text-ink-muted">{action.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <InlineAlert tone="info" title="Escalation guidance">
        <ul className="space-y-1">
          {assessment.escalation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </InlineAlert>

      <section aria-labelledby={`${headingId}-provenance`}>
        <h3
          id={`${headingId}-provenance`}
          className="text-sm font-semibold tracking-tight text-ink"
        >
          Provenance and formula
        </h3>
        <dl className="mt-3 divide-y divide-line text-sm">
          <div className="flex items-start justify-between gap-4 py-2.5">
            <dt className="text-ink-muted">Latest check-in</dt>
            <dd className="text-right font-mono text-xs text-ink">
              {formatDateTime(assessment.inputs.observedAt)} ·{" "}
              {assessment.inputs.ageHours} h old
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4 py-2.5">
            <dt className="text-ink-muted">Data classes</dt>
            <dd className="text-right font-mono text-xs text-ink">
              Recorded only · Simulated excluded
            </dd>
          </div>
        </dl>
        <p className="mt-3 max-w-prose text-xs leading-5 text-ink-subtle">
          {assessment.inputs.formula}
        </p>
      </section>

      <section aria-labelledby={`${headingId}-caveats`}>
        <h3
          id={`${headingId}-caveats`}
          className="text-sm font-semibold tracking-tight text-ink"
        >
          Cautions
        </h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-muted">
          {assessment.caveats.map((caveat) => (
            <li key={caveat}>• {caveat}</li>
          ))}
        </ul>
      </section>
    </Card>
  );
}
