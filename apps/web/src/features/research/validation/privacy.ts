import { isIsoTimestamp, isNonEmptyString, isPlainObject } from "@/lib/validation";

export interface PrivacyGateDecision {
  decision: "approved" | "rejected" | "not-required";
  lawfulBasis: string | null;
  reviewReference: string;
  decidedBy: string;
  decidedAt: string;
}

export const PRIVACY_GATE_PRINCIPLE =
  "Every ingestion request records a privacy decision. Human data needs an approved decision and a written lawful basis; non-human data still records why the gate does not apply.";

export function isPrivacyGateDecision(value: unknown): value is PrivacyGateDecision {
  return (
    isPlainObject(value) &&
    (value.decision === "approved" ||
      value.decision === "rejected" ||
      value.decision === "not-required") &&
    (value.lawfulBasis === null || isNonEmptyString(value.lawfulBasis, 500)) &&
    isNonEmptyString(value.reviewReference, 500) &&
    isNonEmptyString(value.decidedBy, 160) &&
    isIsoTimestamp(value.decidedAt)
  );
}

export function privacyGateBlockers(
  containsHumanData: boolean,
  decision: PrivacyGateDecision,
): string[] {
  const blockers: string[] = [];

  if (decision.decision === "rejected") {
    blockers.push("The privacy gate rejected this request.");
  }
  if (decision.decision === "not-required" && containsHumanData) {
    blockers.push("Human data cannot be marked as not requiring a privacy decision.");
  }
  if (containsHumanData && decision.decision === "approved") {
    if (!isNonEmptyString(decision.lawfulBasis, 500)) {
      blockers.push("An approved human-data decision needs a written lawful basis.");
    }
  }
  if (!containsHumanData && decision.decision !== "not-required") {
    blockers.push(
      "A request without human data must record why the privacy gate does not apply.",
    );
  }

  return blockers;
}
