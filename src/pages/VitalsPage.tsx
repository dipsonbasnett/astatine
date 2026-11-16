import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { VitalsIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { RelatedSurfaces } from "@/components/layout/RelatedSurfaces";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { useCheckIns } from "@/features/checkin/use-checkins";
import { OrganContext } from "@/features/vitals/OrganContext";
import { VitalsExplorer } from "@/features/vitals/VitalsExplorer";
import { VITALS_LIMITS, buildVitalsSnapshot } from "@/features/vitals/vitals-engine";
import { buildSimulatedVitalsMonitor } from "@/features/vitals/vitals-simulation";
import { TelemetryDemo } from "@/features/telemetry/TelemetryDemo";
import { DATA_CATEGORIES } from "@/lib/data-policy";

type WindowDays = 7 | 14;

export default function VitalsPage() {
  const { records, loading, error } = useCheckIns(50);
  const [windowDays, setWindowDays] = useState<WindowDays>(7);

  const snapshot = useMemo(
    () => buildVitalsSnapshot({ checkIns: records, windowDays }),
    [records, windowDays],
  );
  const monitor = useMemo(() => buildSimulatedVitalsMonitor(), []);
  const latestCheckIn = records[0] ?? null;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Recorded · Simulated · Research"
        title="Vitals"
        description="A clinical-monitor layout with three visibly separate sources: recorded self-report, clearly labeled simulated demonstrations, and attributed research context. Astatine does not measure, monitor, or diagnose anything."
        meta={
          <>
            <Badge tone="accent">Available</Badge>
            <Badge>Recorded + simulated + research</Badge>
            <span className="font-mono text-label text-ink-subtle uppercase">
              No sensors · No automatic capture
            </span>
          </>
        }
      />

      <section aria-labelledby="vitals-data-classes" className="space-y-4">
        <div className="max-w-3xl">
          <p className="font-mono text-label text-ink-subtle uppercase">
            Data separation
          </p>
          <h2
            id="vitals-data-classes"
            className="mt-2 text-2xl font-semibold tracking-tight text-ink"
          >
            Three classes, three sections
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Every value on this page belongs to exactly one class. The sections are never
            combined into one series, one score, or one conclusion.
          </p>
        </div>

        <Card className="grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {DATA_CATEGORIES.map((category) => (
            <div key={category.id} className="min-w-0 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-ink">
                  {category.label}
                </h3>
                <SourceBadge category={category.id}>{category.label}</SourceBadge>
              </div>
              <p className="mt-2 text-xs leading-5 text-ink-muted">{category.summary}</p>
            </div>
          ))}
        </Card>
      </section>

      <InlineAlert
        tone="info"
        title="Not diagnosis, not monitoring, not a medical device"
      >
        <ul className="list-disc space-y-1 pl-4">
          {VITALS_LIMITS.map((limit) => (
            <li key={limit}>{limit}</li>
          ))}
        </ul>
      </InlineAlert>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            id="vitals-window-label"
            className="font-mono text-label text-ink-subtle uppercase"
          >
            Observation window
          </p>
          <div
            role="group"
            aria-labelledby="vitals-window-label"
            className="mt-2 flex gap-2"
          >
            <Button
              size="sm"
              variant={windowDays === 7 ? "primary" : "secondary"}
              aria-pressed={windowDays === 7}
              onClick={() => {
                setWindowDays(7);
              }}
            >
              7 days
            </Button>
            <Button
              size="sm"
              variant={windowDays === 14 ? "primary" : "secondary"}
              aria-pressed={windowDays === 14}
              onClick={() => {
                setWindowDays(14);
              }}
            >
              14 days
            </Button>
          </div>
        </div>
        {snapshot && (
          <p className="text-xs leading-5 text-ink-subtle">
            {snapshot.checkInsInWindow} recorded check-in
            {snapshot.checkInsInWindow === 1 ? "" : "s"} in the selected window. The
            window applies to recorded values only.
          </p>
        )}
      </div>

      {loading && records.length === 0 && (
        <Card className="space-y-4 p-6" aria-busy="true">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-40 w-full" />
        </Card>
      )}

      {error && (
        <InlineAlert tone="danger" title="Recorded vitals unavailable">
          <p>{error}</p>
          <p>
            Simulated demonstrations and research context do not depend on local storage
            and remain available below. Recorded values stay empty rather than being
            estimated.
          </p>
        </InlineAlert>
      )}

      {!loading && !error && records.length === 0 && (
        <InlineAlert tone="info" live title="No recorded check-ins yet">
          <p>
            Recorded series are empty and their gaps are shown honestly. Simulated
            demonstrations and research context remain available for review.
          </p>
          <Link
            to="/check-in"
            className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
          >
            <VitalsIcon className="size-4" />
            Record a check-in
          </Link>
        </InlineAlert>
      )}

      {snapshot && <VitalsExplorer snapshot={snapshot} />}

      {snapshot && <OrganContext monitor={monitor} latestCheckIn={latestCheckIn} />}

      <section aria-labelledby="vitals-generator-heading" className="space-y-4">
        <div className="max-w-3xl">
          <p className="font-mono text-label text-ink-subtle uppercase">
            Optional local sample
          </p>
          <h2
            id="vitals-generator-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-ink"
          >
            Simulated telemetry generator
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            A separate demonstration writes seeded synthetic samples to the simulated
            table so provenance, labeling, and deletion can be reviewed. These samples
            never enter recorded views, readiness, or reports.
          </p>
        </div>
        <TelemetryDemo />
      </section>

      <RelatedSurfaces
        paths={["/check-in", "/readiness", "/mission", "/brief", "/research"]}
      />
    </div>
  );
}
