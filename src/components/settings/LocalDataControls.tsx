import { useEffect, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  DataTransferError,
  MAX_IMPORT_BYTES,
  createExportBundle,
  formatImportSummary,
  importLocalData,
  serializeExportBundle,
} from "@/lib/data-transfer";
import {
  deleteAllLocalData,
  deleteRecordedData,
  deleteSimulatedData,
  getLocalDataCounts,
  type LocalDataCounts,
} from "@/lib/data-privacy";
import { toDataLayerError } from "@/lib/db";
import { useAppStore } from "@/state/app-store";

type DeleteTarget = "recorded" | "simulated" | "all";
type Notice = { tone: "success" | "danger"; title: string; details?: string[] } | null;

const DELETE_COPY: Record<
  DeleteTarget,
  { title: string; description: string; action: string }
> = {
  recorded: {
    title: "Delete recorded health data?",
    description:
      "This permanently deletes every recorded check-in and every derived report snapshot from this browser. It cannot be undone.",
    action: "Delete recorded data",
  },
  simulated: {
    title: "Delete simulated telemetry?",
    description:
      "This permanently deletes every simulated telemetry sample from this browser. Recorded check-ins and report snapshots are not affected.",
    action: "Delete simulated data",
  },
  all: {
    title: "Delete all health data?",
    description:
      "This permanently deletes every recorded check-in, report snapshot, and simulated telemetry sample from this browser. It cannot be undone.",
    action: "Delete all health data",
  },
};

export function LocalDataControls() {
  const revision = useAppStore((state) => state.dataRevision);
  const refreshData = useAppStore((state) => state.refreshData);
  const [counts, setCounts] = useState<LocalDataCounts | null>(null);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  useEffect(() => {
    let active = true;

    getLocalDataCounts()
      .then((nextCounts) => {
        if (!active) return;
        setCounts(nextCounts);
        setCountsError(null);
      })
      .catch((error: unknown) => {
        if (active) setCountsError(toDataLayerError(error).message);
      });

    return () => {
      active = false;
    };
  }, [revision]);

  const exportData = async () => {
    setNotice(null);
    setBusy("export");

    try {
      if (typeof URL.createObjectURL !== "function") {
        throw new Error("Browser downloads are unavailable in this context.");
      }

      const bundle = await createExportBundle();
      const blob = new Blob([serializeExportBundle(bundle)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `astatine-local-data-${bundle.exportedAt.slice(0, 10)}.json`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setNotice({
        tone: "success",
        title: "Local export prepared",
        details: ["The JSON file was created in this browser. No data was uploaded."],
      });
    } catch (error: unknown) {
      setNotice({
        tone: "danger",
        title: "Export failed",
        details: [toDataLayerError(error).message],
      });
    } finally {
      setBusy(null);
    }
  };

  const importData = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setNotice(null);
    setBusy("import");

    try {
      if (file.size > MAX_IMPORT_BYTES) {
        setNotice({
          tone: "danger",
          title: "Import rejected",
          details: ["The file exceeds the local import size limit."],
        });
        return;
      }

      const raw = await file.text();
      const summary = await importLocalData(raw);
      setNotice({
        tone: "success",
        title: "Local import complete",
        details: [
          formatImportSummary(summary),
          "Records with matching ids were replaced. Nothing was uploaded.",
        ],
      });
      refreshData();
    } catch (error: unknown) {
      const details =
        error instanceof DataTransferError && error.issues.length > 0
          ? error.issues.slice(0, 5)
          : [error instanceof Error ? error.message : "The import failed."];
      setNotice({ tone: "danger", title: "Import rejected", details });
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;

    setNotice(null);
    setBusy("delete");

    try {
      if (target === "recorded") await deleteRecordedData();
      if (target === "simulated") await deleteSimulatedData();
      if (target === "all") await deleteAllLocalData();

      setNotice({
        tone: "success",
        title: "Local data deleted",
        details: ["The selected records were removed from this browser."],
      });
      setDeleteTarget(null);
      refreshData();
    } catch (error: unknown) {
      setNotice({
        tone: "danger",
        title: "Delete failed",
        details: [toDataLayerError(error).message],
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-label text-ink-subtle uppercase">
              Local data controls
            </p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">
              Review, export, import, or delete
            </h3>
            <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
              Exports and imports are local files you choose. Astatine has no backend and
              never uploads health records automatically. Records are stored in this
              browser&apos;s IndexedDB.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={busy !== null}
            onClick={() => {
              void exportData();
            }}
          >
            {busy === "export" ? "Preparing…" : "Export local data"}
          </Button>
        </div>

        <dl className="mt-6 divide-y divide-line">
          <CountRow
            label="Recorded check-ins"
            value={counts ? String(counts.checkIns) : "…"}
          />
          <CountRow
            label="Report snapshots (derived)"
            value={counts ? String(counts.reportSnapshots) : "…"}
          />
          <CountRow
            label="Simulated telemetry samples"
            value={counts ? String(counts.telemetrySamples) : "…"}
          />
          <CountRow label="Automatic uploads" value="None" />
        </dl>

        {countsError && (
          <InlineAlert tone="danger" title="Local counts unavailable" className="mt-5">
            <p>{countsError}</p>
          </InlineAlert>
        )}
      </Card>

      <Card className="p-6 sm:p-7">
        <h3 className="text-lg font-semibold tracking-tight text-ink">Import a file</h3>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          Importing validates every record and its data-class section before writing.
          Files from another Astatine build with an unsupported version are rejected.
        </p>
        <div className="mt-5">
          <Input
            label="Astatine local-data export (JSON)"
            hint="Maximum 5 MB. Matching record ids are replaced; other records are merged."
            type="file"
            accept="application/json,.json"
            disabled={busy !== null}
            onChange={(event) => {
              void importData(event);
            }}
          />
        </div>
      </Card>

      <Card className="p-6 sm:p-7">
        <h3 className="text-lg font-semibold tracking-tight text-ink">Delete data</h3>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          Deletion is immediate and cannot be undone. Interface preferences are reset
          separately above.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            variant="danger"
            aria-haspopup="dialog"
            disabled={busy !== null}
            onClick={() => {
              setDeleteTarget("recorded");
            }}
          >
            Delete recorded data
          </Button>
          <Button
            variant="danger"
            aria-haspopup="dialog"
            disabled={busy !== null}
            onClick={() => {
              setDeleteTarget("simulated");
            }}
          >
            Delete simulated data
          </Button>
          <Button
            variant="danger"
            aria-haspopup="dialog"
            disabled={busy !== null}
            onClick={() => {
              setDeleteTarget("all");
            }}
          >
            Delete all health data
          </Button>
        </div>
      </Card>

      {notice && (
        <InlineAlert tone={notice.tone} title={notice.title}>
          {notice.details?.map((detail) => (
            <p key={detail}>{detail}</p>
          ))}
        </InlineAlert>
      )}

      <Modal
        open={deleteTarget !== null}
        onClose={() => {
          if (busy !== "delete") setDeleteTarget(null);
        }}
        title={deleteTarget ? DELETE_COPY[deleteTarget].title : "Delete data?"}
        description={deleteTarget ? DELETE_COPY[deleteTarget].description : undefined}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={busy === "delete"}
              onClick={() => {
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={busy === "delete"}
              onClick={() => {
                void confirmDelete();
              }}
            >
              {busy === "delete"
                ? "Deleting…"
                : deleteTarget
                  ? DELETE_COPY[deleteTarget].action
                  : "Delete"}
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-ink-muted">
          This action affects this browser only. It does not contact a server, because
          Astatine has no backend.
        </p>
      </Modal>
    </div>
  );
}

function CountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-right font-mono text-xs text-ink uppercase">{value}</dd>
    </div>
  );
}
