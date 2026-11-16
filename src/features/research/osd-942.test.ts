import { describe, expect, it } from "vitest";

import { isDatasetProvenance } from "@/lib/validation";

import { RESEARCH_DATASETS, validateDatasetRegistry } from "./dataset-integrity";
import { RESEARCH_INSIGHTS } from "./evidence/model";
import { evaluateIngestion } from "./ingestion/pipeline";
import { INGESTION_REGISTRY } from "./ingestion/registry";
import { validateResearchInsights, isResearchInsight } from "./validation/evidence";
import { validateShippedResearchData } from "./validation/schema";
import { OSD_942_INGESTION } from "./datasets/osd-942/ingestion";
import { OSD_942_INSIGHT, OSD_942_INSIGHT_ID } from "./datasets/osd-942/insight";
import {
  OSD_942_NORMALIZATION,
  OSD_942_SAMPLES,
  osd942SamplesFor,
} from "./datasets/osd-942/normalized";
import {
  OSD_942_DATASET,
  OSD_942_DATASET_ID,
  OSD_942_METADATA_ARTIFACT,
} from "./datasets/osd-942/provenance";
import { OSD_942_REPORTED_RESULTS } from "./datasets/osd-942/reported-results";

const NOW = "2026-11-16T12:00:00.000Z";

describe("OSD-942 onboarding", () => {
  it("records a complete, verified dataset provenance record", () => {
    expect(isDatasetProvenance(OSD_942_DATASET)).toBe(true);
    expect(validateDatasetRegistry([OSD_942_DATASET]).ok).toBe(true);
    expect(OSD_942_DATASET.id).toBe(OSD_942_DATASET_ID);
    expect(OSD_942_DATASET.identifier).toEqual({
      type: "doi",
      value: "10.26030/2ngb-7470",
      url: "https://doi.org/10.26030/2ngb-7470",
    });
    expect(OSD_942_DATASET.fileChecksum.value).toBe(
      "cc9aafaf869247d50ad8a53aaf161eae3b6686f041403cd275250f0f22a90247",
    );
    expect(OSD_942_DATASET.fileChecksum.value).toBe(OSD_942_METADATA_ARTIFACT.sha256);
    expect(OSD_942_METADATA_ARTIFACT.bytes).toBe(53295);
    expect(OSD_942_DATASET.licenseName).toContain("CC0");
    expect(OSD_942_DATASET.privacyStatus).toBe("de-identified-public");
    expect(OSD_942_DATASET.containsHumanData).toBe(true);
    expect(OSD_942_DATASET.modelTraining).toEqual({ status: "not-used" });
    expect(OSD_942_DATASET.sourceVerification).toMatchObject({
      officialSource: true,
      licenseTerms: true,
      citation: true,
      checksum: true,
      privacy: true,
    });
  });

  it("normalizes 44 arrays into 22 complete pre/post pairs", () => {
    expect(OSD_942_NORMALIZATION.sampleCount).toBe(44);
    expect(OSD_942_NORMALIZATION.participantCount).toBe(22);
    expect(OSD_942_SAMPLES).toHaveLength(44);
    expect(new Set(OSD_942_SAMPLES.map((sample) => sample.sampleAccession)).size).toBe(
      44,
    );
    expect(new Set(OSD_942_SAMPLES.map((sample) => sample.pairKey)).size).toBe(22);

    expect(osd942SamplesFor("control", "pre")).toHaveLength(7);
    expect(osd942SamplesFor("control", "post")).toHaveLength(7);
    expect(osd942SamplesFor("traditional-exercise", "pre")).toHaveLength(7);
    expect(osd942SamplesFor("traditional-exercise", "post")).toHaveLength(7);
    expect(osd942SamplesFor("flywheel-exercise", "pre")).toHaveLength(8);
    expect(osd942SamplesFor("flywheel-exercise", "post")).toHaveLength(8);

    for (const sample of OSD_942_SAMPLES) {
      expect(sample.sex).toBe("male");
      expect(sample.tissue).toBe("vastus-lateralis");
      expect(sample.arrayDesign).toBe("GPL21185");
      expect(sample.features).toBe(OSD_942_NORMALIZATION.featureCount);
      expect(sample.positiveFeatures).toBe(OSD_942_NORMALIZATION.featureCount);
      expect(sample.excludedNonPositiveFeatures).toBe(0);
      expect(sample.normalizedMedianLog2).toBe(0);
      expect(sample.normalizedIqrLog2).toBe(5.210617);
      expect(sample.sourceFileSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(sample.sourceFile).toContain(sample.sampleAccession);
      expect(sample.ageYears).toBeGreaterThanOrEqual(18);
      expect(sample.ageYears).toBeLessThanOrEqual(45);
    }

    const pairs = new Map<string, Set<string>>();
    for (const sample of OSD_942_SAMPLES) {
      const timepoints = pairs.get(sample.pairKey) ?? new Set<string>();
      timepoints.add(sample.timepoint);
      pairs.set(sample.pairKey, timepoints);
    }
    expect([...pairs.values()].every((timepoints) => timepoints.size === 2)).toBe(true);
  });

  it("keeps the reported aggregates and thresholds linked to the publication", () => {
    expect(OSD_942_REPORTED_RESULTS.genesAltered).toBe(2113);
    expect(OSD_942_REPORTED_RESULTS.interactionGenes).toBe(511);
    expect(OSD_942_REPORTED_RESULTS.downregulatedInBedRestOnly).toBe(489);
    expect(OSD_942_REPORTED_RESULTS.upregulatedInBedRestOnly).toBe(92);
    expect(OSD_942_REPORTED_RESULTS.microRnasAltered).toBe(35);
    expect(OSD_942_REPORTED_RESULTS.thresholds).toEqual({
      foldChange: 1.2,
      pValue: 0.05,
      enrichmentFdr: 0.05,
    });
    expect(OSD_942_REPORTED_RESULTS.citation).toContain("10.1249/MSS.0000000000003457");
  });

  it("publishes one approved, non-personal, non-training insight", () => {
    expect(isResearchInsight(OSD_942_INSIGHT)).toBe(true);
    expect(validateResearchInsights([OSD_942_INSIGHT], [OSD_942_DATASET_ID]).ok).toBe(
      true,
    );
    expect(OSD_942_INSIGHT.id).toBe(OSD_942_INSIGHT_ID);
    expect(OSD_942_INSIGHT.reviewStatus).toBe("approved");
    expect(OSD_942_INSIGHT.domain).toBe("exercise-countermeasures");
    expect(OSD_942_INSIGHT.modelTraining).toBe("not-used");
    expect(OSD_942_INSIGHT.applicability.appliesToSelectedUser).toBe("not-personal");
    expect(OSD_942_INSIGHT.provenance.datasetId).toBe(OSD_942_DATASET_ID);
    expect(OSD_942_INSIGHT.privacy.status).toBe("de-identified-public");
    expect(OSD_942_INSIGHT.license.redistribution).toBe("bundle-allowed");
    expect(OSD_942_INSIGHT.sources.map((source) => source.sourceType)).toEqual([
      "dataset",
      "publication",
    ]);
    expect(OSD_942_INSIGHT.nextReviewDueAt).toBe("2027-05-16T00:00:00.000Z");
    expect(OSD_942_INSIGHT.statements).toHaveLength(2);
  });

  it("passes the shipped registries and all thirteen ingestion gates", () => {
    const report = validateShippedResearchData();
    expect(report.ok).toBe(true);

    const [dataset] = RESEARCH_DATASETS;
    if (!dataset) throw new Error("Expected the onboarded dataset.");
    const result = evaluateIngestion({
      request: OSD_942_INGESTION,
      dataset,
      insights: RESEARCH_INSIGHTS,
      now: NOW,
    });
    expect(result.ready).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(result.stages.every((stage) => stage.status === "complete")).toBe(true);
    expect(INGESTION_REGISTRY).toContain(OSD_942_INGESTION);
  });
});
