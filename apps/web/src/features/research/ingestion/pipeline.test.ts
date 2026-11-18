import { describe, expect, it } from "vitest";

import { RESEARCH_DATASETS } from "@/features/research/dataset-integrity";
import { RESEARCH_INSIGHTS } from "@/features/research/evidence/model";
import {
  evaluateIngestion,
  isIngestionRequest,
} from "@/features/research/ingestion/pipeline";
import { INGESTION_REGISTRY } from "@/features/research/ingestion/registry";
import { DEIDENTIFICATION_CHECKS } from "@/features/research/validation/deidentification";
import { validateShippedResearchData } from "@/features/research/validation/schema";
import {
  makeDatasetProvenance,
  makeIngestionRequest,
  makeResearchInsight,
} from "@/test/fixtures";

const NOW = "2026-11-16T12:00:00.000Z";

function evaluate(
  request = makeIngestionRequest(),
  dataset = makeDatasetProvenance(),
  insights = [makeResearchInsight()],
) {
  return evaluateIngestion({ request, dataset, insights, now: NOW });
}

describe("research ingestion pipeline", () => {
  it("ships one complete ingestion request and valid shipped schemas", () => {
    expect(INGESTION_REGISTRY).toHaveLength(1);
    expect(INGESTION_REGISTRY[0]?.datasetId).toBe("osd-942");
    const report = validateShippedResearchData();
    expect(report.ok).toBe(true);
    expect(report.checks.map((check) => check.name)).toEqual([
      "datasets",
      "landscape",
      "insights",
      "ingestions",
    ]);
  });

  it("passes the shipped OSD-942 request through all thirteen gates", () => {
    const [request] = INGESTION_REGISTRY;
    const [dataset] = RESEARCH_DATASETS;
    if (!request || !dataset) throw new Error("Expected the shipped record.");
    const result = evaluateIngestion({
      request,
      dataset,
      insights: RESEARCH_INSIGHTS,
      now: NOW,
    });
    expect(result.ready).toBe(true);
    expect(result.stages).toHaveLength(13);
    expect(result.stages.every((stage) => stage.status === "complete")).toBe(true);
  });

  it("passes a complete request through all thirteen stages", () => {
    const result = evaluate();
    expect(result.ready).toBe(true);
    expect(result.stages).toHaveLength(13);
    expect(result.stages.every((stage) => stage.status === "complete")).toBe(true);
    expect(result.blockers).toHaveLength(0);
  });

  it("blocks a request with no privacy decision", () => {
    const result = evaluate(makeIngestionRequest({ privacy: null }));
    expect(result.ready).toBe(false);
    const privacy = result.stages.find((stage) => stage.id === "privacy-gate");
    expect(privacy?.status).toBe("blocked");
  });

  it("requires de-identification for human data", () => {
    const humanDataset = makeDatasetProvenance({
      containsHumanData: true,
      privacyStatus: "de-identified-public",
      privacyReview: {
        reviewedAt: "2026-11-16T08:00:00.000Z",
        reviewReference: "Ethics board reference",
        lawfulBasis: "Approved research use under recorded consent.",
      },
    });
    const request = makeIngestionRequest({
      privacy: {
        decision: "approved",
        lawfulBasis: "Approved research use under recorded consent.",
        reviewReference: "Ethics board reference",
        decidedBy: "Repository reviewer",
        decidedAt: "2026-11-16T08:00:00.000Z",
      },
    });

    const result = evaluate(request, humanDataset);
    expect(result.ready).toBe(false);
    const deidentification = result.stages.find(
      (stage) => stage.id === "de-identification",
    );
    expect(deidentification?.status).toBe("blocked");
  });

  it("accepts human data only with a complete de-identification review", () => {
    const humanDataset = makeDatasetProvenance({
      containsHumanData: true,
      privacyStatus: "de-identified-public",
      privacyReview: {
        reviewedAt: "2026-11-16T08:00:00.000Z",
        reviewReference: "Ethics board reference",
        lawfulBasis: "Approved research use under recorded consent.",
      },
    });
    const request = makeIngestionRequest({
      deidentification: {
        containsDirectIdentifiers: false,
        checkedElements: [...DEIDENTIFICATION_CHECKS],
        method: "Identifier removal with a documented review.",
        reviewer: "Privacy reviewer",
        reviewedAt: "2026-11-16T09:00:00.000Z",
        reference: "De-identification review 001",
      },
      privacy: {
        decision: "approved",
        lawfulBasis: "Approved research use under recorded consent.",
        reviewReference: "Ethics board reference",
        decidedBy: "Repository reviewer",
        decidedAt: "2026-11-16T08:00:00.000Z",
      },
    });

    expect(evaluate(request, humanDataset).ready).toBe(true);
  });

  it("blocks human data marked as not requiring a privacy decision", () => {
    const humanDataset = makeDatasetProvenance({
      containsHumanData: true,
      privacyStatus: "de-identified-public",
      privacyReview: {
        reviewedAt: "2026-11-16T08:00:00.000Z",
        reviewReference: "Ethics board reference",
        lawfulBasis: "Approved research use under recorded consent.",
      },
    });
    const request = makeIngestionRequest({
      deidentification: {
        containsDirectIdentifiers: false,
        checkedElements: [...DEIDENTIFICATION_CHECKS],
        method: "Identifier removal with a documented review.",
        reviewer: "Privacy reviewer",
        reviewedAt: "2026-11-16T09:00:00.000Z",
        reference: "De-identification review 001",
      },
    });

    const result = evaluate(request, humanDataset);
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/not requiring a privacy decision/);
  });

  it("separates the reviewer from the extractor", () => {
    const request = makeIngestionRequest({
      review: {
        decision: "approved",
        reviewer: "Fixture extractor",
        reviewedAt: "2026-11-16T10:00:00.000Z",
        notes: "Self-review attempt.",
        checklistReference: "research-review-checklist-v1",
      },
    });

    const result = evaluate(request);
    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/different from the extractor/);
  });

  it("blocks an insight with no reviewed unit conversion", () => {
    const insight = makeResearchInsight();
    const measurement = insight.measurements[0];
    if (!measurement) throw new Error("Fixture measurement is missing.");

    const result = evaluate(makeIngestionRequest(), makeDatasetProvenance(), [
      makeResearchInsight({ measurements: [{ ...measurement, unit: "hours" }] }),
    ]);

    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/no reviewed conversion/);
  });

  it("blocks a measurement with no missing-value rule", () => {
    const result = evaluate(
      makeIngestionRequest({
        missingValues: { rules: [], note: "No rules recorded." },
      }),
    );

    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/no missing-value rule/);
  });

  it("blocks an extraction that cites an unknown insight", () => {
    const result = evaluate(
      makeIngestionRequest({
        extraction: {
          insightIds: ["insight-missing"],
          method: "manual",
          extractedBy: "Fixture extractor",
          extractedAt: "2026-11-16T09:00:00.000Z",
        },
      }),
    );

    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toMatch(
      /not present in the validated insight registry/,
    );
  });

  it("blocks a request whose re-review date has passed", () => {
    const result = evaluate(
      makeIngestionRequest({
        version: {
          version: "1.0.0",
          supersedes: null,
          changeNote: "Expired fixture version.",
          reReviewDueAt: "2026-01-01T00:00:00.000Z",
        },
      }),
    );

    expect(result.ready).toBe(false);
    expect(result.blockers.join(" ")).toMatch(/re-review date has already passed/);
  });

  it("blocks an unknown dataset record", () => {
    const result = evaluateIngestion({
      request: makeIngestionRequest(),
      dataset: undefined,
      insights: [makeResearchInsight()],
      now: NOW,
    });

    expect(result.ready).toBe(false);
    expect(result.stages[0]?.status).toBe("blocked");
  });

  it("rejects a malformed nested record at the schema gate", () => {
    const request = makeIngestionRequest();
    const invalid = {
      ...request,
      version: {
        version: "1.0.0",
        supersedes: null,
        changeNote: "Malformed date for the schema test.",
        reReviewDueAt: "not-a-date",
      },
    };

    expect(isIngestionRequest(invalid)).toBe(false);
    expect(
      evaluate(invalid as typeof request).stages.find(
        (stage) => stage.id === "schema-validation",
      )?.status,
    ).toBe("blocked");
  });
});
