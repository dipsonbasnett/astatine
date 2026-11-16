import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { CheckInIcon, ReportsIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { RelatedSurfaces } from "@/components/layout/RelatedSurfaces";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Skeleton } from "@/components/ui/Skeleton";
import { buttonStyles } from "@/components/ui/button-styles";
import { downloadTextFile } from "@/lib/download";
import { formatDateTime, formatDecimal } from "@/lib/format";
import { useAppStore } from "@/state/app-store";
import type { ReportSnapshotRecord } from "@/types/health";

import { useCheckIns } from "@/features/checkin/use-checkins";
import { CHECK_IN_FIELDS } from "@/features/checkin/checkin-engine";
import { buildCountermeasurePlan } from "@/features/countermeasures/countermeasure-engine";
import { ReadinessDetails } from "@/features/readiness/ReadinessDetails";
import { assessReadiness } from "@/features/readiness/readiness-engine";
import {
  REPORT_WINDOW_OPTIONS,
  buildMissionReport,
  type ReportWindowDays,
} from "@/features/reports/mission-report-engine";
import {
  reportFilename,
  reportToJson,
  reportToMarkdown,
  type ReportExportFormat,
} from "@/features/reports/mission-report-export";
import { ReportPreview } from "@/features/reports/ReportPreview";
import { buildReportSnapshotDraft } from "@/features/reports/report-engine";
import { createReportSnapshot } from "@/features/reports/report-repository";
import { useReportSnapshots } from "@/features/reports/use-report-snapshots";

export default function ReportsPage() {
  const refreshData = useAppStore((state) => state.refreshData);
  const checkIns = useCheckIns(100);
  const snapshots = useReportSnapshots(3);
  const [windowDays, setWindowDays] = useState<ReportWindowDays>(7);
  const [generatedAt, setGeneratedAt] = useState(() => new Date().toISOString());
  const [includePrivateNotes, setIncludePrivateNotes] = useState(false);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const selectWindow = (days: ReportWindowDays) => {
    if (days === windowDays) return;
    setWindowDays(days);
    setGeneratedAt(new Date().toISOString());
  };

  const report = useMemo(
    () =>
      buildMissionReport({
        checkIns: checkIns.records,
        generatedAt,
        windowDays,
        includePrivateNotes,
      }),
    [checkIns.records, generatedAt, windowDays, includePrivateNotes],
  );

  const snapshotAssessment = assessReadiness({ checkIns: checkIns.records });
  const snapshotCountermeasures = snapshotAssessment
    ? buildCountermeasurePlan(snapshotAssessment)
    : null;
  const snapshotCheckIn = snapshotAssessment
    ? checkIns.records.find((record) => record.id === snapshotAssessment.inputs.checkInId)
    : undefined;

  const createSnapshot = async () => {
    if (!snapshotCheckIn || !snapshotAssessment || !snapshotCountermeasures) return;
    setStatus(null);
    setCreateError(null);
    setCreating(true);

    try {
      const generatedSnapshotAt = new Date().toISOString();
      const draft = buildReportSnapshotDraft({
        checkIn: snapshotCheckIn,
        readiness: snapshotAssessment,
        countermeasures: snapshotCountermeasures,
        generatedAt: generatedSnapshotAt,
      });
      await createReportSnapshot(draft);
      setStatus(
        `Snapshot saved at ${formatDateTime(generatedSnapshotAt)}. It freezes this check-in and the rubric output; it does not include private notes.`,
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

  const downloadReport = (format: ReportExportFormat) => {
    if (!report) return;
    const filename = reportFilename(report, format);
    const content =
      format === "markdown" ? reportToMarkdown(report) : reportToJson(report);
    downloadTextFile(
      filename,
      format === "markdown" ? "text/markdown" : "application/json",
      content,
    );
    setExportStatus(
      `${filename} was created in this browser. Astatine did not upload it.`,
    );
  };

  const printReport = () => {
    window.print();
    setExportStatus(
      "Print layout opened. Printing or saving a PDF creates a copy outside this browser.",
    );
  };

  return (
    <div className="space-y-10">
      <div className="print:hidden">
        <PageHeader eyebrow="Private review · Recorded only" title="Reports" />
      </div>

      {checkIns.error && (
        <InlineAlert tone="danger" title="Recorded check-ins unavailable">
          <p>{checkIns.error}</p>
        </InlineAlert>
      )}

      {!checkIns.error && (
        <section
          aria-labelledby="report-builder-heading"
          className="space-y-5 print:hidden"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-label text-ink-subtle uppercase">
                Report builder
              </p>
              <h2
                id="report-builder-heading"
                className="mt-2 text-2xl font-semibold tracking-tight text-ink"
              >
                Select a period and review the export
              </h2>
            </div>
            {report && (
              <p className="text-xs leading-5 text-ink-subtle">
                {report.checkInCount} recorded check-in
                {report.checkInCount === 1 ? "" : "s"} in the selected window
              </p>
            )}
          </div>

          <Card className="space-y-5 p-5 sm:p-6">
            <div>
              <p
                id="report-period-label"
                className="font-mono text-label text-ink-subtle uppercase"
              >
                Selected period
              </p>
              <div
                role="group"
                aria-labelledby="report-period-label"
                className="mt-2 flex flex-wrap gap-2"
              >
                {REPORT_WINDOW_OPTIONS.map((days) => (
                  <Button
                    key={days}
                    size="sm"
                    variant={windowDays === days ? "primary" : "secondary"}
                    aria-pressed={windowDays === days}
                    onClick={() => selectWindow(days)}
                  >
                    {days} days
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-control border border-line bg-canvas/40 p-4">
              <label
                htmlFor="report-private-notes"
                className="flex cursor-pointer items-start gap-3 text-sm font-medium text-ink"
              >
                <input
                  id="report-private-notes"
                  type="checkbox"
                  checked={includePrivateNotes}
                  onChange={(event) => {
                    setIncludePrivateNotes(event.target.checked);
                  }}
                  aria-describedby="report-private-notes-help"
                  className="mt-0.5 size-4 shrink-0 accent-accent"
                />
                <span>Include private notes (opt-in)</span>
              </label>
              <p
                id="report-private-notes-help"
                className="mt-2 max-w-prose text-xs leading-5 text-ink-subtle"
              >
                Off by default. This build stores no free-text notes, so the opt-in adds
                an explicit no-notes statement; it never invents or reveals note content.
              </p>
            </div>

            {report ? (
              <div className="flex flex-col gap-4 border-t border-line pt-5">
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => downloadReport("markdown")}>
                    Download Markdown
                  </Button>
                  <Button variant="secondary" onClick={() => downloadReport("json")}>
                    Download JSON
                  </Button>
                  <Button variant="secondary" onClick={printReport}>
                    Print or save as PDF
                  </Button>
                </div>
                <p className="text-xs leading-5 text-ink-subtle">
                  Report identity and generation time stay fixed for this preview. Change
                  the period or local data to generate a new report.
                </p>
              </div>
            ) : (
              <p className="text-xs leading-5 text-ink-subtle">
                A report is created only from recorded check-ins in the selected period.
                Simulated telemetry and research context never fill a gap.
              </p>
            )}

            <p role="status" className="text-xs leading-5 text-ink-subtle">
              {exportStatus ?? "No file has been created by this page."}
            </p>
          </Card>
        </section>
      )}

      {checkIns.loading && checkIns.records.length === 0 && !checkIns.error && (
        <Card className="space-y-4 p-6" aria-busy="true">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-40 w-full" />
        </Card>
      )}

      {!checkIns.loading && !checkIns.error && !report && (
        <EmptyState
          icon={<CheckInIcon className="size-5" />}
          title={`No check-in in the ${windowDays}-day window`}
          description={
            checkIns.records.length > 0
              ? "The recorded check-ins are outside the selected period. Record a new check-in or widen the period; simulated and research content never fill the gap."
              : "A report is built only from recorded check-ins. Save one first; simulated telemetry and research context are never used to fill the gap."
          }
          action={
            <Link to="/check-in" className={buttonStyles()}>
              Record a check-in
            </Link>
          }
        />
      )}

      {report && <ReportPreview report={report} />}

      <div className="space-y-8 print:hidden">
        {snapshotCheckIn && snapshotAssessment && snapshotCountermeasures && (
          <Card className="p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-prose">
                <p className="font-mono text-label text-ink-subtle uppercase">
                  Optional local archive
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
                  Create a single check-in snapshot
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  This archive freezes only the latest recorded check-in and its
                  fixed-rubric readiness details. It is separate from the exported review
                  above and never includes simulated telemetry, research context, or
                  private notes.
                </p>
              </div>
              <Badge>Recorded only</Badge>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-ink-subtle">
                Latest check-in: {formatDateTime(snapshotCheckIn.observedAt)}. Deleting
                recorded data also deletes its snapshots.
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
              description="Create a snapshot after a check-in to keep a local, immutable view of the self-report and the rubric output. Exports above do not require a stored snapshot."
            />
          )}

          {snapshots.records.map((snapshot) => (
            <SnapshotCard key={snapshot.id} snapshot={snapshot} />
          ))}
        </section>
      </div>

      <div className="print:hidden">
        <RelatedSurfaces
          paths={["/check-in", "/readiness", "/mission", "/brief", "/research"]}
          title="Recorded review surfaces"
        />
      </div>
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
