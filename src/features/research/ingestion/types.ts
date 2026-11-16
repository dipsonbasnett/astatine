import type { NormalizationPlan } from "../normalization/units";
import type { MissingValuePlan } from "../normalization/missing-values";
import type { VersionRecord } from "../provenance/versioning";
import type { DeidentificationReview } from "../validation/deidentification";
import type { PrivacyGateDecision } from "../validation/privacy";

export const INGESTION_STAGE_IDS = [
  "registry-record",
  "onboarding",
  "source-verification",
  "license-attribution",
  "checksum",
  "schema-validation",
  "unit-normalization",
  "missing-values",
  "de-identification",
  "privacy-gate",
  "evidence-extraction",
  "human-review",
  "versioning",
] as const;

export type IngestionStageId = (typeof INGESTION_STAGE_IDS)[number];

export interface IngestionStageDefinition {
  id: IngestionStageId;
  label: string;
  description: string;
  artifact: string;
}

export interface IngestionStageResult {
  id: IngestionStageId;
  label: string;
  status: "complete" | "blocked";
  blockers: readonly string[];
}

export const INGESTION_STAGES: readonly IngestionStageDefinition[] = [
  {
    id: "registry-record",
    label: "Registry record",
    description:
      "The dataset exists in the validated registry with a complete provenance record.",
    artifact: "DatasetProvenance",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    description:
      "The 13-item onboarding checklist is confirmed with a reference to the completed record.",
    artifact: "OnboardingConfirmation",
  },
  {
    id: "source-verification",
    label: "Source verification",
    description:
      "Official source, license, citation, checksum, and privacy flags are all verified.",
    artifact: "DatasetSourceVerification",
  },
  {
    id: "license-attribution",
    label: "License and attribution",
    description:
      "The license has a readable terms URL and actionable attribution requirements.",
    artifact: "Dataset license fields",
  },
  {
    id: "checksum",
    label: "Checksum",
    description:
      "A SHA-256 value computed from the reviewed file matches the publisher's record.",
    artifact: "DatasetChecksum",
  },
  {
    id: "schema-validation",
    label: "Schema validation",
    description:
      "The ingestion request and every nested record satisfy their type guards.",
    artifact: "IngestionRequest",
  },
  {
    id: "unit-normalization",
    label: "Unit normalization",
    description:
      "Every measured value has a reviewed conversion, with a positive factor and a reference.",
    artifact: "NormalizationPlan",
  },
  {
    id: "missing-values",
    label: "Missing values",
    description:
      "Every measurement has a report-or-exclude rule. Missing values are never imputed.",
    artifact: "MissingValuePlan",
  },
  {
    id: "de-identification",
    label: "De-identification",
    description:
      "Human data carries a review that names the identifier classes that were checked.",
    artifact: "DeidentificationReview",
  },
  {
    id: "privacy-gate",
    label: "Privacy gate",
    description:
      "A privacy decision is recorded; human data needs approval and a lawful basis.",
    artifact: "PrivacyGateDecision",
  },
  {
    id: "evidence-extraction",
    label: "Evidence extraction",
    description:
      "Extracted insight ids resolve to validated, source-linked research insights.",
    artifact: "EvidenceExtractionRecord",
  },
  {
    id: "human-review",
    label: "Human review",
    description: "A reviewer other than the extractor approves the extracted insights.",
    artifact: "HumanReviewRecord",
  },
  {
    id: "versioning",
    label: "Versioning and re-review",
    description:
      "The insight set has a version, a change note, and a future re-review date.",
    artifact: "VersionRecord",
  },
];

export const ONBOARDING_CHECKLIST_ID = "dataset-onboarding-v1";

export interface OnboardingConfirmation {
  completed: true;
  checklistId: typeof ONBOARDING_CHECKLIST_ID;
  reference: string;
  completedAt: string;
}

export interface EvidenceExtractionRecord {
  insightIds: readonly string[];
  method: "manual" | "assisted-review";
  extractedBy: string;
  extractedAt: string;
}

export interface HumanReviewRecord {
  decision: "approved" | "rejected" | "changes-requested";
  reviewer: string;
  reviewedAt: string;
  notes: string;
  checklistReference: string;
}

export interface IngestionRequest {
  id: string;
  datasetId: string;
  onboarding: OnboardingConfirmation | null;
  normalization: NormalizationPlan | null;
  missingValues: MissingValuePlan | null;
  deidentification: DeidentificationReview | null;
  privacy: PrivacyGateDecision | null;
  extraction: EvidenceExtractionRecord | null;
  review: HumanReviewRecord | null;
  version: VersionRecord | null;
  createdAt: string;
  notes: string;
}

export const INGESTION_PIPELINE_NOTE =
  "The pipeline is declarative and offline. It evaluates records a reviewer has already prepared; it never downloads a file, calls an API, or writes a dataset.";
