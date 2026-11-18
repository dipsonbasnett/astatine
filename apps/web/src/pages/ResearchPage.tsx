import { PageHeader } from "@/components/layout/PageHeader";
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
      <PageHeader eyebrow="Research intelligence" title="Research" />

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
