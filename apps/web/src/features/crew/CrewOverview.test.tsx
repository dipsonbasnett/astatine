import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";
import { makeCheckIn } from "@/test/fixtures";
import type { CheckInRecord } from "@/types/health";

import { CrewOverview } from "./CrewOverview";
import { buildCrewReadinessSnapshot } from "./crew-engine";

const now = new Date("2026-11-16T12:00:00.000Z");

const populatedCheckIns: CheckInRecord[] = [
  makeCheckIn({
    id: "private-checkin-id-1",
    observedAt: "2026-11-16T08:00:00.000Z",
    sleepHours: 6,
    fatigue: 4,
    workload: 5,
    exercisePlannedMinutes: 30,
    exerciseCompletedMinutes: 30,
    hydrationEntries: 3,
    nutritionEntries: 2,
  }),
  makeCheckIn({
    id: "private-checkin-id-2",
    observedAt: "2026-11-15T08:00:00.000Z",
    sleepHours: 8,
    fatigue: 4,
    workload: 4,
    exercisePlannedMinutes: 40,
    exerciseCompletedMinutes: 20,
    hydrationEntries: 2,
    nutritionEntries: 1,
  }),
  makeCheckIn({
    id: "private-checkin-id-3",
    observedAt: "2026-11-14T08:00:00.000Z",
    sleepHours: 9,
    fatigue: 5,
    workload: 4,
    exercisePlannedMinutes: 20,
    exerciseCompletedMinutes: 10,
    hydrationEntries: 1,
    nutritionEntries: 0,
  }),
];

function buildSnapshot(checkIns: CheckInRecord[]) {
  const snapshot = buildCrewReadinessSnapshot({
    checkIns,
    displayName: "CDR Vega",
    now,
    windowDays: 7,
  });
  if (!snapshot) throw new Error("Expected a crew snapshot.");
  return snapshot;
}

describe("CrewOverview", () => {
  it("summarizes pooled recorded data with an explicit source on every metric", () => {
    const snapshot = buildSnapshot(populatedCheckIns);
    const { container } = renderWithProviders(<CrewOverview snapshot={snapshot} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "CDR Vega" }),
    ).toBeInTheDocument();

    const summary = screen.getByRole("region", {
      name: "One local profile, pooled recorded aggregates",
    });
    expect(within(summary).getByText("3 of 7")).toBeInTheDocument();
    expect(within(summary).getByText("3")).toBeInTheDocument();
    expect(
      within(summary).getByText(/There is no roster, account system, synchronization/),
    ).toBeInTheDocument();

    const metrics = screen.getByRole("region", {
      name: "Transparent window summaries",
    });
    for (const label of [
      "Check-in completion",
      "Sleep regularity",
      "Exercise adherence",
      "Hydration logging",
      "Nutrition logging",
      "Workload and fatigue",
      "Recovery readiness band",
    ]) {
      expect(
        within(metrics).getByRole("heading", { level: 3, name: label }),
      ).toBeInTheDocument();
    }
    expect(within(metrics).getAllByRole("heading", { level: 3 })).toHaveLength(7);

    const completion = within(metrics)
      .getByRole("heading", { level: 3, name: "Check-in completion" })
      .closest("article");
    if (!completion) throw new Error("Expected a completion metric card.");
    expect(within(completion).getByText("3 of 7 days")).toBeInTheDocument();
    expect(within(completion).getByText("Partial data")).toBeInTheDocument();
    expect(within(completion).getByText("Recorded · check-in dates")).toBeInTheDocument();

    const exercise = within(metrics)
      .getByRole("heading", { level: 3, name: "Exercise adherence" })
      .closest("article");
    if (!exercise) throw new Error("Expected an exercise metric card.");
    expect(within(exercise).getByText("67% of planned minutes")).toBeInTheDocument();
    expect(
      within(exercise).getByText("Recorded · paired exercise entries"),
    ).toBeInTheDocument();

    const workload = within(metrics)
      .getByRole("heading", { level: 3, name: "Workload and fatigue" })
      .closest("article");
    if (!workload) throw new Error("Expected a workload metric card.");
    expect(
      within(workload).getByText("Fatigue 4.3/5 · workload 4.3/5"),
    ).toBeInTheDocument();
    expect(
      within(workload).getByText(
        /Fatigue self-report was lower at the latest recorded check-in/,
      ),
    ).toBeInTheDocument();
    expect(
      within(workload).getByText(
        /Workload self-report was higher at the latest recorded check-in/,
      ),
    ).toBeInTheDocument();
    expect(
      within(workload).getByText("Recorded · self-report scales"),
    ).toBeInTheDocument();

    const gaps = screen.getByRole("region", { name: "Data gaps" });
    expect(within(gaps).getByText("Recorded days cover 3 of 7")).toBeInTheDocument();
    expect(
      within(gaps).getByText("Exercise adherence covers part of the window"),
    ).toBeInTheDocument();
    expect(
      within(gaps).getByText("Hydration logging covers part of the window"),
    ).toBeInTheDocument();
    expect(
      within(gaps).getByText("Nutrition logging covers part of the window"),
    ).toBeInTheDocument();

    const alerts = screen.getByRole("region", { name: "Active alerts" });
    expect(
      within(alerts).getByRole("heading", {
        level: 3,
        name: "Workload and fatigue self-report is in the upper range",
      }),
    ).toBeInTheDocument();
    expect(
      within(alerts).getByText(/not a medical alert, urgency rating/),
    ).toBeInTheDocument();

    const rules = within(alerts)
      .getByRole("heading", { level: 3, name: "How review items are derived" })
      .closest("div");
    if (!rules) throw new Error("Expected the alert-rule panel.");
    expect(within(rules).getByRole("list")).toBeInTheDocument();
    expect(within(rules).getAllByRole("listitem")).toHaveLength(4);

    const sources = screen.getByRole("region", { name: "Sources on this page" });
    expect(within(sources).getByText("Recorded · used")).toBeInTheDocument();
    expect(within(sources).getByText("Simulated · excluded")).toBeInTheDocument();
    expect(within(sources).getByText("Research · excluded")).toBeInTheDocument();

    expect(screen.getByText("What this crew overview is not")).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(
      /private-checkin-id|sleepQuality|soreness|observedAt/,
    );
    expect(screen.queryByText("Mood")).not.toBeInTheDocument();
    expect(screen.queryByText("Soreness")).not.toBeInTheDocument();
  });

  it("shows missing data honestly and keeps the review list empty", () => {
    const snapshot = buildSnapshot([
      makeCheckIn({
        id: "private-checkin-id-9",
        observedAt: "2026-11-16T08:00:00.000Z",
      }),
    ]);
    renderWithProviders(<CrewOverview snapshot={snapshot} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "CDR Vega" }),
    ).toBeInTheDocument();

    const alerts = screen.getByRole("region", { name: "Active alerts" });
    expect(within(alerts).getByText(/No active review item appears/)).toBeInTheDocument();
    expect(within(alerts).getByText("0 review items")).toBeInTheDocument();
    expect(
      within(alerts).queryByRole("heading", {
        level: 3,
        name: "Workload and fatigue self-report is in the upper range",
      }),
    ).not.toBeInTheDocument();

    const metrics = screen.getByRole("region", {
      name: "Transparent window summaries",
    });
    const sleep = within(metrics)
      .getByRole("heading", { level: 3, name: "Sleep regularity" })
      .closest("article");
    if (!sleep) throw new Error("Expected a sleep metric card.");
    expect(within(sleep).getByText("Missing data")).toBeInTheDocument();
    expect(within(sleep).getByText("Needs at least three check-ins")).toBeInTheDocument();

    const gaps = screen.getByRole("region", { name: "Data gaps" });
    expect(within(gaps).getByText("Hydration logging is missing")).toBeInTheDocument();
    expect(within(gaps).getByText("Nutrition logging is missing")).toBeInTheDocument();
    expect(within(gaps).getByText("Workload self-report is missing")).toBeInTheDocument();
    expect(
      within(gaps).getByText("Exercise adherence is not available"),
    ).toBeInTheDocument();
  });

  it("uses named landmarks and a heading hierarchy below the page heading", () => {
    const snapshot = buildSnapshot(populatedCheckIns);
    renderWithProviders(<CrewOverview snapshot={snapshot} />);

    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(5);
    expect(screen.getAllByRole("region")).toHaveLength(5);
    expect(screen.getByRole("region", { name: "Active alerts" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Data gaps" })).toBeInTheDocument();
  });
});
