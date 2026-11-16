import { describe, expect, it } from "vitest";

import { makeDatasetProvenance } from "@/test/fixtures";
import {
  RESEARCH_DATASETS,
  datasetAttributionLines,
  datasetIdentifierLabel,
  datasetTrainingDisclosure,
  datasetVerificationLine,
  validateDatasetRegistry,
} from "./dataset-integrity";

describe("validateDatasetRegistry", () => {
  it("accepts an empty registry", () => {
    const result = validateDatasetRegistry([]);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual([]);
  });

  it("rejects a non-list registry", () => {
    const result = validateDatasetRegistry(null);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([
        { field: "datasets", message: "A dataset registry list is required." },
      ]);
    }
  });

  it("accepts a fully verified open dataset", () => {
    const result = validateDatasetRegistry([makeDatasetProvenance()]);

    expect(result.ok).toBe(true);
  });

  it("rejects a dataset without an official https source", () => {
    const result = validateDatasetRegistry([
      makeDatasetProvenance({ officialSourceUrl: "http://example.org/dataset" }),
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.field).toBe("datasets.0");
  });

  it("rejects a dataset without an https license url", () => {
    const result = validateDatasetRegistry([
      makeDatasetProvenance({ licenseUrl: "http://example.org/license" }),
    ]);

    expect(result.ok).toBe(false);
  });

  it("rejects a malformed file checksum", () => {
    const result = validateDatasetRegistry([
      makeDatasetProvenance({
        fileChecksum: {
          algorithm: "sha256",
          value: "not-a-sha256-checksum",
        },
      }),
    ]);

    expect(result.ok).toBe(false);
  });

  it("rejects human data marked as open public", () => {
    const result = validateDatasetRegistry([
      makeDatasetProvenance({
        containsHumanData: true,
        privacyStatus: "open-public",
        privacyReview: {
          reviewedAt: "2026-11-16T08:00:00.000Z",
          reviewReference: "Privacy review record",
          lawfulBasis: "Public-use de-identified research data.",
        },
      }),
    ]);

    expect(result.ok).toBe(false);
  });

  it("requires a lawful basis for human data", () => {
    const result = validateDatasetRegistry([
      makeDatasetProvenance({
        containsHumanData: true,
        privacyStatus: "de-identified-public",
      }),
    ]);

    expect(result.ok).toBe(false);
  });

  it("accepts human data with privacy review and lawful basis", () => {
    const result = validateDatasetRegistry([
      makeDatasetProvenance({
        containsHumanData: true,
        privacyStatus: "de-identified-public",
        privacyReview: {
          reviewedAt: "2026-11-16T08:00:00.000Z",
          reviewReference: "Privacy review record",
          lawfulBasis: "Public-use de-identified research data.",
        },
      }),
    ]);

    expect(result.ok).toBe(true);
  });

  it("rejects a dataset with an incomplete source verification", () => {
    const result = validateDatasetRegistry([
      makeDatasetProvenance({
        sourceVerification: {
          verifiedAt: "2026-11-16T08:00:00.000Z",
          verifiedBy: "Repository maintainer, role-level review",
          officialSource: true,
          licenseTerms: true,
          citation: true,
          checksum: false,
          privacy: true,
        },
      }),
    ]);

    expect(result.ok).toBe(false);
  });

  it("rejects a training-use claim without evidence", () => {
    const result = validateDatasetRegistry([
      makeDatasetProvenance({
        modelTraining: { status: "used" } as never,
      }),
    ]);

    expect(result.ok).toBe(false);
  });

  it("accepts documented training use", () => {
    const result = validateDatasetRegistry([
      makeDatasetProvenance({
        modelTraining: {
          status: "used",
          evidenceUrl: "https://example.org/model-card",
          documentedAt: "2026-11-16T08:00:00.000Z",
          modelIds: ["example-model-v1"],
        },
      }),
    ]);

    expect(result.ok).toBe(true);
  });

  it("rejects a dataset that is not approved for onboarding", () => {
    const result = validateDatasetRegistry([
      makeDatasetProvenance({
        privacyStatus: "restricted-not-approved",
        containsHumanData: true,
        privacyReview: {
          reviewedAt: "2026-11-16T08:00:00.000Z",
          reviewReference: "Restricted dataset review",
          lawfulBasis: "Not approved.",
        },
      }),
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.message)).toContain(
        "Dataset is not approved for onboarding.",
      );
    }
  });

  it("rejects duplicate dataset ids and source urls", () => {
    const result = validateDatasetRegistry([
      makeDatasetProvenance(),
      makeDatasetProvenance({ title: "Different title, same id and source" }),
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const messages = result.issues.map((issue) => issue.message);
      expect(messages).toContain("Dataset ids must be unique.");
      expect(messages).toContain("Dataset source urls must be unique.");
    }
  });
});

describe("dataset attribution and disclosure helpers", () => {
  it("labels DOI and unavailable identifiers without inventing one", () => {
    expect(datasetIdentifierLabel(makeDatasetProvenance())).toBe("DOI: 10.0000/example");
    expect(
      datasetIdentifierLabel(
        makeDatasetProvenance({
          identifier: {
            type: "unavailable",
            reason: "The publisher does not assign a persistent identifier.",
          },
        }),
      ),
    ).toBe(
      "No DOI or persistent identifier: The publisher does not assign a persistent identifier.",
    );
  });

  it("includes the citation, license, and attribution requirements", () => {
    const lines = datasetAttributionLines(makeDatasetProvenance());

    expect(lines[0]).toContain("Example research dataset");
    expect(lines[1]).toContain("Creative Commons Attribution 4.0");
    expect(lines[2]).toContain("Credit the dataset creators");
  });

  it("states the training disclosure in both directions", () => {
    expect(datasetTrainingDisclosure(makeDatasetProvenance())).toBe(
      "Not used for model training.",
    );
    expect(
      datasetTrainingDisclosure(
        makeDatasetProvenance({
          modelTraining: {
            status: "used",
            evidenceUrl: "https://example.org/model-card",
            documentedAt: "2026-11-16T08:00:00.000Z",
            modelIds: ["example-model-v1"],
          },
        }),
      ),
    ).toContain("Used for model training by example-model-v1.");
  });

  it("reports the verification date and reviewer", () => {
    expect(datasetVerificationLine(makeDatasetProvenance())).toBe(
      "Verified 2026-11-16 by Repository maintainer, role-level review.",
    );
  });

  it("ships no dataset", () => {
    expect(RESEARCH_DATASETS).toEqual([]);
    expect(validateDatasetRegistry(RESEARCH_DATASETS).ok).toBe(true);
  });
});
