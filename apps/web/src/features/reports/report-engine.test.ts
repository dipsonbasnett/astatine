import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";

import { buildCountermeasurePlan } from "@/features/countermeasures/countermeasure-engine";
import { assessReadiness } from "@/features/readiness/readiness-engine";

import { isReportSnapshotDraft } from "./report-validation";
import { REPORT_SCOPE_NOTE, buildReportSnapshotDraft } from "./report-engine";

const NOW = "2026-11-16T10:00:00.000Z";
const GENERATED_AT = "2026-11-16T10:05:00.000Z";

function fixtures(checkIn = makeCheckIn()) {
  const readiness = assessReadiness({
    checkIns: [checkIn],
    now: new Date(NOW),
  });
  if (!readiness) throw new Error("Expected a readiness fixture.");
  return {
    checkIn,
    readiness,
    countermeasures: buildCountermeasurePlan(readiness),
  };
}

describe("buildReportSnapshotDraft", () => {
  it("freezes the check-in, rubric output, and wellness plan", () => {
    const input = fixtures();
    const draft = buildReportSnapshotDraft({ ...input, generatedAt: GENERATED_AT });

    expect(draft).toMatchObject({
      title: "Local check-in snapshot · 2026-11-16",
      generatedAt: GENERATED_AT,
      checkInId: "checkin-1",
      observation: {
        observedAt: "2026-11-16T08:00:00.000Z",
        sleepHours: 7.5,
        sourceLabel: "Crew-entered check-in",
      },
      dataClasses: ["recorded"],
    });
    expect(draft.readiness).toEqual(input.readiness);
    expect(draft.countermeasures).toEqual(input.countermeasures);
    expect(draft.missingData).toEqual(input.readiness.missingData);
    expect(draft.caveats).toContain(REPORT_SCOPE_NOTE);
    expect(new Set(draft.caveats).size).toBe(draft.caveats.length);
  });

  it("accepts an explicit title", () => {
    const draft = buildReportSnapshotDraft({
      ...fixtures(),
      generatedAt: GENERATED_AT,
      title: "Post-sleep review",
    });

    expect(draft.title).toBe("Post-sleep review");
  });

  it("rejects readiness computed from a different check-in", () => {
    const input = fixtures();

    expect(() =>
      buildReportSnapshotDraft({
        ...input,
        checkIn: makeCheckIn({ id: "different-checkin" }),
        generatedAt: GENERATED_AT,
      }),
    ).toThrow(/does not match/);
  });

  it("rejects an invalid generation time", () => {
    expect(() =>
      buildReportSnapshotDraft({ ...fixtures(), generatedAt: "not-a-date" }),
    ).toThrow(RangeError);
  });

  it("produces a draft that passes the report guard", () => {
    const draft = buildReportSnapshotDraft({
      ...fixtures(),
      generatedAt: GENERATED_AT,
    });

    expect(isReportSnapshotDraft(draft)).toBe(true);
    expect(isReportSnapshotDraft({ ...draft, dataClasses: ["simulated"] })).toBe(false);
    expect(isReportSnapshotDraft({ ...draft, checkInId: "other" })).toBe(false);
  });
});
