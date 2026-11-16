import {
  isDatasetIdentifier,
  isHttpsUrl,
  isIsoTimestamp,
  isNonEmptyString,
  isPlainObject,
} from "@/lib/validation";
import type {
  ConfidenceLevel,
  DatasetPrivacyStatus,
  ValidationIssue,
  ValidationResult,
} from "@/types/health";

import type {
  ApplicabilityScope,
  EvidenceCitation,
  EvidenceLicense,
  EvidenceObservation,
  EvidencePrivacy,
  EvidenceProvenance,
  EvidenceReviewStatus,
  EvidenceSource,
  EvidenceStatement,
  MeasurementDefinition,
  PopulationScope,
  ResearchInsight,
  SelectedUserApplicability,
  StudyMetadata,
} from "../evidence/types";
import { RESEARCH_DOMAIN_IDS } from "../provenance/landscape";
import type { ResearchDomainId } from "../provenance/landscape";

const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = ["low", "moderate", "high"];

const REVIEW_STATUSES: readonly EvidenceReviewStatus[] = [
  "approved",
  "under-review",
  "retired",
];

const APPLICABILITY_VALUES: readonly SelectedUserApplicability[] = [
  "not-personal",
  "unknown",
];

const PRIVACY_STATUSES: readonly (DatasetPrivacyStatus | "not-applicable")[] = [
  "open-public",
  "de-identified-public",
  "credentialed-access",
  "restricted-not-approved",
  "not-applicable",
];

function isText(maxLength = 500): (value: unknown) => boolean {
  return (value: unknown) => isNonEmptyString(value, maxLength);
}

function isTextList(minLength = 1, maxLength = 500): (value: unknown) => boolean {
  return (value: unknown) =>
    Array.isArray(value) &&
    value.length >= minLength &&
    value.every((item) => isNonEmptyString(item, maxLength));
}

function isNullableIsoTimestamp(value: unknown): boolean {
  return value === null || isIsoTimestamp(value);
}

export function isEvidenceSource(value: unknown): value is EvidenceSource {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.id, 128) &&
    value.category === "research" &&
    value.origin === "external" &&
    isNonEmptyString(value.publisher, 160) &&
    isNonEmptyString(value.title, 200) &&
    isHttpsUrl(value.url) &&
    isIsoTimestamp(value.accessedAt) &&
    (value.sourceType === "dataset" ||
      value.sourceType === "publication" ||
      value.sourceType === "program" ||
      value.sourceType === "repository" ||
      value.sourceType === "guidance")
  );
}

export function isEvidenceCitation(value: unknown): value is EvidenceCitation {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.text, 800) &&
    isDatasetIdentifier(value.identifier)
  );
}

export function isPopulationScope(value: unknown): value is PopulationScope {
  return (
    isPlainObject(value) &&
    isText(600)(value.description) &&
    (value.species === "human" ||
      value.species === "non-human" ||
      value.species === "mixed" ||
      value.species === "not-applicable") &&
    (value.setting === "spaceflight" ||
      value.setting === "analog" ||
      value.setting === "ground" ||
      value.setting === "mixed" ||
      value.setting === "not-applicable") &&
    (value.sampleSize === null ||
      (typeof value.sampleSize === "number" &&
        Number.isInteger(value.sampleSize) &&
        value.sampleSize >= 0)) &&
    isText(400)(value.sampleSizeNote) &&
    isText(800)(value.inclusionNotes)
  );
}

export function isStudyMetadata(value: unknown): value is StudyMetadata {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.id, 128) &&
    isNonEmptyString(value.title, 200) &&
    (value.design === "experiment" ||
      value.design === "observational" ||
      value.design === "review" ||
      value.design === "program-overview" ||
      value.design === "protocol") &&
    isNonEmptyString(value.conductedBy, 200) &&
    (value.publicationYear === null ||
      (typeof value.publicationYear === "number" &&
        Number.isInteger(value.publicationYear) &&
        value.publicationYear >= 1900 &&
        value.publicationYear <= 2100)) &&
    isPopulationScope(value.population) &&
    isEvidenceCitation(value.citation) &&
    isTextList(1, 800)(value.limitations)
  );
}

export function isMeasurementDefinition(value: unknown): value is MeasurementDefinition {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.id, 128) &&
    isNonEmptyString(value.label, 160) &&
    RESEARCH_DOMAIN_IDS.includes(value.domain as ResearchDomainId) &&
    (value.unit === null || isNonEmptyString(value.unit, 40)) &&
    isText(500)(value.collectionMethod) &&
    isText(500)(value.directionMeaning) &&
    isText(500)(value.normalization) &&
    isText(500)(value.missingValuePolicy)
  );
}

export function isEvidenceObservation(value: unknown): value is EvidenceObservation {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.id, 128) &&
    (value.measurementId === null || isNonEmptyString(value.measurementId, 128)) &&
    isText(800)(value.statement) &&
    (value.valueType === "qualitative" ||
      value.valueType === "quantitative" ||
      value.valueType === "mixed") &&
    (value.effectSummary === null || isText(500)(value.effectSummary)) &&
    (value.unit === null || isNonEmptyString(value.unit, 40)) &&
    isText(500)(value.uncertainty)
  );
}

export function isApplicabilityScope(value: unknown): value is ApplicabilityScope {
  return (
    isPlainObject(value) &&
    APPLICABILITY_VALUES.includes(value.appliesToSelectedUser as never) &&
    isText(500)(value.population) &&
    isText(500)(value.setting) &&
    isText(800)(value.statement)
  );
}

export function isEvidenceStatement(value: unknown): value is EvidenceStatement {
  if (!isPlainObject(value)) return false;
  if (!isNonEmptyString(value.id, 128)) return false;
  if (!isText(800)(value.claim)) return false;
  if (
    value.direction !== "supports" &&
    value.direction !== "mixed" &&
    value.direction !== "unclear" &&
    value.direction !== "describes"
  ) {
    return false;
  }
  if (
    !Array.isArray(value.observations) ||
    value.observations.length === 0 ||
    !value.observations.every((observation) => isEvidenceObservation(observation))
  ) {
    return false;
  }
  if (!CONFIDENCE_LEVELS.includes(value.confidence as ConfidenceLevel)) return false;
  if (!isText(800)(value.confidenceBasis)) return false;
  if (!isTextList(1, 800)(value.limitations)) return false;

  return isApplicabilityScope(value.applicability);
}

export function isEvidenceLicense(value: unknown): value is EvidenceLicense {
  if (!isPlainObject(value)) return false;
  if (!isNonEmptyString(value.name, 300)) return false;
  if (value.url !== null && !isHttpsUrl(value.url)) return false;
  if (
    value.redistribution !== "link-only" &&
    value.redistribution !== "quotation" &&
    value.redistribution !== "bundle-allowed"
  ) {
    return false;
  }
  if (!isText(800)(value.attribution)) return false;
  if (!isText(800)(value.note)) return false;

  return value.redistribution !== "bundle-allowed" || isHttpsUrl(value.url);
}

export function isEvidencePrivacy(value: unknown): value is EvidencePrivacy {
  if (!isPlainObject(value)) return false;
  if (!PRIVACY_STATUSES.includes(value.status as never)) return false;
  if (typeof value.containsHumanData !== "boolean") return false;
  if (value.deidentified !== null && typeof value.deidentified !== "boolean") {
    return false;
  }
  if (value.lawfulBasis !== null && !isNonEmptyString(value.lawfulBasis, 500)) {
    return false;
  }
  if (!isText(800)(value.note)) return false;

  if (value.containsHumanData) {
    if (value.status === "open-public" || value.status === "not-applicable") {
      return false;
    }
    if (!isNonEmptyString(value.lawfulBasis, 500)) return false;
  }

  return true;
}

export function isEvidenceProvenance(value: unknown): value is EvidenceProvenance {
  return (
    isPlainObject(value) &&
    (value.datasetId === null || isNonEmptyString(value.datasetId, 128)) &&
    isIsoTimestamp(value.sourceVerifiedAt) &&
    isNonEmptyString(value.verifiedBy, 160) &&
    typeof value.checksumVerified === "boolean" &&
    isNonEmptyString(value.reviewer, 160) &&
    isIsoTimestamp(value.reviewedAt) &&
    isNonEmptyString(value.version, 80) &&
    (value.supersedes === null || isNonEmptyString(value.supersedes, 128)) &&
    isNullableIsoTimestamp(value.reReviewDueAt)
  );
}

export function isResearchInsight(value: unknown): value is ResearchInsight {
  if (!isPlainObject(value)) return false;
  if (!isNonEmptyString(value.id, 128)) return false;
  if (!isNonEmptyString(value.title, 200)) return false;
  if (!RESEARCH_DOMAIN_IDS.includes(value.domain as ResearchDomainId)) return false;
  if (value.dataClass !== "research") return false;
  if (!isText(1200)(value.summary)) return false;
  if (
    !Array.isArray(value.sources) ||
    value.sources.length === 0 ||
    !value.sources.every((source) => isEvidenceSource(source))
  ) {
    return false;
  }
  if (!isStudyMetadata(value.study)) return false;
  if (
    !Array.isArray(value.measurements) ||
    !value.measurements.every((measurement) => isMeasurementDefinition(measurement))
  ) {
    return false;
  }
  if (
    !Array.isArray(value.statements) ||
    value.statements.length === 0 ||
    !value.statements.every((statement) => isEvidenceStatement(statement))
  ) {
    return false;
  }
  if (!CONFIDENCE_LEVELS.includes(value.confidence as ConfidenceLevel)) return false;
  if (!isText(800)(value.confidenceBasis)) return false;
  if (!isTextList(1, 800)(value.limitations)) return false;
  if (!isApplicabilityScope(value.applicability)) return false;
  if (!isEvidenceLicense(value.license)) return false;
  if (!isEvidencePrivacy(value.privacy)) return false;
  if (!isEvidenceProvenance(value.provenance)) return false;
  if (value.modelTraining !== "not-used") return false;
  if (!REVIEW_STATUSES.includes(value.reviewStatus as EvidenceReviewStatus)) {
    return false;
  }
  if (!isIsoTimestamp(value.lastReviewedAt)) return false;
  if (!isNullableIsoTimestamp(value.nextReviewDueAt)) return false;

  const sourceIds = new Set<string>();
  for (const source of value.sources) {
    if (sourceIds.has(source.id)) return false;
    sourceIds.add(source.id);
  }

  const measurementIds = new Set<string>();
  for (const measurement of value.measurements) {
    if (measurementIds.has(measurement.id)) return false;
    measurementIds.add(measurement.id);
  }

  const statementIds = new Set<string>();
  for (const statement of value.statements) {
    if (statementIds.has(statement.id)) return false;
    statementIds.add(statement.id);

    for (const observation of statement.observations) {
      if (
        observation.measurementId !== null &&
        !measurementIds.has(observation.measurementId)
      ) {
        return false;
      }
    }
  }

  return true;
}

export function validateResearchInsights(
  input: unknown,
  knownDatasetIds: readonly string[] = [],
): ValidationResult<readonly ResearchInsight[]> {
  if (!Array.isArray(input)) {
    return {
      ok: false,
      issues: [{ field: "insights", message: "An insight list is required." }],
    };
  }

  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  input.forEach((insight: unknown, index: number) => {
    if (!isResearchInsight(insight)) {
      issues.push({
        field: `insights.${index}`,
        message:
          "Insight is incomplete, not marked as research-only, or not approved for display.",
      });
      return;
    }

    if (ids.has(insight.id)) {
      issues.push({
        field: `insights.${index}.id`,
        message: "Insight ids must be unique.",
      });
    }
    if (
      insight.provenance.datasetId !== null &&
      !knownDatasetIds.includes(insight.provenance.datasetId)
    ) {
      issues.push({
        field: `insights.${index}.provenance.datasetId`,
        message:
          "Insight references a dataset that is not present in the onboarded dataset registry.",
      });
    }

    ids.add(insight.id);
  });

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: input as readonly ResearchInsight[] };
}
