import { describe, expect, it } from "vitest";

import {
  RESEARCH_INSIGHTS,
  approvedResearchInsights,
} from "@/features/research/evidence/model";
import type { ResearchInsight } from "@/features/research/evidence/types";
import {
  isResearchInsight,
  validateResearchInsights,
} from "@/features/research/validation/evidence";
import { makeResearchInsight } from "@/test/fixtures";

describe("research evidence model", () => {
  it("accepts a complete, research-only insight", () => {
    const insight = makeResearchInsight();
    expect(isResearchInsight(insight)).toBe(true);
    expect(validateResearchInsights([insight]).ok).toBe(true);
  });

  it("ships one approved insight linked to the onboarded dataset", () => {
    expect(RESEARCH_INSIGHTS).toHaveLength(1);
    const [insight] = RESEARCH_INSIGHTS;
    if (!insight) throw new Error("Expected the onboarded insight.");
    expect(insight.id).toBe("osd-942-exercise-mitochondria-bed-rest");
    expect(insight.reviewStatus).toBe("approved");
    expect(insight.domain).toBe("exercise-countermeasures");
    expect(insight.modelTraining).toBe("not-used");
    expect(approvedResearchInsights()).toHaveLength(1);
    expect(validateResearchInsights(RESEARCH_INSIGHTS, ["osd-942"]).ok).toBe(true);
    expect(approvedResearchInsights([makeResearchInsight()])).toHaveLength(1);
    expect(
      approvedResearchInsights([makeResearchInsight({ reviewStatus: "under-review" })]),
    ).toHaveLength(0);
  });

  it("rejects an insight that claims to describe the selected user", () => {
    const insight = makeResearchInsight();
    const invalid = {
      ...insight,
      applicability: {
        ...insight.applicability,
        appliesToSelectedUser: "yes",
      },
    } as unknown as ResearchInsight;

    expect(isResearchInsight(invalid)).toBe(false);
  });

  it("rejects human data without a lawful basis", () => {
    const insight = makeResearchInsight();
    const invalid = {
      ...insight,
      privacy: {
        ...insight.privacy,
        status: "open-public",
        containsHumanData: true,
        lawfulBasis: null,
      },
    } as unknown as ResearchInsight;

    expect(isResearchInsight(invalid)).toBe(false);
  });

  it("rejects any model-training claim other than not-used", () => {
    const invalid = {
      ...makeResearchInsight(),
      modelTraining: "used",
    } as unknown as ResearchInsight;

    expect(isResearchInsight(invalid)).toBe(false);

    const result = validateResearchInsights([invalid]);
    expect(result.ok).toBe(false);
  });

  it("rejects an observation that references an undefined measurement", () => {
    const insight = makeResearchInsight();
    const statement = insight.statements[0];
    if (!statement) throw new Error("Fixture statement is missing.");

    const invalid = {
      ...insight,
      statements: [
        {
          ...statement,
          observations: [
            {
              id: "observation-example",
              measurementId: "missing",
              statement: "An observation with a broken measurement reference.",
              valueType: "qualitative",
              effectSummary: null,
              unit: null,
              uncertainty: "None recorded.",
            },
          ],
        },
      ],
    } as ResearchInsight;

    expect(isResearchInsight(invalid)).toBe(false);
  });

  it("rejects duplicate insight ids", () => {
    const first = makeResearchInsight();
    const second = makeResearchInsight({ title: "Another insight" });

    const result = validateResearchInsights([first, second]);
    expect(result.ok).toBe(false);
  });

  it("rejects a dataset reference that is not onboarded", () => {
    const insight = {
      ...makeResearchInsight(),
      provenance: { ...makeResearchInsight().provenance, datasetId: "dataset-example" },
    } as ResearchInsight;

    expect(validateResearchInsights([insight]).ok).toBe(false);
    expect(validateResearchInsights([insight], ["dataset-example"]).ok).toBe(true);
  });

  it("requires a bundle-allowed licence to link to its terms", () => {
    const insight = makeResearchInsight();
    const invalid = {
      ...insight,
      license: { ...insight.license, redistribution: "bundle-allowed", url: null },
    } as ResearchInsight;

    expect(isResearchInsight(invalid)).toBe(false);
  });
});
