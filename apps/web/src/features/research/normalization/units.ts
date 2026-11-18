import { isFiniteNumber, isNonEmptyString, isPlainObject } from "@/lib/validation";
import type { ValidationIssue, ValidationResult } from "@/types/health";

export interface UnitMapping {
  measurementId: string;
  sourceUnit: string;
  targetUnit: string;
  factor: number;
  offset: number;
  reference: string;
}

export interface NormalizationPlan {
  required: boolean;
  mappings: readonly UnitMapping[];
  note: string;
}

export const NORMALIZATION_PRINCIPLE =
  "Units are converted only with a recorded, reviewed mapping. No value is converted by assumption, and an unconvertible value stays unavailable.";

export function isUnitMapping(value: unknown): value is UnitMapping {
  return (
    isPlainObject(value) &&
    isNonEmptyString(value.measurementId, 128) &&
    isNonEmptyString(value.sourceUnit, 40) &&
    isNonEmptyString(value.targetUnit, 40) &&
    isFiniteNumber(value.factor) &&
    value.factor > 0 &&
    isFiniteNumber(value.offset) &&
    isNonEmptyString(value.reference, 500)
  );
}

export function isNormalizationPlan(value: unknown): value is NormalizationPlan {
  return (
    isPlainObject(value) &&
    typeof value.required === "boolean" &&
    Array.isArray(value.mappings) &&
    value.mappings.every((mapping) => isUnitMapping(mapping)) &&
    isNonEmptyString(value.note, 500) &&
    (!value.required || value.mappings.length > 0)
  );
}

export function applyUnitMapping(value: number, mapping: UnitMapping): number {
  return value * mapping.factor + mapping.offset;
}

export function describeUnitMapping(mapping: UnitMapping): string {
  return `${mapping.sourceUnit} to ${mapping.targetUnit}: x${mapping.factor} + ${mapping.offset} (${mapping.reference}).`;
}

export function validateUnitMappings(
  mappings: readonly UnitMapping[],
): ValidationResult<readonly UnitMapping[]> {
  if (!Array.isArray(mappings)) {
    return {
      ok: false,
      issues: [{ field: "mappings", message: "A unit mapping list is required." }],
    };
  }

  const issues: ValidationIssue[] = [];
  const measurementIds = new Set<string>();

  mappings.forEach((mapping: unknown, index: number) => {
    if (!isUnitMapping(mapping)) {
      issues.push({
        field: `mappings.${index}`,
        message:
          "Unit mapping needs an id, source and target unit, positive factor, finite offset, and a reference.",
      });
      return;
    }

    if (measurementIds.has(mapping.measurementId)) {
      issues.push({
        field: `mappings.${index}.measurementId`,
        message: "Each measurement may have only one unit mapping.",
      });
    }

    measurementIds.add(mapping.measurementId);
  });

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: mappings };
}
