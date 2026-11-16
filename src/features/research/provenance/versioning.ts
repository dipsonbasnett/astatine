import { isIsoTimestamp, isNonEmptyString, isPlainObject } from "@/lib/validation";

export interface VersionRecord {
  version: string;
  supersedes: string | null;
  changeNote: string;
  reReviewDueAt: string;
}

export const RE_REVIEW_TRIGGERS = [
  "The publisher releases a new version or erratum.",
  "The license or access terms change.",
  "The source is retracted, corrected, or withdrawn.",
  "The source page becomes unavailable or moves.",
  "A reviewer finds a claim that exceeds the source.",
  "The scheduled re-review date passes.",
  "A product surface begins using the insight for the first time.",
] as const;

export const VERSIONING_PRINCIPLE =
  "An approved insight carries a version and a scheduled re-review date. A superseded or due-for-review insight is hidden from product surfaces until a reviewer renews it.";

export function isVersionRecord(value: unknown): value is VersionRecord {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.version, 80) &&
    (value.supersedes === null || isNonEmptyString(value.supersedes, 128)) &&
    isNonEmptyString(value.changeNote, 500) &&
    isIsoTimestamp(value.reReviewDueAt)
  );
}

export function isReReviewDue(record: VersionRecord, now: string): boolean {
  return Date.parse(record.reReviewDueAt) <= Date.parse(now);
}
