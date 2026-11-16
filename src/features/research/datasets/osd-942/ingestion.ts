import type { IngestionRequest } from "../../ingestion/types";
import { ONBOARDING_CHECKLIST_ID } from "../../ingestion/types";
import { DEIDENTIFICATION_CHECKS } from "../../validation/deidentification";
import { OSD_942_INSIGHT_ID } from "./insight";
import { OSD_942_DATASET_ID, OSD_942_METADATA_ARTIFACT } from "./provenance";

export const OSD_942_INGESTION_ID = "osd-942-ingestion-v1";

const LAW =
  "NASA OSDR public release of de-identified human research data under CC0-1.0, with study IRB approval and written informed consent reported by the authors.";

export const OSD_942_INGESTION: IngestionRequest = {
  id: OSD_942_INGESTION_ID,
  datasetId: OSD_942_DATASET_ID,
  onboarding: {
    completed: true,
    checklistId: ONBOARDING_CHECKLIST_ID,
    reference:
      "docs/RESEARCH.md section OSD-942 onboarding; docs/research/osd-942-provenance.md",
    completedAt: "2026-11-16T00:00:00.000Z",
  },
  normalization: {
    required: true,
    mappings: [
      {
        measurementId: "osd-942-measurement-gene-expression",
        sourceUnit: "log2 intensity",
        targetUnit: "log2 intensity",
        factor: 1,
        offset: 0,
        reference:
          "Identity mapping. The publication reports quantile-normalized expression; Astatine applied log2, quantile normalization across 44 arrays, and median centering without converting the reported unit.",
      },
      {
        measurementId: "osd-942-measurement-microrna-expression",
        sourceUnit: "log2 intensity",
        targetUnit: "log2 intensity",
        factor: 1,
        offset: 0,
        reference:
          "Identity mapping. The publication reports quantile-normalized microRNA expression; no unit conversion was applied.",
      },
    ],
    note: "Both measurements are reported as log2 intensity. No unit conversion was assumed, and the raw signal processing is documented in the normalized metadata artifact.",
  },
  missingValues: {
    rules: [
      {
        measurementId: "osd-942-measurement-gene-expression",
        policy: "exclude-from-summary",
        note: "Entities failing the authors' detection and percentile filters are excluded. Astatine found no non-positive signal and imputed no value.",
      },
      {
        measurementId: "osd-942-measurement-microrna-expression",
        policy: "exclude-from-summary",
        note: "Entities not flagged as detected in any condition are excluded. No value was imputed.",
      },
    ],
    note: "Missing or filtered values are reported or excluded, never imputed.",
  },
  deidentification: {
    containsDirectIdentifiers: false,
    checkedElements: DEIDENTIFICATION_CHECKS,
    method:
      "Review of the ISA sample and assay tables plus every processed file header. Only sample accessions, age, sex, tissue, group, timepoint, array design, and assay metadata are present.",
    reviewer: "Repository maintainer, role-level review",
    reviewedAt: "2026-11-16T00:00:00.000Z",
    reference: `OSD-942 ISA metadata package SHA-256 ${OSD_942_METADATA_ARTIFACT.sha256}.`,
  },
  privacy: {
    decision: "approved",
    lawfulBasis: LAW,
    reviewReference:
      "OSD-942 version 2 public release; publication reports NASA Johnson Space Center and University of Texas Medical Branch IRB approval and written informed consent.",
    decidedBy: "Repository owner, onboarding approval",
    decidedAt: "2026-11-16T00:00:00.000Z",
  },
  extraction: {
    insightIds: [OSD_942_INSIGHT_ID],
    method: "assisted-review",
    extractedBy:
      "Assisted extraction (Qoder), checked against the publication and ISA metadata",
    extractedAt: "2026-11-16T08:00:00.000Z",
  },
  review: {
    decision: "approved",
    reviewer: "Repository owner, onboarding approval",
    reviewedAt: "2026-11-16T09:00:00.000Z",
    notes:
      "Owner approved onboarding of OSD-942 after reviewing the prepared provenance and evidence record. This is a documentation review, not an external clinical or scientific peer review.",
    checklistReference: "dataset-onboarding-v1 and the 13-stage ingestion gates",
  },
  version: {
    version: "1.0.0",
    supersedes: null,
    changeNote:
      "Initial onboarding of the OSD-942 release and one bounded exercise-countermeasure insight.",
    reReviewDueAt: "2027-05-16T00:00:00.000Z",
  },
  createdAt: "2026-11-16T00:00:00.000Z",
  notes:
    "Official OSD-942 version 2 metadata package and 44 processed expression files were downloaded from OSDR, structurally validated, and summarized. Raw expression files are not committed.",
};
