import { Badge } from "@/components/ui/Badge";
import { INGESTION_REGISTRY } from "./ingestion/registry";
import { INGESTION_PIPELINE_NOTE, INGESTION_STAGES } from "./ingestion/types";

export function IngestionPipeline() {
  return (
    <section aria-labelledby="ingestion-pipeline-heading" className="space-y-5">
      <div>
        <p className="font-mono text-label text-ink-subtle uppercase">Intake</p>
        <h2
          id="ingestion-pipeline-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-ink"
        >
          Ingestion pipeline
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          {INGESTION_PIPELINE_NOTE}
        </p>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          A request is ready only when all thirteen gates pass. A blocked gate stops the
          request; missing values are never imputed and no reviewer may approve their own
          extraction.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">Offline</Badge>
        <Badge>No download</Badge>
        <Badge>Human review required</Badge>
        <span className="text-xs leading-5 text-ink-subtle">
          {INGESTION_REGISTRY.length === 0
            ? "No ingestion requests are queued."
            : `${INGESTION_REGISTRY.length} ingestion request${INGESTION_REGISTRY.length === 1 ? "" : "s"} queued.`}
        </span>
      </div>

      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {INGESTION_STAGES.map((stage, index) => (
          <li key={stage.id} className="rounded-panel border border-line bg-surface p-5">
            <p className="font-mono text-label text-accent uppercase">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-sm font-semibold text-ink">{stage.label}</h3>
            <p className="mt-2 text-xs leading-5 text-ink-muted">{stage.description}</p>
            <p className="mt-3 font-mono text-[0.625rem] tracking-[0.04em] text-ink-subtle">
              {stage.artifact}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
