import { isNonEmptyString, isPlainObject } from "@/lib/validation";
import type { ValidationIssue, ValidationResult } from "@/types/health";

export type MissingValuePolicy = "report-missing" | "exclude-from-summary";

export interface MissingValueRule {
  measurementId: string;
  policy: MissingValuePolicy;
  note: string;
}

export interface MissingValuePlan {
  rules: readonly MissingValueRule[];
  note: string;
}

export const MISSING_VALUE_PRINCIPLE =
  "A missing value is reported or excluded. It is never imputed, estimated, or replaced with a default.";

export function isMissingValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "number" && !Number.isFinite(value))
  );
}

export function isMissingValueRule(value: unknown): value is MissingValueRule {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.measurementId, 128) &&
    (value.policy === "report-missing" || value.policy === "exclude-from-summary") &&
    isNonEmptyString(value.note, 500)
  );
}

export function isMissingValuePlan(value: unknown): value is MissingValuePlan {
  return (
    isPlainObject(value) &&
    Array.isArray(value.rules) &&
    value.rules.every((rule) => isMissingValueRule(rule)) &&
    isNonEmptyString(value.note, 500)
  );
}

export function applyMissingValueRule(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  return Number.isFinite(value) ? value : null;
}

export function validateMissingValueRules(
  rules: readonly MissingValueRule[],
): ValidationResult<readonly MissingValueRule[]> {
  if (!Array.isArray(rules)) {
    return {
      ok: false,
      issues: [{ field: "rules", message: "A missing-value rule list is required." }],
    };
  }

  const issues: ValidationIssue[] = [];
  const measurementIds = new Set<string>();

  rules.forEach((rule: unknown, index: number) => {
    if (!isMissingValueRule(rule)) {
      issues.push({
        field: `rules.${index}`,
        message:
          "Missing-value rule needs a measurement id, a report-or-exclude policy, and a note.",
      });
      return;
    }

    if (measurementIds.has(rule.measurementId)) {
      issues.push({
        field: `rules.${index}.measurementId`,
        message: "Each measurement may have only one missing-value rule.",
      });
    }

    measurementIds.add(rule.measurementId);
  });

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: rules };
}
