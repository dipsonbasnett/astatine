import {
  isDatasetProvenance,
  isHttpsUrl,
  isIsoTimestamp,
  isNonEmptyString,
  isPlainObject,
} from "@/lib/validation";
import type { DatasetProvenance } from "@/types/health";

import type { ResearchInsight } from "../evidence/types";
import { isResearchInsight } from "../validation/evidence";
import { isMissingValuePlan } from "../normalization/missing-values";
import { isNormalizationPlan } from "../normalization/units";
import { isVersionRecord } from "../provenance/versioning";
import {
  isDeidentificationReview,
  uncheckedDeidentificationElements,
} from "../validation/deidentification";
import { isPrivacyGateDecision, privacyGateBlockers } from "../validation/privacy";
import { isSha256Hex } from "./checksum";
import {
  INGESTION_STAGES,
  ONBOARDING_CHECKLIST_ID,
  type EvidenceExtractionRecord,
  type HumanReviewRecord,
  type IngestionRequest,
  type IngestionStageId,
  type IngestionStageResult,
  type OnboardingConfirmation,
} from "./types";

const STAGE_LABELS = Object.fromEntries(
  INGESTION_STAGES.map((stage) => [stage.id, stage.label]),
) as Record<IngestionStageId, string>;

function isOnboardingConfirmation(value: unknown): value is OnboardingConfirmation {
  return (
    isPlainObject(value) &&
    value.completed === true &&
    value.checklistId === ONBOARDING_CHECKLIST_ID &&
    isNonEmptyString(value.reference, 500) &&
    isIsoTimestamp(value.completedAt)
  );
}

function isExtractionRecord(value: unknown): value is EvidenceExtractionRecord {
  return (
    isPlainObject(value) &&
    Array.isArray(value.insightIds) &&
    value.insightIds.length > 0 &&
    value.insightIds.every((id) => isNonEmptyString(id, 128)) &&
    (value.method === "manual" || value.method === "assisted-review") &&
    isNonEmptyString(value.extractedBy, 160) &&
    isIsoTimestamp(value.extractedAt)
  );
}

function isHumanReviewRecord(value: unknown): value is HumanReviewRecord {
  return (
    isPlainObject(value) &&
    (value.decision === "approved" ||
      value.decision === "rejected" ||
      value.decision === "changes-requested") &&
    isNonEmptyString(value.reviewer, 160) &&
    isIsoTimestamp(value.reviewedAt) &&
    isNonEmptyString(value.notes, 1000) &&
    isNonEmptyString(value.checklistReference, 500)
  );
}

export function isIngestionRequest(value: unknown): value is IngestionRequest {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.id, 128) &&
    isNonEmptyString(value.datasetId, 128) &&
    (value.onboarding === null || isOnboardingConfirmation(value.onboarding)) &&
    (value.normalization === null || isNormalizationPlan(value.normalization)) &&
    (value.missingValues === null || isMissingValuePlan(value.missingValues)) &&
    (value.deidentification === null ||
      isDeidentificationReview(value.deidentification)) &&
    (value.privacy === null || isPrivacyGateDecision(value.privacy)) &&
    (value.extraction === null || isExtractionRecord(value.extraction)) &&
    (value.review === null || isHumanReviewRecord(value.review)) &&
    (value.version === null || isVersionRecord(value.version)) &&
    isIsoTimestamp(value.createdAt) &&
    typeof value.notes === "string" &&
    value.notes.length <= 1000
  );
}

export interface IngestionEvaluationOptions {
  request: IngestionRequest;
  dataset: DatasetProvenance | undefined;
  insights: readonly ResearchInsight[];
  now: string;
}

export interface IngestionEvaluation {
  datasetId: string;
  ready: boolean;
  stages: readonly IngestionStageResult[];
  blockers: readonly string[];
}

export function evaluateIngestion({
  request,
  dataset,
  insights,
  now,
}: IngestionEvaluationOptions): IngestionEvaluation {
  const stages: IngestionStageResult[] = [];

  const run = (id: IngestionStageId, evaluate: () => string[]) => {
    const blockers = evaluate();
    stages.push({
      id,
      label: STAGE_LABELS[id],
      status: blockers.length === 0 ? "complete" : "blocked",
      blockers,
    });
  };

  const datasetBlocker = (): string[] =>
    dataset ? [] : ["The registry has no record for this dataset id."];

  const extractedInsights = request.extraction
    ? insights.filter((insight) => request.extraction?.insightIds.includes(insight.id))
    : [];

  run("registry-record", () => {
    if (!dataset) return datasetBlocker();
    const blockers: string[] = [];
    if (!isDatasetProvenance(dataset)) {
      blockers.push("The dataset provenance record is incomplete or unverified.");
    }
    if (dataset.id !== request.datasetId) {
      blockers.push("The request dataset id does not match the registry record.");
    }
    if (dataset.privacyStatus === "restricted-not-approved") {
      blockers.push("The dataset is restricted and not approved for onboarding.");
    }
    return blockers;
  });

  run("onboarding", () => {
    if (!request.onboarding) {
      return ["No onboarding confirmation is attached to the request."];
    }
    if (!isOnboardingConfirmation(request.onboarding)) {
      return ["The onboarding confirmation is incomplete or uses the wrong checklist."];
    }
    if (Date.parse(request.onboarding.completedAt) > Date.parse(now)) {
      return ["The onboarding confirmation is dated in the future."];
    }
    return [];
  });

  run("source-verification", () => {
    if (!dataset) return datasetBlocker();
    const verification = dataset.sourceVerification;
    const blockers = [
      verification.officialSource ? "" : "The official source is not verified.",
      verification.licenseTerms ? "" : "The license or terms are not verified.",
      verification.citation ? "" : "The citation is not verified.",
      verification.checksum ? "" : "The checksum is not verified.",
      verification.privacy ? "" : "The privacy check is not verified.",
    ].filter(Boolean);
    if (Date.parse(verification.verifiedAt) > Date.parse(now)) {
      blockers.push("The verification date is in the future.");
    }
    return blockers;
  });

  run("license-attribution", () => {
    if (!dataset) return datasetBlocker();
    const blockers: string[] = [];
    if (!isHttpsUrl(dataset.licenseUrl)) {
      blockers.push("The license has no readable HTTPS terms URL.");
    }
    if (/not specified|not verified/i.test(dataset.licenseName)) {
      blockers.push("The license is not specified, so the dataset cannot be ingested.");
    }
    if (dataset.attributionRequirements.length === 0) {
      blockers.push("No attribution requirement is recorded.");
    }
    return blockers;
  });

  run("checksum", () => {
    if (!dataset) return datasetBlocker();
    const blockers: string[] = [];
    if (!isSha256Hex(dataset.fileChecksum.value)) {
      blockers.push("The recorded checksum is not a valid SHA-256 value.");
    }
    if (!dataset.sourceVerification.checksum) {
      blockers.push("The checksum is not marked as verified.");
    }
    return blockers;
  });

  run("schema-validation", () => {
    const blockers: string[] = [];
    if (!isIngestionRequest(request)) {
      blockers.push("The ingestion request does not satisfy its schema.");
    }
    if (dataset && !isDatasetProvenance(dataset)) {
      blockers.push("The dataset record does not satisfy its schema.");
    }
    return blockers;
  });

  run("unit-normalization", () => {
    if (!request.normalization) {
      return ["No unit-normalization plan is attached to the request."];
    }
    if (!isNormalizationPlan(request.normalization)) {
      return ["The unit-normalization plan is incomplete."];
    }
    if (extractedInsights.length === 0) {
      return ["No extracted insight is available to check normalization coverage."];
    }

    const blockers: string[] = [];
    for (const insight of extractedInsights) {
      for (const measurement of insight.measurements) {
        if (measurement.unit === null) continue;
        const covered = request.normalization.mappings.some(
          (mapping) => mapping.measurementId === measurement.id,
        );
        if (!covered) {
          blockers.push(
            `Measurement "${measurement.id}" has a unit but no reviewed conversion.`,
          );
        }
      }
    }
    return blockers;
  });

  run("missing-values", () => {
    if (!request.missingValues) {
      return ["No missing-value plan is attached to the request."];
    }
    if (!isMissingValuePlan(request.missingValues)) {
      return ["The missing-value plan is incomplete."];
    }
    if (extractedInsights.length === 0) {
      return ["No extracted insight is available to check missing-value coverage."];
    }

    const blockers: string[] = [];
    for (const insight of extractedInsights) {
      for (const measurement of insight.measurements) {
        const covered = request.missingValues.rules.some(
          (rule) => rule.measurementId === measurement.id,
        );
        if (!covered) {
          blockers.push(`Measurement "${measurement.id}" has no missing-value rule.`);
        }
      }
    }
    return blockers;
  });

  run("de-identification", () => {
    if (!dataset) return datasetBlocker();
    if (!dataset.containsHumanData) return [];
    if (!request.deidentification) {
      return ["Human data requires a de-identification review."];
    }
    if (!isDeidentificationReview(request.deidentification)) {
      return ["The de-identification review is incomplete or reports identifiers."];
    }
    const unchecked = uncheckedDeidentificationElements(request.deidentification);
    return unchecked.length === 0
      ? []
      : ["The de-identification review does not cover every identifier class."];
  });

  run("privacy-gate", () => {
    if (!dataset) return datasetBlocker();
    if (!request.privacy) {
      return ["No privacy decision is recorded for this request."];
    }
    if (!isPrivacyGateDecision(request.privacy)) {
      return ["The privacy decision is incomplete."];
    }
    return privacyGateBlockers(dataset.containsHumanData, request.privacy);
  });

  run("evidence-extraction", () => {
    if (!request.extraction) {
      return ["No evidence-extraction record is attached to the request."];
    }
    if (!isExtractionRecord(request.extraction)) {
      return ["The evidence-extraction record is incomplete."];
    }

    const blockers: string[] = [];
    if (
      new Set(request.extraction.insightIds).size !== request.extraction.insightIds.length
    ) {
      blockers.push("Extraction insight ids must be unique.");
    }
    for (const id of request.extraction.insightIds) {
      const insight = insights.find((candidate) => candidate.id === id);
      if (!insight) {
        blockers.push(
          `Insight "${id}" is not present in the validated insight registry.`,
        );
        continue;
      }
      if (!isResearchInsight(insight)) {
        blockers.push(`Insight "${id}" does not satisfy the research evidence schema.`);
      }
      if (insight.sources.length === 0) {
        blockers.push(`Insight "${id}" has no verified source.`);
      }
      if (
        insight.provenance.datasetId !== null &&
        insight.provenance.datasetId !== request.datasetId
      ) {
        blockers.push(`Insight "${id}" references a different dataset.`);
      }
    }
    return blockers;
  });

  run("human-review", () => {
    if (!request.review) {
      return ["No human-review record is attached to the request."];
    }
    if (!isHumanReviewRecord(request.review)) {
      return ["The human-review record is incomplete."];
    }
    if (request.review.decision !== "approved") {
      return ["The reviewer has not approved the extracted insights."];
    }
    if (!request.extraction) {
      return ["Human review needs an extraction record to review."];
    }
    if (request.review.reviewer === request.extraction.extractedBy) {
      return ["The reviewer must be different from the extractor."];
    }
    if (
      Date.parse(request.review.reviewedAt) < Date.parse(request.extraction.extractedAt)
    ) {
      return ["The review date precedes the extraction date."];
    }
    return [];
  });

  run("versioning", () => {
    if (!request.version) {
      return ["No version record is attached to the request."];
    }
    if (!isVersionRecord(request.version)) {
      return ["The version record is incomplete."];
    }
    if (request.version.supersedes === request.version.version) {
      return ["A version cannot supersede itself."];
    }
    if (Date.parse(request.version.reReviewDueAt) <= Date.parse(now)) {
      return ["The re-review date has already passed."];
    }
    return [];
  });

  const blockers = stages.flatMap((stage) => stage.blockers);

  return {
    datasetId: request.datasetId,
    ready: blockers.length === 0,
    stages,
    blockers,
  };
}
