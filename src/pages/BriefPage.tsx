import { Link } from "react-router-dom";

import { CheckInIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { RelatedSurfaces } from "@/components/layout/RelatedSurfaces";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { buttonStyles } from "@/components/ui/button-styles";
import { MissionBrief } from "@/features/brief/MissionBrief";
import {
  BRIEF_WINDOW_DAYS,
  buildMissionHealthBrief,
} from "@/features/brief/brief-engine";
import { useCheckIns } from "@/features/checkin/use-checkins";
import { ResearchContextPanel } from "@/features/research/ResearchContextPanel";
import { LIFESTYLE_RESEARCH_DOMAINS } from "@/features/research/surfaces";

export default function BriefPage() {
  const { records, loading, error } = useCheckIns(50);
  const brief = buildMissionHealthBrief({
    checkIns: records,
    generatedAt: new Date().toISOString(),
  });

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Self-report briefing"
        title="Mission health brief"
        description="A concise, read-only briefing of recorded check-ins for the last seven days. It composes the same fixed rubric and countermeasure suggestions into one document, states what is missing, and never describes the mission, the crew, or operational status."
        meta={
          <>
            <Badge tone="accent">Available</Badge>
            <Badge>Recorded only</Badge>
            <span className="font-mono text-label text-ink-subtle uppercase">
              Not clinical · Not operational
            </span>
          </>
        }
      />

      <InlineAlert tone="info" title="Self-report briefing, not a medical document">
        <p>
          Every value below is crew-entered self-report or derived from it by a published
          rubric. Astatine does not measure, diagnose, predict medical events, or assess
          fitness for duty.
        </p>
      </InlineAlert>

      {loading && records.length === 0 && (
        <Card className="space-y-4 p-6" aria-busy="true">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-40 w-full" />
        </Card>
      )}

      {error && (
        <InlineAlert tone="danger" title="Mission health brief unavailable">
          <p>{error}</p>
        </InlineAlert>
      )}

      {!loading && !error && !brief && (
        <EmptyState
          icon={<CheckInIcon className="size-5" />}
          title={`No check-in in the ${BRIEF_WINDOW_DAYS}-day window`}
          description="The brief is built only from recorded check-ins. Simulated telemetry and research context never fill the gap. Record a check-in to start a brief."
          action={
            <Link to="/check-in" className={buttonStyles()}>
              Record a check-in
            </Link>
          }
        />
      )}

      {brief && <MissionBrief brief={brief} />}

      <ResearchContextPanel domains={LIFESTYLE_RESEARCH_DOMAINS} />

      <RelatedSurfaces paths={["/readiness", "/reports", "/check-in", "/vitals"]} />
    </div>
  );
}
