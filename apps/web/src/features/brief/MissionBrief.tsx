import { useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { READINESS_CONFIDENCE_LABELS } from "@/features/readiness/readiness-engine";
import { formatDateTime } from "@/lib/format";
import type { ReadinessBand } from "@/types/health";

import {
  BRIEF_SCOPE_NOTE,
  MAX_FOCUS_ITEMS,
  briefToPlainText,
  type BriefLine,
  type MissionHealthBrief,
} from "./brief-engine";

const BAND_TONE: Record<ReadinessBand, "accent" | "neutral"> = {
  ready: "accent",
  monitor: "neutral",
  rest: "neutral",
  insufficient: "neutral",
};

const BAND_BADGE_LABEL: Record<ReadinessBand, string> = {
  ready: "Ready band",
  monitor: "Monitor band",
  rest: "Rest and recover band",
  insufficient: "Insufficient data",
};

function FactorTable({
  caption,
  lines,
  includeWeight,
}: {
  caption: string;
  lines: readonly BriefLine[];
  includeWeight: boolean;
}) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className="overflow-x-auto rounded-control border border-line"
    >
      <table className="w-full min-w-[32rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-raised/50 text-xs tracking-[0.08em] text-ink-subtle uppercase">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Factor
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Recorded value
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Rubric score
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              {includeWeight ? "Band weight" : "Role"}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {lines.map((line) => (
            <tr key={line.id}>
              <th scope="row" className="px-4 py-3 font-medium text-ink">
                {line.label}
              </th>
              <td className="px-4 py-3 text-ink-muted">{line.note ?? line.value}</td>
              <td className="px-4 py-3 font-mono text-xs text-ink">{line.value}</td>
              <td className="px-4 py-3 text-xs text-ink-subtle">
                {includeWeight && line.weight
                  ? `${Math.round(line.weight * 100)}%`
                  : "Context only"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MissionBrief({ brief }: { brief: MissionHealthBrief }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const band = brief.readiness.band;

  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(briefToPlainText(brief));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-prose">
          <p className="font-mono text-label text-ink-subtle uppercase">
            Self-report · Recorded only
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
            Recorded recovery summary
          </h2>
          <p className="mt-1 text-xs leading-5 text-ink-subtle">
            Generated {formatDateTime(brief.generatedAt)} · window of the last{" "}
            {brief.windowDays} days
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={BAND_TONE[band]}>{BAND_BADGE_LABEL[band]}</Badge>
          <Badge>Recorded only</Badge>
        </div>
      </div>

      <p className="mt-5 max-w-prose text-sm leading-6 text-ink">{brief.headline}</p>

      <dl className="mt-5 grid gap-3 rounded-control border border-line bg-raised/30 p-4 sm:grid-cols-3">
        <div>
          <dt className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
            Check-ins in window
          </dt>
          <dd className="mt-1 font-mono text-sm text-ink">{brief.checkInCount}</dd>
        </div>
        <div>
          <dt className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
            Latest observation
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {formatDateTime(brief.latestObservedAt)}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
            Confidence
          </dt>
          <dd className="mt-1 text-sm text-ink">
            {READINESS_CONFIDENCE_LABELS[brief.readiness.confidence.level]}
          </dd>
        </div>
      </dl>

      <div className="mt-8 space-y-2">
        <h3 className="text-base font-semibold tracking-tight text-ink">
          Readiness band
        </h3>
        <p className="text-sm leading-6 text-ink-muted">{brief.readiness.explanation}</p>
        <p className="text-xs leading-5 text-ink-subtle">
          {brief.readiness.confidence.reasons.join(" ")}
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <h3 className="text-base font-semibold tracking-tight text-ink">
          Scored factors
        </h3>
        <p className="text-sm leading-6 text-ink-muted">
          From the fixed, published rubric. Missing factors stay missing; nothing is
          filled in.
        </p>
        <FactorTable
          caption="Scored readiness factors"
          lines={brief.scoredFactors}
          includeWeight
        />
        {brief.contextFactors.length > 0 && (
          <>
            <h3 className="pt-2 text-base font-semibold tracking-tight text-ink">
              Context factors
            </h3>
            <FactorTable
              caption="Context readiness factors"
              lines={brief.contextFactors}
              includeWeight={false}
            />
          </>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold tracking-tight text-ink">
          Latest self-report
        </h3>
        <p className="mt-1 text-xs leading-5 text-ink-subtle">
          Crew-entered ratings from the most recent check-in in this window. Not
          measurements.
        </p>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {brief.observations.map((line) => (
            <div
              key={line.id}
              className="flex items-baseline justify-between gap-4 border-b border-line py-2"
            >
              <dt className="text-sm text-ink-muted">{line.label}</dt>
              <dd className="text-right text-sm text-ink">{line.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold tracking-tight text-ink">
          Suggested focus
        </h3>
        <p className="mt-1 text-xs leading-5 text-ink-subtle">
          Routine suggestions from the countermeasure coach. Not treatment and not an
          instruction to change operational duties.
        </p>
        <ul className="mt-3 space-y-3">
          {brief.countermeasures.suggestions
            .slice(0, MAX_FOCUS_ITEMS)
            .map((suggestion) => (
              <li
                key={suggestion.id}
                className="rounded-control border border-line bg-raised/30 p-4"
              >
                <p className="text-sm font-medium text-ink">{suggestion.title}</p>
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  {suggestion.rationale}
                </p>
                <p className="mt-2 text-xs leading-5 text-ink-subtle">
                  {suggestion.caution}
                </p>
              </li>
            ))}
        </ul>
      </div>

      <div className="mt-8">
        <h3 className="text-base font-semibold tracking-tight text-ink">Missing data</h3>
        {brief.missingData.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink-muted">
            {brief.missingData.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            No gaps were recorded for this window.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-control border border-dashed border-line p-4">
        <h3 className="text-base font-semibold tracking-tight text-ink">
          What this brief is not
        </h3>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink-muted">
          {brief.limits.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-5 text-ink-subtle">{BRIEF_SCOPE_NOTE}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button variant="secondary" onClick={() => void copy()}>
          Copy brief as text
        </Button>
        <p role="status" className="text-xs leading-5 text-ink-subtle">
          {copyState === "copied" &&
            "Copied to this device's clipboard. Astatine did not send it anywhere."}
          {copyState === "failed" &&
            "Copying is unavailable in this browser. Select the brief text and copy it manually."}
          {copyState === "idle" &&
            "This brief is composed at display time and not saved. Use Reports to freeze a snapshot."}
        </p>
      </div>

      <p className="mt-3 text-xs leading-5 text-ink-subtle">
        Need a fixed copy of one check-in?{" "}
        <Link
          to="/reports"
          className="text-accent underline underline-offset-4 hover:text-accent-strong"
        >
          Create a local report snapshot
        </Link>
        .
      </p>
    </Card>
  );
}
