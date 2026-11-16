import { useState } from "react";
import { Link } from "react-router-dom";

import { CheckInIcon, ReportsIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { buttonStyles } from "@/components/ui/button-styles";
import { formatDateTime, formatDecimal } from "@/lib/format";
import { useAppStore } from "@/state/app-store";
import type { ReportSnapshotRecord } from "@/types/health";

import { useCheckIns } from "@/features/checkin/use-checkins";
import { CHECK_IN_FIELDS } from "@/features/checkin/checkin-engine";
import { buildCountermeasurePlan } from "@/features/countermeasures/countermeasure-engine";
import { ReadinessDetails } from "@/features/readiness/ReadinessDetails";
import { assessReadiness } from "@/features/readiness/readiness-engine";
import { buildReportSnapshotDraft } from "@/features/reports/report-engine";
import { createReportSnapshot } from "@/features/reports/report-repository";
import { useReportSnapshots } from "@/features/reports/use-report-snapshots";

export default function ReportsPage() {
  const refreshData = useAppStore((state) => state.refreshData);
  const checkIns = useCheckIns(20);
  const snapshots = useReportSnapshots(3);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const latest = checkIns.records[0];
  const assessment = assessReadiness({ checkIns: checkIns.records });
  const countermeasures = assessment ? buildCountermeasurePlan(assessment) : null;

  const createSnapshot = async () => {
    if (!latest || !assessment || !countermeasures) return;
    setStatus(null);
    setCreateError(null);
    setCreating(true);

    try {
      const generatedAt = new Date().toISOString();
      const draft = buildReportSnapshotDraft({
        checkIn: latest,
        readiness: assessment,
        countermeasures,
        generatedAt,
      });
      await createReportSnapshot(draft);
      setStatus(
        `Snapshot saved at ${formatDateTime(generatedAt)}. It freezes this check-in and the rubric output; it is not a clinical report.`,
      );
      refreshData();
    } catch (caught: unknown) {
      setCreateError(
        caught instanceof Error
          ? caught.message
          : "The report snapshot could not be saved.",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Local review"
        title="Reports"
        description="Freeze the latest recorded check-in and its visible readiness rubric into a local snapshot. Snapshots are for reflection and explicit conversation, never clinical documents."
        meta={
          <>
            <Badge tone="accent">Available</Badge>
            <span className="font-mono text-label text-ink-subtle uppercase">
              Recorded data · Local snapshots
            </span>
          </>
        }
      />

      {checkIns.error && (
        <InlineAlert tone="danger" title="Recorded check-ins unavailable">
          <p>{checkIns.error}</p>
        </InlineAlert>
      )}

      {!checkIns.loading && !checkIns.error && !latest && (
        <EmptyState
          icon={<CheckInIcon className="size-5" />}
          title="No recorded check-in to summarize"
          description="A report snapshot needs a recorded check-in. Save one first; simulated telemetry is never used to fill the gap."
          action={
            <Link to="/check-in" className={buttonStyles()}>
              Record a check-in
            </Link>
          }
        />
      )}

      {latest && assessment && countermeasures && (
        <Card className="p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-prose">
              <p className="font-mono text-label text-ink-subtle uppercase">
                Report snapshot
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
                Create a local snapshot
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                The snapshot copies the latest check-in, the fixed-rubric readiness
                factors, missing data, confidence, and wellness suggestions at this
                moment. It excludes simulated telemetry and research context.
              </p>
            </div>
            <Badge>Recorded only</Badge>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-ink-subtle">
              Latest check-in: {formatDateTime(latest.observedAt)}. Deleting recorded data
              also deletes its snapshots.
            </p>
            <Button
              disabled={creating}
              onClick={() => {
                void createSnapshot();
              }}
              className="shrink-0"
            >
              {creating ? "Creating…" : "Create report snapshot"}
            </Button>
          </div>

          {status && (
            <InlineAlert tone="success" title="Snapshot saved" className="mt-5">
              <p>{status}</p>
            </InlineAlert>
          )}
          {createError && (
            <InlineAlert tone="danger" title="Snapshot not saved" className="mt-5">
              <p>{createError}</p>
            </InlineAlert>
          )}
        </Card>
      )}

      <section aria-labelledby="saved-reports-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-label text-ink-subtle uppercase">
              Local archive
            </p>
            <h2
              id="saved-reports-heading"
              className="mt-2 text-2xl font-semibold tracking-tight text-ink"
            >
              Saved snapshots
            </h2>
          </div>
          {snapshots.records.length > 0 && (
            <p className="text-xs leading-5 text-ink-subtle">
              Showing the {snapshots.records.length} most recent
            </p>
          )}
        </div>

        {snapshots.error && (
          <InlineAlert tone="danger" title="Snapshots unavailable">
            <p>{snapshots.error}</p>
          </InlineAlert>
        )}

        {snapshots.loading && snapshots.records.length === 0 && (
          <Card className="space-y-4 p-6" aria-busy="true">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-24 w-full" />
          </Card>
        )}

        {!snapshots.loading && !snapshots.error && snapshots.records.length === 0 && (
          <EmptyState
            icon={<ReportsIcon className="size-5" />}
            title="No snapshots saved"
            description="Create a snapshot after a check-in to keep a local, immutable view of the self-report and the rubric output."
          />
        )}

        {snapshots.records.map((snapshot) => (
          <SnapshotCard key={snapshot.id} snapshot={snapshot} />
        ))}
      </section>
    </div>
  );
}

function SnapshotCard({ snapshot }: { snapshot: ReportSnapshotRecord }) {
  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-label text-ink-subtle uppercase">
            Snapshot · {formatDateTime(snapshot.generatedAt)}
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">
            {snapshot.title}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="accent">Recorded</Badge>
          <Badge>Derived locally</Badge>
        </div>
      </div>

      <div className="mt-6 rounded-control border border-line bg-canvas/40 p-4">
        <p className="font-mono text-label text-ink-subtle uppercase">
          Check-in observation
        </p>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-ink-subtle">Observed</dt>
            <dd className="mt-0.5 text-ink">
              {formatDateTime(snapshot.observation.observedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-ink-subtle">Sleep duration</dt>
            <dd className="mt-0.5 font-mono text-xs text-ink">
              {formatDecimal(snapshot.observation.sleepHours, 2)} h
            </dd>
          </div>
          {CHECK_IN_FIELDS.map((field) => (
            <div key={field.id}>
              <dt className="text-ink-subtle">{field.label}</dt>
              <dd className="mt-0.5 font-mono text-xs text-ink">
                {snapshot.observation[field.id]}/5
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-7 border-t border-line pt-7">
        <ReadinessDetails
          assessment={snapshot.readiness}
          countermeasures={snapshot.countermeasures}
          headingLevel="h3"
          title="Snapshot readiness"
        />
      </div>

      <p className="mt-6 border-t border-line pt-5 text-xs leading-5 text-ink-subtle">
        Source: {snapshot.source.label}. Derived from check-in{" "}
        <span className="font-mono">{snapshot.checkInId.slice(0, 8)}</span> at{" "}
        {formatDateTime(snapshot.observation.observedAt)}. This is not a clinical document
        and was not uploaded.
      </p>
    </Card>
  );
}
