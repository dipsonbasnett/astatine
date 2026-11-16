import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";

import { buildMissionReport, type MissionReport } from "./mission-report-engine";
import { reportFilename, reportToJson, reportToMarkdown } from "./mission-report-export";

const NOW = "2026-11-16T12:00:00.000Z";
const NOW_MS = Date.parse(NOW);

function report(includePrivateNotes = false): MissionReport {
  const observedAt = new Date(NOW_MS - 24 * 3_600_000).toISOString();
  const built = buildMissionReport({
    checkIns: [
      makeCheckIn({
        id: "checkin-private-id",
        observedAt,
        createdAt: observedAt,
        updatedAt: observedAt,
        sleepHours: 6.5,
        sleepQuality: 3,
        fatigue: 4,
        mood: 3,
        soreness: 2,
        stress: 3,
        hydration: 3,
        workload: 4,
        exercisePlannedMinutes: 30,
        exerciseCompletedMinutes: 20,
        hydrationEntries: 3,
        nutritionEntries: 2,
      }),
    ],
    generatedAt: NOW,
    includePrivateNotes,
  });
  if (!built) throw new Error("Expected a report.");
  return built;
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

describe("mission report export", () => {
  it("writes a Markdown review with identity, labels, privacy, and disclaimer", () => {
    const source = report();
    const markdown = reportToMarkdown(source);

    expect(markdown).toContain(`# ${source.title}`);
    expect(markdown).toContain(`**Report ID:** ${source.id}`);
    expect(markdown).toContain(`**Generated:**`);
    expect(markdown).toContain(`(${source.generatedAt})`);
    expect(markdown).toContain("**Selected period:** Last 7 days");
    expect(markdown).toContain(`**Recorded check-ins:** ${source.checkInCount}`);
    expect(markdown).toContain("**Data class:** Recorded only");
    expect(markdown).toContain("| Recorded | Included |");
    expect(markdown).toContain("| Simulated demonstration | Excluded |");
    expect(markdown).toContain("| Research context | Excluded |");
    expect(markdown).toContain("## Executive summary");
    expect(markdown).toContain("## Recovery readiness");
    expect(markdown).toContain("### Contributing factors");
    expect(markdown).toContain("## Countermeasure adherence");
    expect(markdown).toContain("### Suggested focus areas");
    expect(markdown).toContain("## Mission health brief");
    expect(markdown).toContain("## Vitals trends");
    expect(markdown).toContain("## Data gaps");
    expect(markdown).toContain("## Non-diagnostic escalation");
    expect(markdown).toContain("## Disclaimer and limitations");
    expect(markdown).toContain("## Privacy notice");
    expect(markdown).toContain("**Private notes:** Excluded by default");
    expect(markdown).toContain(normalize(source.disclaimer));
    expect(markdown).toContain(normalize(source.privacyNotice));
    expect(markdown).not.toContain("## Private notes");
    expect(markdown.endsWith("\n")).toBe(true);
  });

  it("matches the visible report content in Markdown and JSON", () => {
    const source = report();
    const markdown = normalize(reportToMarkdown(source));

    const visibleContent = [
      source.executiveSummary,
      source.readiness.explanation,
      ...source.readiness.factors.map((factor) => factor.explanation),
      ...source.readiness.missingData,
      source.adherence.summary,
      source.adherence.basis,
      ...source.adherence.items.flatMap((item) => [
        item.currentStatus,
        item.suggestion,
        item.caution,
      ]),
      ...source.adherence.focus.flatMap((item) => [item.rationale, item.caution]),
      source.brief.headline,
      ...source.brief.observations.map((line) => line.value),
      ...source.brief.missingData,
      source.vitals.note,
      ...source.vitals.trends.map((trend) => trend.note),
      ...source.dataGaps,
      ...source.escalation,
      source.disclaimer,
      ...source.limits,
      source.privacyNotice,
      source.privateNotes.note,
    ];

    visibleContent.forEach((content) => {
      expect(markdown).toContain(normalize(content));
    });

    const json = JSON.parse(reportToJson(source)) as MissionReport;
    expect(json).toEqual(source);
    expect(reportToJson(source).endsWith("\n")).toBe(true);
    expect(reportToJson(source)).not.toContain("checkin-private-id");
  });

  it("requires explicit consent before adding a private-notes section", () => {
    const source = report(true);
    const markdown = reportToMarkdown(source);

    expect(markdown).toContain("**Private notes:** Included by explicit consent");
    expect(markdown).toContain("## Private notes");
    expect(markdown).toContain("Included by explicit consent: Yes");
    expect(markdown).toContain("No private note content is stored for this period.");
    expect(JSON.parse(reportToJson(source))).toMatchObject({
      privateNotes: { included: true, items: [] },
    });
  });

  it("uses a deterministic, lower-case filename per format", () => {
    const source = report();
    expect(reportFilename(source, "markdown")).toBe(
      "astatine-mission-report-ast-rpt-20261116t120000z-7d.md",
    );
    expect(reportFilename(source, "json")).toBe(
      "astatine-mission-report-ast-rpt-20261116t120000z-7d.json",
    );
  });
});
