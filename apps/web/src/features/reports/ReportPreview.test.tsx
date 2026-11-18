import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { makeCheckIn } from "@/test/fixtures";

import { buildMissionReport, type MissionReport } from "./mission-report-engine";
import { ReportPreview } from "./ReportPreview";

const NOW = "2026-11-16T12:00:00.000Z";
const NOW_MS = Date.parse(NOW);

function makeReport(includePrivateNotes = false): MissionReport {
  const observedAt = new Date(NOW_MS - 24 * 3_600_000).toISOString();
  const built = buildMissionReport({
    checkIns: [
      makeCheckIn({
        id: "checkin-preview",
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

describe("ReportPreview", () => {
  it("labels the recorded review and keeps excluded sources visible", () => {
    const source = makeReport();
    const { container } = render(<ReportPreview report={source} />);

    const article = screen.getByRole("article", { name: source.title });
    expect(
      within(article).getByRole("heading", { level: 2, name: source.title }),
    ).toBeInTheDocument();
    expect(within(article).getByText(source.id)).toBeInTheDocument();
    expect(within(article).getAllByText("Recorded only").length).toBeGreaterThan(0);
    expect(within(article).getByText("Not clinical")).toBeInTheDocument();
    expect(within(article).getByText("Simulated demonstration")).toBeInTheDocument();
    expect(within(article).getByText("Research context")).toBeInTheDocument();
    expect(within(article).getAllByText("Excluded")).toHaveLength(2);

    for (const heading of [
      "Data sources",
      "Executive summary",
      "Recovery readiness",
      "Countermeasure adherence",
      "Mission health brief",
      "Vitals trends",
      "Data gaps",
      "Non-diagnostic escalation",
      "Disclaimer and limitations",
      "Privacy notice",
    ]) {
      expect(
        within(article).getByRole("heading", { level: 3, name: heading }),
      ).toBeInTheDocument();
    }

    expect(
      within(article).getByText(/Private notes: excluded by default/),
    ).toBeInTheDocument();
    expect(
      within(article).queryByText(/No private note content is stored/),
    ).not.toBeInTheDocument();
    expect(within(article).getByText(source.disclaimer)).toBeInTheDocument();
    expect(within(article).getByText(source.privacyNotice)).toBeInTheDocument();

    const ids = Array.from(container.querySelectorAll("[id]")).map(
      (element) => element.id,
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("exposes named, focusable table regions for wide report data", () => {
    const source = makeReport();
    render(<ReportPreview report={source} />);

    const factors = screen.getByRole("region", { name: "Report readiness factors" });
    const latest = screen.getByRole("region", { name: "Report latest self-report" });
    expect(factors).toHaveAttribute("tabindex", "0");
    expect(latest).toHaveAttribute("tabindex", "0");
    expect(
      within(factors).getByRole("table", { name: "Recorded readiness factors" }),
    ).toBeInTheDocument();
    expect(
      within(latest).getByRole("table", { name: "Latest recorded self-report" }),
    ).toBeInTheDocument();
  });

  it("adds a no-content private-notes statement only after explicit consent", () => {
    const source = makeReport(true);
    render(<ReportPreview report={source} />);

    expect(
      screen.getByText(/Private notes: included by explicit consent/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No private note content is stored for this period."),
    ).toBeInTheDocument();
  });
});
