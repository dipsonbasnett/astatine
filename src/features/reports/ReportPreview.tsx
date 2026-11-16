import { useId } from "react";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { formatDateTime, formatDecimal } from "@/lib/format";

import {
  formatReportPeriod,
  type MissionReport,
  type ReportVitalTrend,
} from "./mission-report-engine";

function vitalValue(trend: ReportVitalTrend): string {
  return `${formatDecimal(trend.latestValue, trend.decimals)} ${trend.unit}`;
}

function weightLabel(factor: MissionReport["readiness"]["factors"][number]): string {
  return factor.affectsBand ? `${Math.round(factor.weight * 100)}%` : "Context";
}

export function ReportPreview({ report }: { report: MissionReport }) {
  const base = useId();
  const titleId = `${base}-title`;

  return (
    <Card role="article" aria-labelledby={titleId} className="report-print p-6 sm:p-8">
      <header className="border-b border-line pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-prose">
            <p className="font-mono text-label text-accent uppercase">
              Recorded mission-health review
            </p>
            <h2
              id={titleId}
              className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-title"
            >
              {report.title}
            </h2>
            <p className="mt-2 font-mono text-xs text-ink-subtle">{report.id}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">Recorded only</Badge>
            <Badge>Not clinical</Badge>
          </div>
        </div>

        <dl className="mt-6 grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="font-mono text-label text-ink-subtle uppercase">Generated</dt>
            <dd className="mt-1 text-ink">{formatDateTime(report.generatedAt)}</dd>
          </div>
          <div>
            <dt className="font-mono text-label text-ink-subtle uppercase">
              Selected period
            </dt>
            <dd className="mt-1 text-ink">
              {formatReportPeriod(
                report.windowDays,
                report.periodStart,
                report.periodEnd,
              )}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-label text-ink-subtle uppercase">
              Recorded check-ins
            </dt>
            <dd className="mt-1 font-mono text-ink">{report.checkInCount}</dd>
          </div>
          <div>
            <dt className="font-mono text-label text-ink-subtle uppercase">Data class</dt>
            <dd className="mt-1 text-ink">Recorded only</dd>
          </div>
        </dl>
      </header>

      <section className="report-section mt-8" aria-labelledby={`${base}-sources`}>
        <h3
          id={`${base}-sources`}
          className="text-base font-semibold tracking-tight text-ink"
        >
          Data sources
        </h3>
        <p className="mt-1 max-w-prose text-xs leading-5 text-ink-subtle">
          Source labels are attached to the data they describe. Simulated and research
          content are excluded, not merged into recorded values.
        </p>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {report.sourceSummary.map((source) => (
            <li
              key={source.category}
              className="rounded-control border border-line bg-canvas/40 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                {source.category === "recorded" ? (
                  <SourceBadge category="recorded">{source.label}</SourceBadge>
                ) : (
                  <Badge>{source.label}</Badge>
                )}
                <Badge tone={source.status === "included" ? "accent" : "neutral"}>
                  {source.status === "included" ? "Included" : "Excluded"}
                </Badge>
              </div>
              <p className="mt-3 text-xs leading-5 text-ink-muted">{source.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="report-section mt-8" aria-labelledby={`${base}-summary`}>
        <h3
          id={`${base}-summary`}
          className="text-base font-semibold tracking-tight text-ink"
        >
          Executive summary
        </h3>
        <p className="mt-3 max-w-prose text-sm leading-6 text-ink">
          {report.executiveSummary}
        </p>
      </section>

      <section className="report-section mt-8" aria-labelledby={`${base}-readiness`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3
              id={`${base}-readiness`}
              className="text-base font-semibold tracking-tight text-ink"
            >
              Recovery readiness
            </h3>
            <p className="mt-1 text-xs leading-5 text-ink-subtle">
              Fixed rubric over recorded self-report. Not diagnosis or fitness for duty.
            </p>
          </div>
          <SourceBadge category="recorded">Recorded · fixed rubric</SourceBadge>
        </div>

        <dl className="mt-4 grid gap-3 rounded-control border border-line bg-raised/30 p-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <dt className="font-mono text-label text-ink-subtle uppercase">Band</dt>
            <dd className="mt-1 text-sm font-medium text-ink">
              {report.readiness.bandLabel}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-label text-ink-subtle uppercase">
              Weighted score
            </dt>
            <dd className="mt-1 font-mono text-sm text-ink">
              {report.readiness.score === null
                ? "Not available"
                : `${report.readiness.score}/100`}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-label text-ink-subtle uppercase">Coverage</dt>
            <dd className="mt-1 font-mono text-sm text-ink">
              {report.readiness.coverage}%
            </dd>
          </div>
          <div>
            <dt className="font-mono text-label text-ink-subtle uppercase">Confidence</dt>
            <dd className="mt-1 text-sm text-ink">{report.readiness.confidenceLabel}</dd>
          </div>
        </dl>

        <p className="mt-4 max-w-prose text-sm leading-6 text-ink-muted">
          {report.readiness.explanation}
        </p>

        <h4 className="mt-6 text-sm font-semibold tracking-tight text-ink">
          Contributing factors
        </h4>
        <div
          role="region"
          aria-label="Report readiness factors"
          tabIndex={0}
          className="mt-3 overflow-x-auto rounded-control border border-line"
        >
          <table className="w-full min-w-[46rem] text-left text-sm">
            <caption className="sr-only">Recorded readiness factors</caption>
            <thead className="bg-raised/50 text-xs tracking-[0.08em] text-ink-subtle uppercase">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Factor
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Recorded value
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Score
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Band weight
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.readiness.factors.map((factor) => (
                <tr key={factor.id}>
                  <th scope="row" className="px-4 py-3 font-medium text-ink">
                    {factor.label}
                    <span className="mt-1 block text-xs font-normal leading-5 text-ink-subtle">
                      {factor.explanation}
                    </span>
                  </th>
                  <td className="px-4 py-3 text-ink-muted">{factor.valueLabel}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink">
                    {factor.score === null ? "—" : `${factor.score}/100`}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-subtle">
                    {weightLabel(factor)}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {factor.statusLabel}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-subtle">
                    {factor.sourceLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="mt-6 text-sm font-semibold tracking-tight text-ink">
          Missing readiness data
        </h4>
        {report.readiness.missingData.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink-muted">
            {report.readiness.missingData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            No gaps were recorded in the readiness inputs.
          </p>
        )}
      </section>

      <section className="report-section mt-8" aria-labelledby={`${base}-adherence`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3
            id={`${base}-adherence`}
            className="text-base font-semibold tracking-tight text-ink"
          >
            Countermeasure adherence
          </h3>
          <SourceBadge category="recorded">Recorded · fixed rubric</SourceBadge>
        </div>
        <p className="mt-3 max-w-prose text-sm leading-6 text-ink-muted">
          {report.adherence.summary}
        </p>

        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {report.adherence.items.map((item) => (
            <li
              key={item.id}
              className="rounded-control border border-line bg-canvas/40 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-ink">{item.title}</h4>
                <Badge tone={item.status === "on-track" ? "accent" : "neutral"}>
                  {item.statusLabel}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                {item.currentStatus}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{item.suggestion}</p>
              <p className="mt-2 text-xs leading-5 text-ink-subtle">{item.caution}</p>
              {item.missingData && (
                <p className="mt-2 text-xs leading-5 text-ink-subtle">
                  Missing: {item.missingData}
                </p>
              )}
              <div className="mt-2">
                <SourceBadge category="recorded">{item.sourceLabel}</SourceBadge>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-prose text-xs leading-5 text-ink-subtle">
          {report.adherence.basis}
        </p>

        <h4 className="mt-6 text-sm font-semibold tracking-tight text-ink">
          Suggested focus areas
        </h4>
        <p className="mt-1 max-w-prose text-xs leading-5 text-ink-subtle">
          {report.adherence.focusNote}
        </p>
        <ul className="mt-3 space-y-3">
          {report.adherence.focus.map((item) => (
            <li
              key={item.id}
              className="rounded-control border border-line bg-raised/30 p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={item.priority === "primary" ? "accent" : "neutral"}>
                  {item.priority === "primary" ? "Primary" : "Supporting"}
                </Badge>
                <h5 className="text-sm font-medium text-ink">{item.title}</h5>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{item.rationale}</p>
              <p className="mt-2 text-xs leading-5 text-ink-subtle">{item.caution}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="report-section mt-8" aria-labelledby={`${base}-brief`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3
              id={`${base}-brief`}
              className="text-base font-semibold tracking-tight text-ink"
            >
              Mission health brief
            </h3>
            <p className="mt-1 text-xs leading-5 text-ink-subtle">
              The recorded brief section uses the same {report.windowDays}-day window as
              this report.
            </p>
          </div>
          <SourceBadge category="recorded">Recorded · self-report</SourceBadge>
        </div>
        <p className="mt-3 max-w-prose text-sm leading-6 text-ink">
          {report.brief.headline}
        </p>
        <p className="mt-2 text-xs leading-5 text-ink-subtle">
          Latest self-report: {formatDateTime(report.brief.latestObservedAt)}
        </p>

        <div
          role="region"
          aria-label="Report latest self-report"
          tabIndex={0}
          className="mt-4 overflow-x-auto rounded-control border border-line"
        >
          <table className="w-full min-w-[26rem] text-left text-sm">
            <caption className="sr-only">Latest recorded self-report</caption>
            <thead className="bg-raised/50 text-xs tracking-[0.08em] text-ink-subtle uppercase">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Field
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Recorded value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {report.brief.observations.map((line) => (
                <tr key={line.id}>
                  <th scope="row" className="px-4 py-2.5 font-medium text-ink">
                    {line.label}
                  </th>
                  <td className="px-4 py-2.5 text-ink-muted">{line.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="mt-6 text-sm font-semibold tracking-tight text-ink">
          Missing brief data
        </h4>
        {report.brief.missingData.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink-muted">
            {report.brief.missingData.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            No gaps were recorded for this brief.
          </p>
        )}
      </section>

      <section className="report-section mt-8" aria-labelledby={`${base}-vitals`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3
            id={`${base}-vitals`}
            className="text-base font-semibold tracking-tight text-ink"
          >
            Vitals trends
          </h3>
          <SourceBadge category="recorded">Recorded · check-in self-report</SourceBadge>
        </div>
        <p className="mt-2 max-w-prose text-xs leading-5 text-ink-subtle">
          {report.vitals.note}
        </p>

        {report.vitals.trends.length > 0 ? (
          <ul className="mt-4 grid gap-3 md:grid-cols-2">
            {report.vitals.trends.map((trend) => (
              <li
                key={trend.id}
                className="rounded-control border border-line bg-canvas/40 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="text-sm font-medium text-ink">{trend.label}</h4>
                  <Badge>{trend.trendLabel}</Badge>
                </div>
                <p className="mt-2 font-mono text-sm text-ink">{vitalValue(trend)}</p>
                <p className="mt-1 text-xs leading-5 text-ink-subtle">
                  {formatDateTime(trend.latestObservedAt)} · {trend.coverageText}
                </p>
                <p className="mt-2 text-xs leading-5 text-ink-muted">
                  {trend.trendDetail}
                </p>
                <p className="mt-2 text-xs leading-5 text-ink-subtle">{trend.note}</p>
                <div className="mt-2">
                  <SourceBadge category="recorded">{trend.sourceLabel}</SourceBadge>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm leading-6 text-ink-muted">
            No recorded sleep, exercise, hydration, or nutrition trend can be described
            for this period.
          </p>
        )}
      </section>

      <section className="report-section mt-8" aria-labelledby={`${base}-gaps`}>
        <h3
          id={`${base}-gaps`}
          className="text-base font-semibold tracking-tight text-ink"
        >
          Data gaps
        </h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink-muted">
          {report.dataGaps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="report-section mt-8" aria-labelledby={`${base}-escalation`}>
        <h3
          id={`${base}-escalation`}
          className="text-base font-semibold tracking-tight text-ink"
        >
          Non-diagnostic escalation
        </h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink-muted">
          {report.escalation.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="report-section mt-8" aria-labelledby={`${base}-limits`}>
        <h3
          id={`${base}-limits`}
          className="text-base font-semibold tracking-tight text-ink"
        >
          Disclaimer and limitations
        </h3>
        <p className="mt-3 max-w-prose rounded-control border border-line-strong bg-raised p-4 text-sm leading-6 text-ink">
          {report.disclaimer}
        </p>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink-muted">
          {report.limits.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section
        className="report-section mt-8 rounded-control border border-dashed border-line p-4"
        aria-labelledby={`${base}-privacy`}
      >
        <h3
          id={`${base}-privacy`}
          className="text-base font-semibold tracking-tight text-ink"
        >
          Privacy notice
        </h3>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          {report.privacyNotice}
        </p>
        <p className="mt-3 text-xs leading-5 text-ink-subtle">
          Private notes:{" "}
          {report.privateNotes.included
            ? "included by explicit consent"
            : "excluded by default"}
          .
        </p>
        <p className="mt-1 text-xs leading-5 text-ink-subtle">
          {report.privateNotes.note}
        </p>
        {report.privateNotes.included && report.privateNotes.items.length === 0 && (
          <p className="mt-2 text-xs leading-5 text-ink-subtle">
            No private note content is stored for this period.
          </p>
        )}
      </section>
    </Card>
  );
}
