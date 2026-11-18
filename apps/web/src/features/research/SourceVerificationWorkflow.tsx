import { SOURCE_VERIFICATION_STEPS } from "./dataset-integrity";

export interface SourceVerificationStep {
  id: string;
  label: string;
  description: string;
}

export interface SourceVerificationWorkflowProps {
  steps?: readonly SourceVerificationStep[];
}

export function SourceVerificationWorkflow({
  steps = SOURCE_VERIFICATION_STEPS,
}: SourceVerificationWorkflowProps) {
  return (
    <section aria-labelledby="source-verification-heading" className="space-y-5">
      <div>
        <p className="font-mono text-label text-ink-subtle uppercase">Workflow</p>
        <h2
          id="source-verification-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-ink"
        >
          Source verification
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          Each check is recorded on the dataset as explicitly true, with a verification
          date and a named reviewer. The registry rejects a record when any check is
          missing or unconfirmed.
        </p>
      </div>

      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.id} className="rounded-panel border border-line bg-surface p-5">
            <p className="font-mono text-label text-accent uppercase">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-sm font-semibold text-ink">{step.label}</h3>
            <p className="mt-2 text-xs leading-5 text-ink-muted">{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
