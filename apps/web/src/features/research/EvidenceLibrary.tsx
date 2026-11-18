import { useId, useState, type ReactNode } from "react";

import { ResearchIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SourceBadge } from "@/components/ui/SourceBadge";
import {
  APPLICABILITY_LABELS,
  CONFIDENCE_DESCRIPTIONS,
  CONFIDENCE_LABELS,
  PRIVACY_FACET_LABELS,
  RESEARCH_INSIGHT_NOTE,
  RESEARCH_MODEL_TRAINING_NOTE,
  approvedResearchInsights,
  insightCitationLine,
  insightReviewLine,
} from "./evidence/model";
import type { EvidenceStatement, ResearchInsight, StudyMetadata } from "./evidence/types";
import {
  RESEARCH_DOMAIN_IDS,
  RESEARCH_DOMAIN_LABELS,
  type ResearchDomainId,
} from "./provenance/landscape";

const STUDY_DESIGN_LABELS: Record<StudyMetadata["design"], string> = {
  experiment: "Experiment",
  observational: "Observational study",
  review: "Review",
  "program-overview": "Program overview",
  protocol: "Protocol",
};

const DIRECTION_LABELS: Record<EvidenceStatement["direction"], string> = {
  supports: "Supports",
  mixed: "Mixed evidence",
  unclear: "Unclear",
  describes: "Describes",
};

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `min-w-0 ${className}` : "min-w-0"}>
      <dt className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 break-words text-ink-muted">{children}</dd>
    </div>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-1 text-xs leading-5">
      {items.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  );
}

function matchesQuery(insight: ResearchInsight, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return true;

  return [
    insight.title,
    insight.summary,
    RESEARCH_DOMAIN_LABELS[insight.domain],
    ...insight.statements.map((statement) => statement.claim),
    ...insight.study.limitations,
    ...insight.limitations,
    ...insight.sources.map((source) => `${source.publisher} ${source.title}`),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

export interface ResearchInsightCardProps {
  insight: ResearchInsight;
}

export function ResearchInsightCard({ insight }: ResearchInsightCardProps) {
  const headingId = useId();

  return (
    <article
      aria-labelledby={headingId}
      className="rounded-panel border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={headingId} className="text-lg font-semibold tracking-tight text-ink">
            {insight.title}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            {RESEARCH_DOMAIN_LABELS[insight.domain]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SourceBadge category="research">Research context</SourceBadge>
          <Badge tone="accent">{CONFIDENCE_LABELS[insight.confidence]}</Badge>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-ink-muted">{insight.summary}</p>

      <p className="mt-4 rounded-control border border-dashed border-line px-3 py-2 text-xs leading-5 text-ink-subtle">
        {APPLICABILITY_LABELS[insight.applicability.appliesToSelectedUser]}.{" "}
        {insight.applicability.statement} This is not personalized medical advice.
      </p>

      <div className="mt-5 space-y-4">
        <h4 className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
          Evidence statements
        </h4>
        <ul className="space-y-4">
          {insight.statements.map((statement) => (
            <li
              key={statement.id}
              className="rounded-control border border-line bg-canvas p-4"
            >
              <p className="text-sm leading-6 font-medium text-ink">{statement.claim}</p>
              <p className="mt-1 text-xs text-ink-subtle">
                Direction: {DIRECTION_LABELS[statement.direction]} ·{" "}
                {CONFIDENCE_LABELS[statement.confidence]}
              </p>
              <ul className="mt-3 space-y-2">
                {statement.observations.map((observation) => (
                  <li key={observation.id} className="text-xs leading-5 text-ink-muted">
                    <span className="text-ink-subtle">
                      {observation.valueType} observation.
                    </span>{" "}
                    {observation.statement}
                    {observation.effectSummary
                      ? ` ${observation.effectSummary}`
                      : ""}{" "}
                    Uncertainty: {observation.uncertainty}
                  </li>
                ))}
              </ul>
              <BulletList items={statement.limitations} />
            </li>
          ))}
        </ul>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Study">
          {STUDY_DESIGN_LABELS[insight.study.design]}, conducted by{" "}
          {insight.study.conductedBy}
          {insight.study.publicationYear === null
            ? ". Publication year not reported."
            : ` (${insight.study.publicationYear}).`}
        </Field>
        <Field label="Population">
          {insight.study.population.description}{" "}
          <span className="block text-xs leading-5 text-ink-subtle">
            {insight.study.population.sampleSize === null
              ? insight.study.population.sampleSizeNote
              : `Sample size ${insight.study.population.sampleSize}. ${insight.study.population.sampleSizeNote}`}{" "}
            {insight.study.population.inclusionNotes}
          </span>
        </Field>
        <Field label="Confidence basis" className="sm:col-span-2">
          {insight.confidenceBasis}{" "}
          <span className="block text-xs leading-5 text-ink-subtle">
            {CONFIDENCE_DESCRIPTIONS[insight.confidence]}
          </span>
        </Field>
        <Field label="Measurements" className="sm:col-span-2">
          <ul className="space-y-2">
            {insight.measurements.map((measurement) => (
              <li key={measurement.id} className="text-xs leading-5">
                <span className="text-ink">{measurement.label}</span> ·{" "}
                {measurement.unit ?? "No unit reported"} · {measurement.collectionMethod}{" "}
                {measurement.directionMeaning}
              </li>
            ))}
          </ul>
        </Field>
        <Field label="Citation">
          {insight.study.citation.text}
          <span className="mt-1 block text-xs leading-5 text-ink-subtle">
            {insightCitationLine(insight)}
          </span>
        </Field>
        <Field label="License">
          {insight.license.name}
          {insight.license.url && (
            <>
              {" "}
              <ExternalLink href={insight.license.url}>Terms</ExternalLink>
            </>
          )}
          <span className="block text-xs leading-5 text-ink-subtle">
            Redistribution: {insight.license.redistribution}.{" "}
            {insight.license.attribution} {insight.license.note}
          </span>
        </Field>
        <Field label="Privacy">
          {PRIVACY_FACET_LABELS[insight.privacy.status]}
          <span className="mt-1 block text-xs leading-5 text-ink-subtle">
            {insight.privacy.note}
          </span>
        </Field>
        <Field label="Provenance">
          {insightReviewLine(insight)}
          <span className="mt-1 block text-xs leading-5 text-ink-subtle">
            {insight.provenance.datasetId === null
              ? "Not linked to an onboarded dataset."
              : `Dataset: ${insight.provenance.datasetId}.`}{" "}
            Source verified {insight.provenance.sourceVerifiedAt.slice(0, 10)} by{" "}
            {insight.provenance.verifiedBy}.
          </span>
        </Field>
        <Field label="Model training" className="sm:col-span-2">
          {RESEARCH_MODEL_TRAINING_NOTE}
        </Field>
        <Field label="Sources" className="sm:col-span-2">
          <ul className="space-y-2">
            {insight.sources.map((source) => (
              <li key={source.id} className="text-xs leading-5">
                {source.publisher} — {source.title}. Accessed{" "}
                {source.accessedAt.slice(0, 10)}.{" "}
                <ExternalLink href={source.url}>Open source</ExternalLink>
              </li>
            ))}
          </ul>
        </Field>
        <Field label="Limitations" className="sm:col-span-2">
          <BulletList items={insight.limitations} />
        </Field>
        <Field label="Study limitations" className="sm:col-span-2">
          <BulletList items={insight.study.limitations} />
        </Field>
      </dl>
    </article>
  );
}

export interface EvidenceLibraryProps {
  insights?: readonly ResearchInsight[];
}

export function EvidenceLibrary({ insights = [] }: EvidenceLibraryProps) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<ResearchDomainId | "all">("all");

  const approved = approvedResearchInsights(insights);
  const visible = approved.filter(
    (insight) =>
      (domain === "all" || insight.domain === domain) && matchesQuery(insight, query),
  );
  const filtersActive = query.trim().length > 0 || domain !== "all";

  return (
    <section aria-labelledby="evidence-library-heading" className="space-y-5">
      <div>
        <p className="font-mono text-label text-ink-subtle uppercase">Evidence</p>
        <h2
          id="evidence-library-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-ink"
        >
          Evidence library
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          {RESEARCH_INSIGHT_NOTE} Each insight carries a population, confidence level,
          limitations, applicability, citation, license, and review record.
        </p>
      </div>

      {approved.length === 0 ? (
        <EmptyState
          icon={<ResearchIcon className="size-5" />}
          title="No reviewed insights"
          description="The evidence library is intentionally empty. An insight appears only after its source passes verification, its measurements are normalized, its population and limitations are written, and a second reviewer approves it. This is not personalized medical advice."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Input
              type="search"
              label="Search evidence"
              hint="Match a claim, domain, source, or limitation."
              placeholder="Sleep regularity, citation, population…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Select
              label="Health domain"
              hint="Filter insights by their primary domain."
              value={domain}
              onChange={(event) =>
                setDomain(event.target.value as ResearchDomainId | "all")
              }
            >
              <option value="all">All domains</option>
              {RESEARCH_DOMAIN_IDS.map((id) => (
                <option key={id} value={id}>
                  {RESEARCH_DOMAIN_LABELS[id]}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-xs leading-5 text-ink-subtle">
              Showing {visible.length} of {approved.length} approved insights.
            </p>
            {filtersActive && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setDomain("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={<ResearchIcon className="size-5" />}
              title="No insights match"
              description="No approved insight matches the current search and domain filter. Clear the filters to see every reviewed insight."
            />
          ) : (
            <ul className="grid gap-4 xl:grid-cols-2">
              {visible.map((insight) => (
                <li key={insight.id}>
                  <ResearchInsightCard insight={insight} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
