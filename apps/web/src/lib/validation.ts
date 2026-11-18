import type {
  CheckInDraft,
  CheckInRecord,
  CheckInScaleField,
  DatasetChecksum,
  DatasetIdentifier,
  DatasetModelTraining,
  DatasetPrivacyReview,
  DatasetPrivacyStatus,
  DatasetProvenance,
  DatasetSourceVerification,
  RecordedSource,
  ResearchEntry,
  ResearchSource,
  ScaleValue,
  SimulatedSource,
  SourceMetadata,
  TelemetryChannel,
  TelemetrySampleRecord,
} from "@/types/health";

export const CHECK_IN_SCALE_FIELDS: readonly CheckInScaleField[] = [
  "sleepQuality",
  "fatigue",
  "mood",
  "soreness",
  "stress",
  "hydration",
];

const TELEMETRY_CHANNELS: readonly TelemetryChannel[] = [
  "heartRate",
  "respiratoryRate",
  "skinTemperature",
];

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown, maxLength = 500): value is string {
  return (
    typeof value === "string" && value.trim().length > 0 && value.length <= maxLength
  );
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" && value.length <= 40 && Number.isFinite(Date.parse(value))
  );
}

export function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    return false;
  }

  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function isScaleValue(value: unknown): value is ScaleValue {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function isTelemetryChannel(value: unknown): value is TelemetryChannel {
  return TELEMETRY_CHANNELS.includes(value as TelemetryChannel);
}

export function isRecordEnvelope(value: unknown): value is {
  id: string;
  createdAt: string;
  updatedAt: string;
} {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.id, 128) &&
    isIsoTimestamp(value.createdAt) &&
    isIsoTimestamp(value.updatedAt)
  );
}

export function isRecordedSource(value: unknown): value is RecordedSource {
  if (!isPlainObject(value)) return false;
  if (value.category !== "recorded") return false;
  if (value.origin !== "crew-entry" && value.origin !== "derived") return false;
  if (!isNonEmptyString(value.label, 160)) return false;
  if (value.derivedFrom === undefined) return true;

  return (
    Array.isArray(value.derivedFrom) &&
    value.derivedFrom.length > 0 &&
    value.derivedFrom.every((id) => isNonEmptyString(id, 128))
  );
}

export function isSimulatedSource(value: unknown): value is SimulatedSource {
  return (
    isPlainObject(value) &&
    value.category === "simulated" &&
    value.origin === "generator" &&
    isNonEmptyString(value.label, 160) &&
    isNonEmptyString(value.generator, 120) &&
    isFiniteNumber(value.generatorVersion) &&
    isNonEmptyString(value.scenarioId, 80) &&
    isFiniteNumber(value.seed)
  );
}

export function isResearchSource(value: unknown): value is ResearchSource {
  if (!isPlainObject(value)) return false;
  if (value.category !== "research" || value.origin !== "external") return false;
  if (!isNonEmptyString(value.label, 160)) return false;
  if (!isNonEmptyString(value.publisher, 160)) return false;
  if (!isIsoTimestamp(value.accessedAt)) return false;

  return isHttpsUrl(value.url);
}

export function isSourceMetadata(value: unknown): value is SourceMetadata {
  return isRecordedSource(value) || isSimulatedSource(value) || isResearchSource(value);
}

export function isCheckInDraft(value: unknown): value is CheckInDraft {
  if (!isPlainObject(value)) return false;
  if (!isIsoTimestamp(value.observedAt)) return false;
  if (
    !isFiniteNumber(value.sleepHours) ||
    value.sleepHours < 0 ||
    value.sleepHours > 16
  ) {
    return false;
  }

  if (!CHECK_IN_SCALE_FIELDS.every((field) => isScaleValue(value[field]))) {
    return false;
  }
  if (value.workload !== undefined && !isScaleValue(value.workload)) return false;

  return (
    isOptionalIntegerBetween(value.exercisePlannedMinutes, 0, 480) &&
    isOptionalIntegerBetween(value.exerciseCompletedMinutes, 0, 480) &&
    isOptionalIntegerBetween(value.hydrationEntries, 0, 20) &&
    isOptionalIntegerBetween(value.nutritionEntries, 0, 20)
  );
}

function isOptionalIntegerBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): boolean {
  return (
    value === undefined ||
    (typeof value === "number" &&
      Number.isInteger(value) &&
      value >= minimum &&
      value <= maximum)
  );
}

export function isCheckInRecord(value: unknown): value is CheckInRecord {
  if (!isRecordEnvelope(value)) return false;
  const record = value as unknown as Record<string, unknown>;
  if (!isRecordedSource(record.source)) return false;
  if (record.source.origin !== "crew-entry") return false;
  return isCheckInDraft(record);
}

export function isTelemetrySampleRecord(value: unknown): value is TelemetrySampleRecord {
  if (!isRecordEnvelope(value)) return false;
  const record = value as unknown as Record<string, unknown>;
  if (!isSimulatedSource(record.source)) return false;
  if (!isNonEmptyString(record.scenarioId, 80)) return false;
  if (record.scenarioId !== record.source.scenarioId) return false;
  if (!isTelemetryChannel(record.channel)) return false;
  if (!isIsoTimestamp(record.capturedAt)) return false;
  if (!isNonEmptyString(record.unit, 24)) return false;
  if (!isFiniteNumber(record.value) || Math.abs(record.value) > 1000) return false;

  return (
    isFiniteNumber(record.signalQuality) &&
    record.signalQuality >= 0 &&
    record.signalQuality <= 1
  );
}

export function isResearchEntry(value: unknown): value is ResearchEntry {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.id, 128) &&
    isNonEmptyString(value.title, 200) &&
    isNonEmptyString(value.publisher, 160) &&
    isIsoTimestamp(value.accessedAt) &&
    (value.kind === "program" ||
      value.kind === "dataset" ||
      value.kind === "publication") &&
    isNonEmptyString(value.summary, 600) &&
    Array.isArray(value.topics) &&
    value.topics.length > 0 &&
    value.topics.every((topic) => isNonEmptyString(topic, 80)) &&
    isResearchSource(value.source) &&
    value.publisher === value.source.publisher &&
    value.accessedAt === value.source.accessedAt &&
    value.url === value.source.url
  );
}

export function isDatasetPrivacyStatus(value: unknown): value is DatasetPrivacyStatus {
  return (
    value === "open-public" ||
    value === "de-identified-public" ||
    value === "credentialed-access" ||
    value === "restricted-not-approved"
  );
}

export function isDatasetIdentifier(value: unknown): value is DatasetIdentifier {
  if (!isPlainObject(value)) return false;
  if (value.type === "unavailable") {
    return isNonEmptyString(value.reason, 300);
  }

  return (
    (value.type === "doi" || value.type === "persistent" || value.type === "accession") &&
    isNonEmptyString(value.value, 300) &&
    isHttpsUrl(value.url)
  );
}

export function isDatasetChecksum(value: unknown): value is DatasetChecksum {
  return (
    isPlainObject(value) &&
    value.algorithm === "sha256" &&
    typeof value.value === "string" &&
    /^[a-f0-9]{64}$/.test(value.value) &&
    (value.manifestUrl === undefined || isHttpsUrl(value.manifestUrl))
  );
}

export function isDatasetPrivacyReview(value: unknown): value is DatasetPrivacyReview {
  return (
    isPlainObject(value) &&
    isIsoTimestamp(value.reviewedAt) &&
    isNonEmptyString(value.reviewReference, 500) &&
    (value.lawfulBasis === undefined || isNonEmptyString(value.lawfulBasis, 500))
  );
}

export function isDatasetSourceVerification(
  value: unknown,
): value is DatasetSourceVerification {
  if (!isPlainObject(value)) return false;
  if (!isIsoTimestamp(value.verifiedAt)) return false;
  if (!isNonEmptyString(value.verifiedBy, 160)) return false;

  return (
    value.officialSource === true &&
    value.licenseTerms === true &&
    value.citation === true &&
    value.checksum === true &&
    value.privacy === true
  );
}

export function isDatasetModelTraining(value: unknown): value is DatasetModelTraining {
  if (!isPlainObject(value)) return false;
  if (value.status === "not-used") return true;
  if (value.status !== "used") return false;

  return (
    isHttpsUrl(value.evidenceUrl) &&
    isIsoTimestamp(value.documentedAt) &&
    Array.isArray(value.modelIds) &&
    value.modelIds.length > 0 &&
    value.modelIds.every((modelId) => isNonEmptyString(modelId, 120))
  );
}

export function isDatasetProvenance(value: unknown): value is DatasetProvenance {
  if (!isPlainObject(value)) return false;
  if (value.category !== "research") return false;
  if (!isNonEmptyString(value.id, 128)) return false;
  if (!isNonEmptyString(value.title, 200)) return false;
  if (!isNonEmptyString(value.creator, 160)) return false;
  if (!isHttpsUrl(value.officialSourceUrl)) return false;
  if (!isNonEmptyString(value.licenseName, 160)) return false;
  if (!isHttpsUrl(value.licenseUrl)) return false;
  if (!isNonEmptyString(value.citation, 600)) return false;
  if (!isDatasetIdentifier(value.identifier)) return false;
  if (!isDatasetChecksum(value.fileChecksum)) return false;
  if (!isIsoTimestamp(value.ingestedAt)) return false;
  if (!isNonEmptyString(value.intendedUse, 500)) return false;
  if (!isNonEmptyString(value.limitations, 800)) return false;
  if (!isDatasetPrivacyStatus(value.privacyStatus)) return false;
  if (typeof value.containsHumanData !== "boolean") return false;
  if (!isDatasetPrivacyReview(value.privacyReview)) return false;
  if (
    !Array.isArray(value.attributionRequirements) ||
    value.attributionRequirements.length === 0 ||
    !value.attributionRequirements.every((requirement) =>
      isNonEmptyString(requirement, 300),
    )
  ) {
    return false;
  }
  if (!isDatasetModelTraining(value.modelTraining)) return false;
  if (!isDatasetSourceVerification(value.sourceVerification)) return false;

  if (value.containsHumanData) {
    if (value.privacyStatus === "open-public") return false;
    if (!isNonEmptyString(value.privacyReview.lawfulBasis, 500)) return false;
  }

  return true;
}
