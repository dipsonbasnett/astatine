import { useId } from "react";
import { Link } from "react-router-dom";

import { ArrowRightIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { SourceBadge } from "@/components/ui/SourceBadge";
import {
  APPLICABILITY_LABELS,
  CONFIDENCE_LABELS,
  RESEARCH_INSIGHTS,
  approvedResearchInsights,
  insightCitationLine,
} from "./evidence/model";
import type { ResearchInsight } from "./evidence/types";
import type { ResearchDomainId } from "./provenance/landscape";

export const RESEARCH_CONTEXT_PANEL_NOTE =
  "Approved research context only. These insights are general, population-level research. They do not describe the selected crew member or astronaut, never change a recorded value or readiness band, and are not personalized medical advice.";

export interface ResearchContextPanelProps {
  domains: readonly ResearchDomainId[];
  insights?: readonly ResearchInsight[];
  now?: string;
}

export function ResearchContextPanel({
  domains,
  insights = RESEARCH_INSIGHTS,
  now = new Date().toISOString(),
}: ResearchContextPanelProps) {
  const headingId = useId();
  const relevant = approvedResearchInsights(insights).filter(
    (insight) =>
      domains.includes(insight.domain) &&
      (insight.nextReviewDueAt === null || insight.nextReviewDueAt > now),
  );

  if (relevant.length === 0) return null;

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-panel border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={headingId} className="text-lg font-semibold tracking-tight text-ink">
          Research context
        </h2>
        <SourceBadge category="research">Research</SourceBadge>
      </div>
      <p className="mt-3 max-w-prose text-sm leading-6 text-ink-muted">
        {RESEARCH_CONTEXT_PANEL_NOTE}
      </p>

      <ul className="mt-5 space-y-4">
        {relevant.map((insight) => {
          const claim = insight.statements[0]?.claim ?? insight.summary;
          return (
            <li
              key={insight.id}
              className="rounded-control border border-line bg-canvas p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-ink">{insight.title}</h3>
                <Badge tone="accent">{CONFIDENCE_LABELS[insight.confidence]}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{claim}</p>
              <p className="mt-2 text-xs leading-5 text-ink-subtle">
                {APPLICABILITY_LABELS[insight.applicability.appliesToSelectedUser]}.{" "}
                {insight.applicability.statement}
              </p>
              <div className="mt-3">
                <p className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
                  Limitations
                </p>
                <ul className="mt-1 space-y-1">
                  {insight.limitations.map((limitation) => (
                    <li key={limitation} className="text-xs leading-5 text-ink-muted">
                      • {limitation}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-3 text-xs leading-5 text-ink-subtle">
                {insightCitationLine(insight)}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {insight.sources.map((source) => (
                  <a
                    key={source.id}
                    href={source.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
                  >
                    Open source: {source.publisher}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ))}
                <Link
                  to="/research"
                  className="inline-flex items-center gap-1 text-xs font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
                >
                  Open the Research center
                  <ArrowRightIcon className="size-3" />
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
