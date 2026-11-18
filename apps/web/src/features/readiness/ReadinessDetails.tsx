import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import type {
  CountermeasurePlan,
  ReadinessAssessment,
  ReadinessBand,
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

function bandBadgeTone(band: ReadinessBand): "accent" | "neutral" {
  return band === "ready" ? "accent" : "neutral";
}

export interface ReadinessDetailsProps {
  assessment: ReadinessAssessment;
  countermeasures: CountermeasurePlan;
  headingLevel?: "h2" | "h3";
  title?: string;
  className?: string;
}

export function ReadinessDetails({
  assessment,
  countermeasures,
  headingLevel = "h2",
  title = "Recovery readiness",
  className,
}: ReadinessDetailsProps) {
  const Heading = headingLevel;
  const Subheading: "h3" | "h4" = headingLevel === "h2" ? "h3" : "h4";
  const caveats = Array.from(
    new Set([...assessment.caveats, ...countermeasures.caveats]),
  );
  const headingId = `readiness-${assessment.inputs.checkInId}`;

  return (
    <div className={cn("space-y-7", className)}>
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={bandBadgeTone(assessment.band)}>
            {READINESS_BAND_LABELS[assessment.band]}
          </Badge>
          <Badge>Recorded only</Badge>
          <Badge>Self-report</Badge>
        </div>
        <Heading
          id={headingId}
          className={cn(
            "mt-4 font-semibold tracking-tight text-ink",
            headingLevel === "h2" ? "text-xl" : "text-lg",
          )}
        >
          {title}
        </Heading>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          {READINESS_BAND_DESCRIPTIONS[assessment.band]} Weighted recorded score:{" "}
          <span className="font-mono text-ink">
            {assessment.averageScore === null ? "—" : assessment.averageScore}/100
          </span>
          . Confidence: {READINESS_CONFIDENCE_LABELS[assessment.confidence.level]}. This
          is monitoring support, not diagnosis or a fitness-for-duty determination.
        </p>
      </header>

      <section aria-labelledby={`${headingId}-factors`}>
        <Subheading
          id={`${headingId}-factors`}
          className="text-sm font-semibold tracking-tight text-ink"
        >
          Inputs from the recorded window
        </Subheading>
        <ul className="mt-4 space-y-4">
          {assessment.factors.map((factor) => (
            <li key={factor.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-ink">
                  {factor.label}{" "}
                  <span className="font-normal text-ink-muted">
                    · {factor.valueLabel}
                  </span>
                </p>
                <div className="flex items-center gap-2">
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
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised"
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
                <p className="mt-2 rounded-control border border-dashed border-line px-3 py-2 text-xs leading-5 text-ink-subtle">
                  Not enough data for this input. It is left empty.
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <SourceBadge category="recorded">{factor.sourceLabel}</SourceBadge>
                <span className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
                  {factor.affectsBand
                    ? `${Math.round(factor.weight * 100)}% of band`
                    : "Context and confidence only"}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-ink-subtle">
                {factor.explanation}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby={`${headingId}-confidence`}>
          <Subheading
            id={`${headingId}-confidence`}
            className="text-sm font-semibold tracking-tight text-ink"
          >
            Confidence: {READINESS_CONFIDENCE_LABELS[assessment.confidence.level]}
          </Subheading>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-muted">
            {assessment.confidence.reasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby={`${headingId}-missing`}>
          <Subheading
            id={`${headingId}-missing`}
            className="text-sm font-semibold tracking-tight text-ink"
          >
            Missing data
          </Subheading>
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

      <section aria-labelledby={`${headingId}-inputs`}>
        <Subheading
          id={`${headingId}-inputs`}
          className="text-sm font-semibold tracking-tight text-ink"
        >
          Provenance and formula
        </Subheading>
        <dl className="mt-3 divide-y divide-line text-sm">
          <InputRow label="Observed">
            {formatDateTime(assessment.inputs.observedAt)}
          </InputRow>
          <InputRow label="Data age">
            {assessment.inputs.ageHours} hour
            {assessment.inputs.ageHours === 1 ? "" : "s"}
          </InputRow>
          <InputRow label="Recent check-ins">
            {assessment.inputs.checkInsInWindow} in {assessment.inputs.windowDays} days
          </InputRow>
          <InputRow label="Data classes">Recorded only</InputRow>
        </dl>
        <p className="mt-3 max-w-prose text-xs leading-5 text-ink-subtle">
          {assessment.inputs.formula}
        </p>
      </section>

      <section aria-labelledby={`${headingId}-suggestions`}>
        <Subheading
          id={`${headingId}-suggestions`}
          className="text-sm font-semibold tracking-tight text-ink"
        >
          Explainable non-diagnostic suggestions
        </Subheading>
        <ul className="mt-4 space-y-4">
          {countermeasures.suggestions.map((suggestion) => (
            <li
              key={suggestion.id}
              className="rounded-control border border-line bg-canvas/40 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={suggestion.priority === "primary" ? "accent" : "neutral"}>
                  {suggestion.priority === "primary" ? "Primary" : "Supporting"}
                </Badge>
                <span className="font-mono text-[0.6875rem] tracking-[0.12em] text-ink-subtle uppercase">
                  Trigger: {suggestion.trigger.label} · {suggestion.trigger.status}
                  {suggestion.trigger.score === null
                    ? ""
                    : ` · ${suggestion.trigger.score}/100`}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-ink">{suggestion.title}</p>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                {suggestion.rationale}
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-subtle">
                {suggestion.caution}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-prose text-xs leading-5 text-ink-subtle">
          {countermeasures.basis}
        </p>
      </section>

      <section aria-labelledby={`${headingId}-caveats`}>
        <Subheading
          id={`${headingId}-caveats`}
          className="text-sm font-semibold tracking-tight text-ink"
        >
          Cautions
        </Subheading>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-ink-muted">
          {caveats.map((caveat) => (
            <li key={caveat}>• {caveat}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function InputRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right font-mono text-xs text-ink">{children}</dd>
    </div>
  );
}
