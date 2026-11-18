import { useId, type ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { formatDateTime, formatDecimal } from "@/lib/format";
import type { CrewMetric, CrewMetricStatus, CrewReadinessSnapshot } from "@/types/health";

import {
  CREW_METRIC_STATUS_LABELS,
  CREW_PRIVACY_NOTE,
  CREW_ROSTER_NOTE,
  CREW_SCOPE_NOTE,
} from "./crew-engine";

interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  aside?: ReactNode;
}

function SectionHeading({ id, eyebrow, title, description, aside }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="font-mono text-label text-ink-subtle uppercase">{eyebrow}</p>
        <h2 id={id} className="mt-2 text-xl font-semibold tracking-tight text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>
      </div>
      {aside}
    </div>
  );
}

function metricStatusTone(status: CrewMetricStatus): "accent" | "neutral" {
  return status === "available" ? "accent" : "neutral";
}

function CrewMetricCard({
  metric,
  headingId,
}: {
  metric: CrewMetric;
  headingId: string;
}) {
  return (
    <article
      aria-labelledby={headingId}
      className="flex h-full min-w-0 flex-col rounded-panel border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          id={headingId}
          className="min-w-0 text-sm font-semibold tracking-tight break-words text-ink"
        >
          {metric.label}
        </h3>
        <Badge tone={metricStatusTone(metric.status)}>
          {CREW_METRIC_STATUS_LABELS[metric.status]}
        </Badge>
      </div>
      <p className="mt-4 text-lg font-medium break-words text-ink">{metric.headline}</p>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{metric.detail}</p>
      <div className="mt-auto pt-4">
        <SourceBadge category={metric.category}>{metric.sourceLabel}</SourceBadge>
      </div>
    </article>
  );
}

export function CrewOverview({ snapshot }: { snapshot: CrewReadinessSnapshot }) {
  const prefix = useId();
  const summaryHeadingId = `${prefix}-summary`;
  const metricsHeadingId = `${prefix}-metrics`;
  const alertsHeadingId = `${prefix}-alerts`;
  const gapsHeadingId = `${prefix}-gaps`;
  const sourcesHeadingId = `${prefix}-sources`;
  const member = snapshot.member;
  const readiness = snapshot.metrics.find((metric) => metric.id === "readinessBand");

  return (
    <div className="space-y-10">
      <section aria-labelledby={summaryHeadingId} className="space-y-5">
        <SectionHeading
          id={summaryHeadingId}
          eyebrow="Crew summary"
          title="One local profile, pooled recorded aggregates"
          description={`Summarized ${formatDateTime(snapshot.generatedAt)} from recorded check-ins in this browser over the selected ${snapshot.windowDays}-day window. No member-level attribution is implied.`}
          aside={<Badge tone="neutral">{snapshot.windowDays}-day window</Badge>}
        />

        <Card className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-label text-ink-subtle uppercase">
                Local profile
              </p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight break-words text-ink">
                {member.displayName}
              </h3>
              <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
                {member.profileLabel}. Check-ins are stored as pooled observations and are
                not individually attributed.
              </p>
            </div>
            <SourceBadge category="recorded">Recorded · local profile</SourceBadge>
          </div>

          <dl className="mt-6 grid gap-x-6 gap-y-5 border-t border-line pt-6 sm:grid-cols-2 xl:grid-cols-5">
            <div className="min-w-0">
              <dt className="font-mono text-label text-ink-subtle uppercase">
                Recorded days
              </dt>
              <dd className="mt-1 text-base font-medium text-ink">
                {member.recordedDays} of {member.windowDays}
              </dd>
              <dd className="mt-1 text-xs leading-5 text-ink-subtle">
                {member.coveragePercent}% window coverage
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-mono text-label text-ink-subtle uppercase">
                Check-ins
              </dt>
              <dd className="mt-1 text-base font-medium text-ink">
                {member.checkInCount}
              </dd>
              <dd className="mt-1 text-xs leading-5 text-ink-subtle">
                Recorded on this device
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-mono text-label text-ink-subtle uppercase">
                Latest check-in
              </dt>
              <dd className="mt-1 text-base font-medium break-words text-ink">
                {formatDateTime(member.latestObservedAt)}
              </dd>
              <dd className="mt-1 text-xs leading-5 text-ink-subtle">
                {member.latestAgeHours < 1
                  ? "Less than 1 h old"
                  : `${formatDecimal(member.latestAgeHours)} h old`}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-mono text-label text-ink-subtle uppercase">
                Readiness band
              </dt>
              <dd className="mt-1 text-base font-medium break-words text-ink">
                {readiness?.headline ?? "Not available"}
              </dd>
              <dd className="mt-1 text-xs leading-5 text-ink-subtle">
                Recorded-only rubric
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="font-mono text-label text-ink-subtle uppercase">
                Data gaps
              </dt>
              <dd className="mt-1 text-base font-medium text-ink">
                {snapshot.dataGaps.length}
              </dd>
              <dd className="mt-1 text-xs leading-5 text-ink-subtle">
                Coverage facts, not estimates
              </dd>
            </div>
          </dl>

          <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-ink-subtle">
            This build stores one local profile. There is no roster, account system,
            synchronization, or per-member record, so no teammate is counted or implied.
          </p>
        </Card>
      </section>

      <section aria-labelledby={metricsHeadingId} className="space-y-5">
        <SectionHeading
          id={metricsHeadingId}
          eyebrow="Crew metrics"
          title="Transparent window summaries"
          description="Each metric names its recorded source and reports its own coverage. Missing values stay missing, and no combined team score is calculated."
          aside={
            <span className="font-mono text-label text-ink-subtle uppercase">
              {snapshot.metrics.length} metrics
            </span>
          }
        />
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.metrics.map((metric) => (
            <li key={metric.id} className="min-w-0">
              <CrewMetricCard
                metric={metric}
                headingId={`${prefix}-metric-${metric.id}`}
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby={alertsHeadingId} className="space-y-5">
        <SectionHeading
          id={alertsHeadingId}
          eyebrow="Alerts"
          title="Active alerts"
          description="Local, rule-based review prompts derived from recorded self-report. Nothing is sent to anyone, and no person or crew is monitored or evaluated in real time."
          aside={
            <Badge tone={snapshot.attentionItems.length > 0 ? "neutral" : "accent"}>
              {snapshot.attentionItems.length} review item
              {snapshot.attentionItems.length === 1 ? "" : "s"}
            </Badge>
          }
        />

        {snapshot.attentionItems.length > 0 ? (
          <ul className="space-y-4">
            {snapshot.attentionItems.map((item) => (
              <li key={item.id}>
                <article className="rounded-panel border border-line bg-surface p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">Review</Badge>
                    <SourceBadge category={item.category}>{item.sourceLabel}</SourceBadge>
                  </div>
                  <h3 className="mt-3 text-base font-semibold tracking-tight text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
                    {item.detail}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-ink-subtle">
                    Basis: {item.basis}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="p-5 sm:p-6">
            <p className="text-sm leading-6 text-ink-muted">
              No active review item appears under the published local rules. This is not
              an all-clear health statement; check data gaps separately.
            </p>
          </Card>
        )}

        <div className="rounded-control border border-dashed border-line-strong p-5">
          <h3 className="text-sm font-semibold tracking-tight text-ink">
            How review items are derived
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-ink-muted">
            {snapshot.alertRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby={gapsHeadingId} className="space-y-5">
        <SectionHeading
          id={gapsHeadingId}
          eyebrow="Missing data"
          title="Data gaps"
          description="Coverage facts about this window. A gap is never converted into a medical interpretation, a notification, or an estimated value."
          aside={
            <Badge tone={snapshot.dataGaps.length > 0 ? "neutral" : "accent"}>
              {snapshot.dataGaps.length} gap
              {snapshot.dataGaps.length === 1 ? "" : "s"}
            </Badge>
          }
        />

        {snapshot.dataGaps.length > 0 ? (
          <ul className="grid gap-4 md:grid-cols-2">
            {snapshot.dataGaps.map((gap) => (
              <li key={gap.id} className="min-w-0">
                <article className="h-full rounded-control border border-line bg-raised p-5">
                  <h3 className="text-sm font-semibold break-words text-ink">
                    {gap.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">{gap.detail}</p>
                  <p className="mt-3">
                    <SourceBadge category={gap.category}>{gap.sourceLabel}</SourceBadge>
                  </p>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <Card className="p-5 sm:p-6">
            <p className="text-sm leading-6 text-ink-muted">
              No coverage gap was detected for this window. The recorded values that are
              present are still self-report and do not establish recovery or fitness.
            </p>
          </Card>
        )}
      </section>

      <section aria-labelledby={sourcesHeadingId} className="space-y-5">
        <SectionHeading
          id={sourcesHeadingId}
          eyebrow="Data classes"
          title="Sources on this page"
          description="Crew values use one data class only. The other two classes are named here to make their exclusion explicit."
        />
        <Card className="p-5 sm:p-6">
          <ul className="grid gap-5 md:grid-cols-3">
            <li className="min-w-0">
              <SourceBadge category="recorded">Recorded · used</SourceBadge>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{CREW_PRIVACY_NOTE}</p>
            </li>
            <li className="min-w-0">
              <Badge tone="neutral">Simulated · excluded</Badge>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Simulated telemetry and the simulated recovery trend are not blended into
                any crew value, band, alert, or data-gap count.
              </p>
            </li>
            <li className="min-w-0">
              <Badge tone="neutral">Research · excluded</Badge>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Research context is not personal data. No publication, dataset, or program
                context is merged into this overview.
              </p>
            </li>
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-ink-subtle">
            {CREW_SCOPE_NOTE}
          </p>
        </Card>
      </section>

      <InlineAlert tone="info" title="What this crew overview is not">
        <ul className="list-disc space-y-1 pl-5">
          {snapshot.caveats.map((caveat) => (
            <li key={caveat}>{caveat}</li>
          ))}
        </ul>
      </InlineAlert>

      <p className="text-xs leading-5 text-ink-subtle">{CREW_ROSTER_NOTE}</p>
    </div>
  );
}
