import {
  isCheckInDraft,
  isIsoTimestamp,
  isNonEmptyString,
  isPlainObject,
  isRecordEnvelope,
  isRecordedSource,
} from "@/lib/validation";
import type { ReportSnapshotDraft, ReportSnapshotRecord } from "@/types/health";

import { isCountermeasurePlan } from "@/features/countermeasures/countermeasure-engine";
import { isReadinessAssessment } from "@/features/readiness/readiness-engine";

export function isReportSnapshotDraft(value: unknown): value is ReportSnapshotDraft {
  if (!isPlainObject(value)) return false;
  if (!isNonEmptyString(value.title, 200)) return false;
  if (!isIsoTimestamp(value.generatedAt)) return false;
  if (!isNonEmptyString(value.checkInId, 128)) return false;
  if (!isPlainObject(value.observation)) return false;
  if (!isCheckInDraft(value.observation)) return false;
  if (!isNonEmptyString(value.observation.sourceLabel, 160)) return false;
  if (!isReadinessAssessment(value.readiness)) return false;
  if (!isCountermeasurePlan(value.countermeasures)) return false;
  if (value.readiness.inputs.checkInId !== value.checkInId) return false;
  if (value.readiness.inputs.observedAt !== value.observation.observedAt) return false;

  if (
    !Array.isArray(value.caveats) ||
    !value.caveats.every((caveat) => isNonEmptyString(caveat, 500)) ||
    !Array.isArray(value.missingData) ||
    !value.missingData.every((item) => isNonEmptyString(item, 500))
  ) {
    return false;
  }

  return (
    Array.isArray(value.dataClasses) &&
    value.dataClasses.length === 1 &&
    value.dataClasses[0] === "recorded"
  );
}

export function isReportSnapshotRecord(value: unknown): value is ReportSnapshotRecord {
  if (!isRecordEnvelope(value)) return false;
  const record = value as unknown as Record<string, unknown>;
  if (!isRecordedSource(record.source)) return false;
  if (record.source.origin !== "derived") return false;

  const derivedFrom = record.source.derivedFrom;
  if (!isReportSnapshotDraft(record)) return false;

  return Array.isArray(derivedFrom) && derivedFrom.includes(record.checkInId);
}
