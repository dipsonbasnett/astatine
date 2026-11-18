import type { ConfidenceLevel, DatasetPrivacyStatus } from "@/types/health";

import { OSD_942_INSIGHT } from "../datasets/osd-942/insight";
import type { ResearchDomainId } from "../provenance/landscape";
import type { EvidenceReviewStatus, ResearchInsight } from "./types";

export const RESEARCH_INSIGHT_NOTE =
  "Research context, not personal data. These findings do not describe the selected crew member or astronaut and are not personalized medical advice.";

export const RESEARCH_NO_ENDORSEMENT_NOTE =
  "Astatine is not affiliated with, endorsed by, or clinically validated by NASA or any cited publisher. A citation does not transfer the publisher's authority to Astatine.";

export const RESEARCH_MODEL_TRAINING_NOTE =
  "No model was trained on this research. Model training requires a separate, approved workflow with documented evaluation.";

export const EVIDENCE_FACETS = [
  {
    id: "source",
    label: "Source",
    description: "Who published the material, where it lives, and when it was accessed.",
  },
  {
    id: "dataset",
    label: "Dataset",
    description: "The exact release, version, identifier, and checksum record.",
  },
  {
    id: "study",
    label: "Study",
    description: "Design, setting, and what was actually done.",
  },
  {
    id: "population",
    label: "Population",
    description: "Who was studied, in what setting, and who was not included.",
  },
  {
    id: "measurement",
    label: "Assay and measurement",
    description: "What was measured, in what unit, and what a higher value means.",
  },
  {
    id: "observation",
    label: "Observation",
    description: "The reported result, its effect summary, and its uncertainty.",
  },
  {
    id: "statement",
    label: "Evidence statement",
    description: "The single bounded claim Astatine is willing to make.",
  },
  {
    id: "confidence",
    label: "Confidence",
    description: "A reviewer-assigned level with the basis for that level.",
  },
  {
    id: "limitations",
    label: "Limitations",
    description: "What the evidence cannot support and where it stops.",
  },
  {
    id: "applicability",
    label: "Applicability",
    description:
      "Whether it applies to the product at all, and whether it describes the selected user.",
  },
  {
    id: "citation",
    label: "Citation",
    description: "The publisher's citation and persistent identifier.",
  },
  {
    id: "license",
    label: "License",
    description:
      "What may be linked, quoted, or bundled, and what attribution is required.",
  },
  {
    id: "privacy",
    label: "Privacy status",
    description: "Whether human data is involved and on what lawful basis.",
  },
  {
    id: "provenance",
    label: "Provenance",
    description: "Verification, reviewer, version, and the next re-review date.",
  },
] as const;

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  low: "Low confidence",
  moderate: "Moderate confidence",
  high: "High confidence",
};

export const CONFIDENCE_DESCRIPTIONS: Record<ConfidenceLevel, string> = {
  low: "A single small or indirect source, or a claim the reviewers could only partly support.",
  moderate:
    "A direct source with clear methodology but limited population, setting, or replication.",
  high: "Multiple direct, verifiable sources that agree, with documented limitations still shown.",
};

export const APPLICABILITY_LABELS = {
  "not-personal": "Does not describe the selected user",
  unknown: "Applicability to the selected user is unknown",
} as const;

export const REVIEW_STATUS_LABELS: Record<EvidenceReviewStatus, string> = {
  approved: "Approved",
  "under-review": "Under review",
  retired: "Retired",
};

export const PRIVACY_FACET_LABELS: Record<
  DatasetPrivacyStatus | "not-applicable",
  string
> = {
  "open-public": "Open public",
  "de-identified-public": "De-identified public",
  "credentialed-access": "Credentialed access",
  "restricted-not-approved": "Restricted, not approved",
  "not-applicable": "No human participant data",
};

// One reviewed insight is linked to the onboarded OSD-942 dataset.
export const RESEARCH_INSIGHTS: readonly ResearchInsight[] = [OSD_942_INSIGHT];

export function approvedResearchInsights(
  insights: readonly ResearchInsight[] = RESEARCH_INSIGHTS,
): ResearchInsight[] {
  return insights.filter((insight) => insight.reviewStatus === "approved");
}

export function insightsForDomain(
  domain: ResearchDomainId,
  insights: readonly ResearchInsight[] = RESEARCH_INSIGHTS,
): ResearchInsight[] {
  return approvedResearchInsights(insights).filter(
    (insight) => insight.domain === domain,
  );
}

export function insightCitationLine(insight: ResearchInsight): string {
  return insight.sources
    .map(
      (source) =>
        `${source.publisher} — ${source.title}. Accessed ${source.accessedAt.slice(0, 10)}.`,
    )
    .join(" ");
}

export function insightReviewLine(insight: ResearchInsight): string {
  const nextReview =
    insight.nextReviewDueAt === null
      ? "No next review scheduled."
      : `Next review ${insight.nextReviewDueAt.slice(0, 10)}.`;
  return `Version ${insight.provenance.version}. Reviewed ${insight.provenance.reviewedAt.slice(
    0,
    10,
  )} by ${insight.provenance.reviewer}. ${nextReview}`;
}
