import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { DatasetRegistry } from "@/features/research/DatasetRegistry";
import { EvidenceLibrary } from "@/features/research/EvidenceLibrary";
import { RESEARCH_INSIGHTS } from "@/features/research/evidence/model";
import { IngestionPipeline } from "@/features/research/IngestionPipeline";
import { ResearchContextNotice } from "@/features/research/ResearchContextNotice";
import { ResearchLandscapePanel } from "@/features/research/ResearchLandscapePanel";
import { ResearchPatterns } from "@/features/research/ResearchPatterns";
import { SourceVerificationWorkflow } from "@/features/research/SourceVerificationWorkflow";

export default function ResearchPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Research intelligence"
        title="Research"
        description="The external resource landscape, an evidence library with confidence and limitations, a provenance gate, and an offline ingestion pipeline. One de-identified public dataset record (OSD-942) is onboarded as cited research context, and no model is trained on research data."
        meta={
          <>
            <Badge tone="accent">Available</Badge>
            <Badge>Research only</Badge>
            <span className="font-mono text-label text-ink-subtle uppercase">
              OSD-942 · research only
            </span>
          </>
        }
      />

      <ResearchContextNotice />
      <ResearchLandscapePanel />
      <EvidenceLibrary insights={RESEARCH_INSIGHTS} />
      <DatasetRegistry />
      <IngestionPipeline />
      <SourceVerificationWorkflow />
      <ResearchPatterns />
    </div>
  );
}
