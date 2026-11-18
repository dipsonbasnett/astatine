import { describe, expect, it } from "vitest";

import { RESEARCH_DATASETS } from "@/features/research/dataset-integrity";
import {
  LANDSCAPE_DOMAIN_NOTES,
  RESEARCH_DOMAIN_IDS,
  RESEARCH_LANDSCAPE,
  landscapeEntriesForDomain,
  validateResearchLandscape,
} from "@/features/research/provenance/landscape";

describe("research landscape", () => {
  it("contains the nine required resources with unique ids and https urls", () => {
    expect(RESEARCH_LANDSCAPE).toHaveLength(9);

    const ids = RESEARCH_LANDSCAPE.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const entry of RESEARCH_LANDSCAPE) {
      expect(entry.officialUrl.startsWith("https://")).toBe(true);
      expect(entry.verifiedAt).toBe("2026-11-16");
      expect(entry.modelTraining).toBe("not-approved");
    }
  });

  it("passes its own validation", () => {
    const result = validateResearchLandscape(RESEARCH_LANDSCAPE);
    expect(result.ok).toBe(true);
  });

  it("links the onboarded OSD-942 dataset to the OSDR landscape entry", () => {
    expect(RESEARCH_DATASETS).toHaveLength(1);
    expect(RESEARCH_DATASETS[0]?.identifier).toEqual({
      type: "doi",
      value: "10.26030/2ngb-7470",
      url: "https://doi.org/10.26030/2ngb-7470",
    });
    expect(RESEARCH_LANDSCAPE.some((entry) => entry.id === "nasa-osdr")).toBe(true);
  });

  it("never marks a partially verified resource as ready for ingestion", () => {
    for (const entry of RESEARCH_LANDSCAPE) {
      if (entry.verificationStatus === "partially-verified") {
        expect(["request-only", "not-evidence"]).toContain(entry.ingestionSuitability);
      }
    }
  });

  it("covers every health domain with at least one landscape pointer", () => {
    for (const domain of RESEARCH_DOMAIN_IDS) {
      expect(landscapeEntriesForDomain(domain).length).toBeGreaterThan(0);
      expect(LANDSCAPE_DOMAIN_NOTES[domain].length).toBeGreaterThan(0);
    }
  });

  it("rejects duplicate ids and unapproved model-training status", () => {
    const duplicate = validateResearchLandscape([
      RESEARCH_LANDSCAPE[0],
      RESEARCH_LANDSCAPE[0],
    ]);
    expect(duplicate.ok).toBe(false);

    const usedForTraining = validateResearchLandscape([
      { ...RESEARCH_LANDSCAPE[0], modelTraining: "used" },
    ]);
    expect(usedForTraining.ok).toBe(false);
  });

  it("requires a missing license url to be explained", () => {
    const result = validateResearchLandscape([
      {
        ...RESEARCH_LANDSCAPE[2],
        licenseName: "Creative Commons",
        licenseUrl: null,
      },
    ]);
    expect(result.ok).toBe(false);
  });
});
