import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { CheckInIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { RelatedSurfaces } from "@/components/layout/RelatedSurfaces";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { buttonStyles } from "@/components/ui/button-styles";
import { useCheckIns } from "@/features/checkin/use-checkins";
import { CountermeasureCoach } from "@/features/countermeasures/CountermeasureCoach";
import { buildCountermeasureCoach } from "@/features/countermeasures/countermeasure-engine";
import { ReadinessPanel } from "@/features/readiness/ReadinessPanel";
import { RecoveryTrendPanel } from "@/features/readiness/RecoveryTrendPanel";
import {
  READINESS_BAND_LABELS,
  assessReadiness,
} from "@/features/readiness/readiness-engine";
import { buildSimulatedRecoveryTrend } from "@/features/readiness/recovery-trend";

type WindowDays = 7 | 14;

export default function ReadinessPage() {
  const { records, loading, error } = useCheckIns(50);
  const [windowDays, setWindowDays] = useState<WindowDays>(7);

  const assessment = assessReadiness({ checkIns: records, windowDays });
  const coach = assessment ? buildCountermeasureCoach(assessment) : null;
  const trend = useMemo(() => buildSimulatedRecoveryTrend({ windowDays }), [windowDays]);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Recorded recovery · Non-diagnostic"
        title="Recovery readiness"
        description="A fixed-rubric view of recorded recovery inputs and a daily countermeasure coach. Every factor shows its source, missing data stays visible, and the simulated trend never affects the band. Monitoring support, not diagnosis."
        meta={
          <>
            <Badge tone="accent">Available</Badge>
            <Badge>Recorded + labeled simulation</Badge>
            <span className="font-mono text-label text-ink-subtle uppercase">
              No opaque AI score
            </span>
          </>
        }
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            id="readiness-window-label"
            className="font-mono text-label text-ink-subtle uppercase"
          >
            Readiness window
          </p>
          <div
            role="group"
            aria-labelledby="readiness-window-label"
            className="mt-2 flex gap-2"
          >
            <Button
              size="sm"
              variant={windowDays === 7 ? "primary" : "secondary"}
              aria-pressed={windowDays === 7}
              onClick={() => setWindowDays(7)}
            >
              7 days
            </Button>
            <Button
              size="sm"
              variant={windowDays === 14 ? "primary" : "secondary"}
              aria-pressed={windowDays === 14}
              onClick={() => setWindowDays(14)}
            >
              14 days
            </Button>
          </div>
        </div>
        {assessment && (
          <p className="text-xs leading-5 text-ink-subtle">
            {assessment.inputs.checkInsInWindow} recorded check-in
            {assessment.inputs.checkInsInWindow === 1 ? "" : "s"} in the selected window.
          </p>
        )}
      </div>

      <p className="sr-only" role="status">
        {assessment
          ? `${READINESS_BAND_LABELS[assessment.band]} readiness for the ${windowDays}-day window.`
          : `No readiness result for the ${windowDays}-day window.`}
      </p>

      <InlineAlert tone="info" title="Monitoring support, not diagnosis">
        <p>
          This view summarizes recorded self-report and logging context with a fixed,
          published rubric. It does not diagnose, predict medical events, assess fitness
          for duty, or replace your mission medical support channel.
        </p>
      </InlineAlert>

      {loading && records.length === 0 && (
        <Card className="space-y-4 p-6" aria-busy="true">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-40 w-full" />
        </Card>
      )}

      {error && (
        <InlineAlert tone="danger" title="Recovery readiness unavailable">
          <p>{error}</p>
        </InlineAlert>
      )}

      {!loading && !error && !assessment && (
        <EmptyState
          icon={<CheckInIcon className="size-5" />}
          title={`No check-in in the ${windowDays}-day window`}
          description={
            records.length > 0
              ? "The recorded check-ins are outside the selected window. Record a new check-in to see readiness, or widen the window."
              : "Recovery readiness uses recorded check-ins only. Save one first; the simulated trend is never used to fill the gap."
          }
          action={
            <Link to="/check-in" className={buttonStyles()}>
              Record a check-in
            </Link>
          }
        />
      )}

      {assessment && (
        <div className="space-y-8">
          <ReadinessPanel assessment={assessment} />
          <RecoveryTrendPanel trend={trend} />
        </div>
      )}

      {coach && <CountermeasureCoach coach={coach} />}

      <RelatedSurfaces paths={["/check-in", "/vitals", "/mission", "/reports"]} />
    </div>
  );
}
