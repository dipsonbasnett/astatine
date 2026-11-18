import { ResearchIcon } from "@/components/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import type { DatasetProvenance } from "@/types/health";
import { DatasetOnboardingChecklist } from "./DatasetOnboardingChecklist";
import { DatasetProvenanceCard } from "./DatasetProvenanceCard";
import { RESEARCH_DATASETS } from "./dataset-integrity";

export interface DatasetRegistryProps {
  datasets?: readonly DatasetProvenance[];
}

export function DatasetRegistry({ datasets = RESEARCH_DATASETS }: DatasetRegistryProps) {
  return (
    <section aria-labelledby="dataset-registry-heading" className="space-y-5">
      <div>
        <p className="font-mono text-label text-ink-subtle uppercase">Research class</p>
        <h2
          id="dataset-registry-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-ink"
        >
          Dataset registry
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          Each record must satisfy the provenance contract and verification gate before it
          can appear here.
        </p>
      </div>

      {datasets.length === 0 ? (
        <EmptyState
          icon={<ResearchIcon className="size-5" />}
          title="No datasets onboarded"
          description="The registry is intentionally empty. A dataset appears here only after its official source, license, citation, file checksum, intended use, limitations, privacy status, attribution requirements, and verification record are complete."
        />
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {datasets.map((dataset) => (
            <li key={dataset.id}>
              <DatasetProvenanceCard dataset={dataset} />
            </li>
          ))}
        </ul>
      )}

      <DatasetOnboardingChecklist />
    </section>
  );
}
