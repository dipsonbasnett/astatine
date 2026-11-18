import type {
  ConfidenceLevel,
  DatasetIdentifier,
  DatasetPrivacyStatus,
} from "@/types/health";

import type { ResearchDomainId } from "../provenance/landscape";

export type EvidenceSourceType =
  "dataset" | "publication" | "program" | "repository" | "guidance";

export type EvidenceReviewStatus = "approved" | "under-review" | "retired";

export type EvidenceDirection = "supports" | "mixed" | "unclear" | "describes";

export type EvidenceRedistribution = "link-only" | "quotation" | "bundle-allowed";

export type SelectedUserApplicability = "not-personal" | "unknown";

export interface EvidenceSource {
  id: string;
  category: "research";
  origin: "external";
  publisher: string;
  title: string;
  url: string;
  accessedAt: string;
  sourceType: EvidenceSourceType;
}

export interface EvidenceCitation {
  text: string;
  identifier: DatasetIdentifier;
}

export interface PopulationScope {
  description: string;
  species: "human" | "non-human" | "mixed" | "not-applicable";
  setting: "spaceflight" | "analog" | "ground" | "mixed" | "not-applicable";
  sampleSize: number | null;
  sampleSizeNote: string;
  inclusionNotes: string;
}

export interface StudyMetadata {
  id: string;
  title: string;
  design: "experiment" | "observational" | "review" | "program-overview" | "protocol";
  conductedBy: string;
  publicationYear: number | null;
  population: PopulationScope;
  citation: EvidenceCitation;
  limitations: readonly string[];
}

export interface MeasurementDefinition {
  id: string;
  label: string;
  domain: ResearchDomainId;
  unit: string | null;
  collectionMethod: string;
  directionMeaning: string;
  normalization: string;
  missingValuePolicy: string;
}

export interface EvidenceObservation {
  id: string;
  measurementId: string | null;
  statement: string;
  valueType: "qualitative" | "quantitative" | "mixed";
  effectSummary: string | null;
  unit: string | null;
  uncertainty: string;
}

export interface ApplicabilityScope {
  appliesToSelectedUser: SelectedUserApplicability;
  population: string;
  setting: string;
  statement: string;
}

export interface EvidenceStatement {
  id: string;
  claim: string;
  direction: EvidenceDirection;
  observations: readonly EvidenceObservation[];
  confidence: ConfidenceLevel;
  confidenceBasis: string;
  limitations: readonly string[];
  applicability: ApplicabilityScope;
}

export interface EvidenceLicense {
  name: string;
  url: string | null;
  redistribution: EvidenceRedistribution;
  attribution: string;
  note: string;
}

export interface EvidencePrivacy {
  status: DatasetPrivacyStatus | "not-applicable";
  containsHumanData: boolean;
  deidentified: boolean | null;
  lawfulBasis: string | null;
  note: string;
}

export interface EvidenceProvenance {
  datasetId: string | null;
  sourceVerifiedAt: string;
  verifiedBy: string;
  checksumVerified: boolean;
  reviewer: string;
  reviewedAt: string;
  version: string;
  supersedes: string | null;
  reReviewDueAt: string | null;
}

export interface ResearchInsight {
  id: string;
  title: string;
  domain: ResearchDomainId;
  dataClass: "research";
  summary: string;
  sources: readonly EvidenceSource[];
  study: StudyMetadata;
  measurements: readonly MeasurementDefinition[];
  statements: readonly EvidenceStatement[];
  confidence: ConfidenceLevel;
  confidenceBasis: string;
  limitations: readonly string[];
  applicability: ApplicabilityScope;
  license: EvidenceLicense;
  privacy: EvidencePrivacy;
  provenance: EvidenceProvenance;
  modelTraining: "not-used";
  reviewStatus: EvidenceReviewStatus;
  lastReviewedAt: string;
  nextReviewDueAt: string | null;
}
