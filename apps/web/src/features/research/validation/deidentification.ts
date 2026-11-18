import { isIsoTimestamp, isNonEmptyString, isPlainObject } from "@/lib/validation";

export interface DeidentificationReview {
  containsDirectIdentifiers: false;
  checkedElements: readonly string[];
  method: string;
  reviewer: string;
  reviewedAt: string;
  reference: string;
}

export const DEIDENTIFICATION_CHECKS = [
  "Names and initials",
  "Dates more specific than the approved resolution",
  "Geographic detail",
  "Contact and account identifiers",
  "Free-text notes that could identify a person",
  "Rare combinations of role and mission detail",
  "Linked files or metadata that could re-identify a participant",
] as const;

export const DEIDENTIFICATION_PRINCIPLE =
  "Human data is not accepted until a reviewer records that direct identifiers were removed and names the elements that were checked.";

export function isDeidentificationReview(
  value: unknown,
): value is DeidentificationReview {
  return (
    isPlainObject(value) &&
    value.containsDirectIdentifiers === false &&
    Array.isArray(value.checkedElements) &&
    value.checkedElements.length > 0 &&
    value.checkedElements.every((element) =>
      (DEIDENTIFICATION_CHECKS as readonly string[]).includes(element),
    ) &&
    isNonEmptyString(value.method, 500) &&
    isNonEmptyString(value.reviewer, 160) &&
    isIsoTimestamp(value.reviewedAt) &&
    isNonEmptyString(value.reference, 500)
  );
}

export function uncheckedDeidentificationElements(
  review: DeidentificationReview,
): string[] {
  return DEIDENTIFICATION_CHECKS.filter(
    (check) => !review.checkedElements.includes(check),
  );
}
