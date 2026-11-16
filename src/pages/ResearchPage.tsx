import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { DatasetRegistry } from "@/features/research/DatasetRegistry";
import { ResearchContextNotice } from "@/features/research/ResearchContextNotice";
import { ResearchPatterns } from "@/features/research/ResearchPatterns";
import { SourceVerificationWorkflow } from "@/features/research/SourceVerificationWorkflow";

export default function ResearchPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Open context"
        title="Research"
        description="External, attributed research context with a provenance gate. This surface shows how evidence enters the product; it does not yet hold a dataset."
        meta={
          <>
            <Badge tone="accent">Available</Badge>
            <span className="font-mono text-label text-ink-subtle uppercase">
              Data class / Research
            </span>
          </>
        }
      />

      <ResearchContextNotice />
      <DatasetRegistry />
      <SourceVerificationWorkflow />
      <ResearchPatterns />
    </div>
  );
}
