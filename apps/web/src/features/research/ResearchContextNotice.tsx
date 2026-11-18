import { useId } from "react";

import { SourceBadge } from "@/components/ui/SourceBadge";
import { DATASET_SEPARATION_NOTE } from "./dataset-integrity";

export interface ResearchContextNoticeProps {
  note?: string;
}

export function ResearchContextNotice({
  note = DATASET_SEPARATION_NOTE,
}: ResearchContextNoticeProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-panel border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id={headingId} className="text-lg font-semibold tracking-tight text-ink">
          Research context, not personal data
        </h2>
        <SourceBadge category="research">Research</SourceBadge>
      </div>
      <p className="mt-3 max-w-prose text-sm leading-6 text-ink-muted">{note}</p>
      <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
        Dataset use is limited to the documented purpose. No dataset is described as
        training a model unless the provenance record contains explicit evidence and model
        identifiers.
      </p>
    </section>
  );
}
