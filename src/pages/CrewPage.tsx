import { useState } from "react";
import { Link } from "react-router-dom";

import { CrewIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { RelatedSurfaces } from "@/components/layout/RelatedSurfaces";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { buttonStyles } from "@/components/ui/button-styles";
import { useCheckIns } from "@/features/checkin/use-checkins";
import { CrewOverview } from "@/features/crew/CrewOverview";
import {
  CREW_PRIVACY_NOTE,
  CREW_ROSTER_NOTE,
  buildCrewReadinessSnapshot,
} from "@/features/crew/crew-engine";
import { ResearchContextPanel } from "@/features/research/ResearchContextPanel";
import { LIFESTYLE_RESEARCH_DOMAINS } from "@/features/research/surfaces";
import { usePreferences } from "@/preferences/usePreferences";

type WindowDays = 7 | 14;

export default function CrewPage() {
  const { records, loading, error } = useCheckIns(50);
  const { preferences } = usePreferences();
  const [windowDays, setWindowDays] = useState<WindowDays>(7);

  const snapshot = buildCrewReadinessSnapshot({
    checkIns: records,
    displayName: preferences.callsign,
    windowDays,
  });

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Crew overview · Recorded only" title="Crew readiness" />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            id="crew-window-label"
            className="font-mono text-label text-ink-subtle uppercase"
          >
            Crew window
          </p>
          <div
            role="group"
            aria-labelledby="crew-window-label"
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
        {snapshot && (
          <p className="text-xs leading-5 text-ink-subtle">
            {snapshot.member.checkInCount} recorded check-in
            {snapshot.member.checkInCount === 1 ? "" : "s"} across{" "}
            {snapshot.member.recordedDays} recorded day
            {snapshot.member.recordedDays === 1 ? "" : "s"} in the selected window.
          </p>
        )}
      </div>

      <p className="sr-only" role="status">
        {snapshot
          ? `Crew overview for the ${windowDays}-day window. ${snapshot.member.recordedDays} recorded days, ${snapshot.dataGaps.length} data gap${snapshot.dataGaps.length === 1 ? "" : "s"}, and ${snapshot.attentionItems.length} review item${snapshot.attentionItems.length === 1 ? "" : "s"}.`
          : `No crew summary for the ${windowDays}-day window.`}
      </p>

      <InlineAlert tone="info" title="Privacy and crew scope">
        <p>{CREW_ROSTER_NOTE}</p>
        <p>{CREW_PRIVACY_NOTE}</p>
        <p>
          This overview does not diagnose, predict medical events, rank people, or assess
          fitness for duty. It is not an operational status board or a medical record.
        </p>
      </InlineAlert>

      {loading && records.length === 0 && (
        <Card className="space-y-4 p-6" aria-busy="true">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-28 w-full" />
        </Card>
      )}

      {error && (
        <InlineAlert tone="danger" title="Crew overview unavailable">
          <p>{error}</p>
          <p>No crew value is estimated or filled from another data class.</p>
        </InlineAlert>
      )}

      {!loading && !error && !snapshot && (
        <EmptyState
          icon={<CrewIcon className="size-5" />}
          title={`No check-in in the ${windowDays}-day window`}
          description={
            records.length > 0
              ? "The recorded check-ins are outside the selected window. Record a new check-in or widen the window. Crew values are never estimated or carried forward."
              : "Crew readiness uses recorded check-ins only. Save one first; simulated telemetry, the simulated recovery trend, and research context never fill a crew value."
          }
          action={
            <Link to="/check-in" className={buttonStyles()}>
              Record a check-in
            </Link>
          }
        />
      )}

      {!error && snapshot && <CrewOverview snapshot={snapshot} />}

      <ResearchContextPanel domains={LIFESTYLE_RESEARCH_DOMAINS} />

      <RelatedSurfaces
        paths={["/check-in", "/readiness", "/mission", "/brief", "/reports"]}
        title="Individual and mission surfaces"
      />
    </div>
  );
}
