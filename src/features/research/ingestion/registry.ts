import type { ValidationIssue, ValidationResult } from "@/types/health";

import { OSD_942_INGESTION } from "../datasets/osd-942/ingestion";
import { isIngestionRequest } from "./pipeline";
import type { IngestionRequest } from "./types";

// One request has completed every pipeline gate.
export const INGESTION_REGISTRY: readonly IngestionRequest[] = [OSD_942_INGESTION];

export function validateIngestionRegistry(
  input: unknown,
): ValidationResult<readonly IngestionRequest[]> {
  if (!Array.isArray(input)) {
    return {
      ok: false,
      issues: [
        { field: "ingestions", message: "An ingestion registry list is required." },
      ],
    };
  }

  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  input.forEach((request: unknown, index: number) => {
    if (!isIngestionRequest(request)) {
      issues.push({
        field: `ingestions.${index}`,
        message: "Ingestion request is incomplete or uses an invalid nested record.",
      });
      return;
    }

    if (ids.has(request.id)) {
      issues.push({
        field: `ingestions.${index}.id`,
        message: "Ingestion request ids must be unique.",
      });
    }

    ids.add(request.id);
  });

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: input as readonly IngestionRequest[] };
}
