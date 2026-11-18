import { RESEARCH_DATASETS, validateDatasetRegistry } from "../dataset-integrity";
import { RESEARCH_INSIGHTS } from "../evidence/model";
import { INGESTION_REGISTRY, validateIngestionRegistry } from "../ingestion/registry";
import { RESEARCH_LANDSCAPE, validateResearchLandscape } from "../provenance/landscape";
import { validateResearchInsights } from "./evidence";

export interface ResearchSchemaCheck {
  name: string;
  recordCount: number;
  ok: boolean;
  issues: readonly string[];
}

export interface ResearchSchemaReport {
  ok: boolean;
  checks: readonly ResearchSchemaCheck[];
}

function toCheck(
  name: string,
  recordCount: number,
  result: { ok: true } | { ok: false; issues: readonly { field: string }[] },
): ResearchSchemaCheck {
  return {
    name,
    recordCount,
    ok: result.ok,
    issues: result.ok ? [] : result.issues.map((issue) => issue.field),
  };
}

export function validateShippedResearchData(): ResearchSchemaReport {
  const datasets = validateDatasetRegistry(RESEARCH_DATASETS);
  const landscape = validateResearchLandscape(RESEARCH_LANDSCAPE);
  const insights = validateResearchInsights(
    RESEARCH_INSIGHTS,
    RESEARCH_DATASETS.map((dataset) => dataset.id),
  );
  const ingestions = validateIngestionRegistry(INGESTION_REGISTRY);

  const checks = [
    toCheck("datasets", RESEARCH_DATASETS.length, datasets),
    toCheck("landscape", RESEARCH_LANDSCAPE.length, landscape),
    toCheck("insights", RESEARCH_INSIGHTS.length, insights),
    toCheck("ingestions", INGESTION_REGISTRY.length, ingestions),
  ];

  return { ok: checks.every((check) => check.ok), checks };
}
