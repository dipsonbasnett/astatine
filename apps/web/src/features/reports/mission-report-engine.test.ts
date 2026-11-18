import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";

import {
  REPORT_FORMAT,
  REPORT_TITLE,
  REPORT_VERSION,
  buildMissionReport,
  formatReportPeriod,
  reportIdFor,
} from "./mission-report-engine";

const NOW = "2026-11-16T12:00:00.000Z";
const NOW_MS = Date.parse(NOW);

function checkInDaysAgo(daysAgo: number, id: string) {
  const observedAt = new Date(NOW_MS - daysAgo * 24 * 3_600_000).toISOString();
  return makeCheckIn({
    id,
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
  });
}

describe("mission report engine", () => {
  it("builds a recorded-only report with stable identity and selected period", () => {
    const report = buildMissionReport({
      checkIns: [checkInDaysAgo(1, "checkin-recent"), checkInDaysAgo(3, "checkin-older")],
      generatedAt: NOW,
    });

    expect(report).not.toBeNull();
    if (!report) throw new Error("Expected a report.");

    expect(report.format).toBe(REPORT_FORMAT);
    expect(report.version).toBe(REPORT_VERSION);
    expect(report.id).toBe("AST-RPT-20261116T120000Z-7D");
    expect(report.title).toBe(REPORT_TITLE);
    expect(report.generatedAt).toBe(NOW);
    expect(report.windowDays).toBe(7);
    expect(report.periodStart).toBe("2026-11-09T12:00:00.000Z");
    expect(report.periodEnd).toBe(NOW);
    expect(report.checkInCount).toBe(2);
    expect(report.dataClasses).toEqual(["recorded"]);
    expect(report.excludedDataClasses).toEqual(["simulated", "research"]);
    expect(report.sourceSummary).toEqual([
      expect.objectContaining({ category: "recorded", status: "included" }),
      expect.objectContaining({ category: "simulated", status: "excluded" }),
      expect.objectContaining({ category: "research", status: "excluded" }),
    ]);
    expect(formatReportPeriod(7, report.periodStart, report.periodEnd)).toContain(
      "Last 7 days",
    );
    expect(report.executiveSummary).toContain("2 recorded check-ins");
    expect(report.executiveSummary).toContain("simulated demonstration");
    expect(report.executiveSummary).toContain("research context are excluded");
    expect(report.escalation.length).toBeGreaterThan(0);
    expect(report.disclaimer).toContain("not a medical record");
    expect(report.privacyNotice).toContain("did not upload it");
  });

  it("keeps simulated device views and research context out of the report", () => {
    const report = buildMissionReport({
      checkIns: [checkInDaysAgo(1, "checkin-recent")],
      generatedAt: NOW,
    });
    if (!report) throw new Error("Expected a report.");

    expect(report.vitals.trends.length).toBeGreaterThan(0);
    expect(
      report.vitals.trends.every((trend) =>
        ["sleepRecovery", "activity", "hydration", "nutrition"].includes(trend.id),
      ),
    ).toBe(true);
    expect(
      report.vitals.trends.some((trend) =>
        ["heartRate", "spo2", "bloodPressure"].includes(trend.id),
      ),
    ).toBe(false);
    expect(
      report.vitals.trends.every((trend) => trend.sourceLabel.includes("Recorded")),
    ).toBe(true);
    expect(report.dataGaps.join(" ")).toContain(
      "Heart rate, oxygen saturation, and blood-pressure-style values are not recorded",
    );
    expect(report.dataGaps.join(" ")).toContain(
      "No free-text private notes are stored in this build.",
    );
    expect(report.limits).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "Simulated demonstration and research context are excluded",
        ),
      ]),
    );
  });

  it("excludes private notes by default and never fabricates note content", () => {
    const excluded = buildMissionReport({
      checkIns: [checkInDaysAgo(1, "checkin-recent")],
      generatedAt: NOW,
    });
    if (!excluded) throw new Error("Expected a report.");
    expect(excluded.privateNotes).toEqual({
      included: false,
      items: [],
      note: expect.stringContaining("stays off by default"),
    });

    const included = buildMissionReport({
      checkIns: [checkInDaysAgo(1, "checkin-recent")],
      generatedAt: NOW,
      includePrivateNotes: true,
    });
    if (!included) throw new Error("Expected an opted-in report.");
    expect(included.privateNotes.included).toBe(true);
    expect(included.privateNotes.items).toEqual([]);
    expect(included.privateNotes.note).toContain("explicit consent");
    expect(included.privateNotes.note).toContain("no note content");
    expect(included.id).toBe(excluded.id);
  });

  it("honors the 14-day window and returns null when no check-in is in range", () => {
    const report = buildMissionReport({
      checkIns: [
        checkInDaysAgo(1, "checkin-recent"),
        checkInDaysAgo(10, "checkin-ten-days"),
      ],
      generatedAt: NOW,
      windowDays: 14,
    });
    if (!report) throw new Error("Expected a report.");
    expect(report.windowDays).toBe(14);
    expect(report.checkInCount).toBe(2);
    expect(report.id).toBe("AST-RPT-20261116T120000Z-14D");

    const sevenDay = buildMissionReport({
      checkIns: [checkInDaysAgo(10, "checkin-ten-days")],
      generatedAt: NOW,
    });
    expect(sevenDay).toBeNull();

    expect(
      buildMissionReport({
        checkIns: [],
        generatedAt: NOW,
      }),
    ).toBeNull();
  });

  it("rejects an invalid generation timestamp", () => {
    expect(() =>
      buildMissionReport({
        checkIns: [checkInDaysAgo(1, "checkin-recent")],
        generatedAt: "no",
      }),
    ).toThrow(RangeError);
    expect(() => reportIdFor("no", 7)).toThrow(RangeError);
  });
});
