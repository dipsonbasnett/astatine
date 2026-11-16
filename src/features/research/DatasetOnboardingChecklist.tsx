import { DATASET_ONBOARDING_CHECKLIST } from "./dataset-integrity";

export interface DatasetOnboardingChecklistProps {
  items?: readonly string[];
}

export function DatasetOnboardingChecklist({
  items = DATASET_ONBOARDING_CHECKLIST,
}: DatasetOnboardingChecklistProps) {
  return (
    <section aria-labelledby="dataset-onboarding-heading" className="space-y-3">
      <div>
        <p className="font-mono text-label text-ink-subtle uppercase">Admission gate</p>
        <h2
          id="dataset-onboarding-heading"
          className="mt-2 text-xl font-semibold tracking-tight text-ink"
        >
          Dataset onboarding checklist
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          A dataset is not displayed until every item is recorded and verified. The
          registry validates the structured provenance record again at runtime.
        </p>
      </div>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm leading-6">
            <span aria-hidden="true" className="font-mono text-xs text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="text-ink-muted">{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
