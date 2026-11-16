import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { createCheckIn } from "@/features/checkin/checkin-repository";
import { PREFERENCES_STORAGE_KEY } from "@/preferences/preferences";
import { renderWithProviders } from "@/test/render";
import type { CheckInDraft } from "@/types/health";

function recentDraft(daysAgo: number, sleepHours: number): CheckInDraft {
  return {
    observedAt: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    sleepHours,
    sleepQuality: 3,
    fatigue: 4,
    mood: 3,
    soreness: 2,
    stress: 3,
    hydration: 3,
    workload: 5,
    exercisePlannedMinutes: 30,
    exerciseCompletedMinutes: 20,
    hydrationEntries: 3,
    nutritionEntries: 2,
  };
}

describe("CrewPage", () => {
  it("shows an honest empty state with window controls, privacy copy, and related surfaces", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: "/crew" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Crew readiness" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Crew readiness · Astatine");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "No check-in in the 7-day window",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This build stores one local profile and has no crew roster/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /simulated telemetry, the simulated recovery trend, and research context never fill a crew value/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "One local profile, pooled recorded aggregates",
      }),
    ).not.toBeInTheDocument();

    const related = screen.getByRole("navigation", {
      name: "Individual and mission surfaces",
    });
    for (const label of ["Check-in", "Readiness", "Mission", "Brief", "Reports"]) {
      expect(
        within(related).getByRole("link", { name: new RegExp(`^${label}`) }),
      ).toBeInTheDocument();
    }

    await user.click(screen.getByRole("button", { name: "14 days" }));
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "No check-in in the 14-day window",
      }),
    ).toBeInTheDocument();
  });

  it("aggregates multiple recorded check-ins into a privacy-conscious crew overview", async () => {
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify({ callsign: "CDR Vega", motion: "system" }),
    );

    await createCheckIn(recentDraft(0, 6));
    await createCheckIn(recentDraft(1, 7.5));
    await createCheckIn(recentDraft(2, 8.5));

    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: "/crew" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Crew readiness" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "One local profile, pooled recorded aggregates",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "CDR Vega" }),
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

    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Workload and fatigue self-report is in the upper range",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Simulated · excluded")).toBeInTheDocument();
    expect(screen.getByText("Research · excluded")).toBeInTheDocument();
    expect(screen.getAllByText(/No free-text notes are stored/).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText("Mood")).not.toBeInTheDocument();
    expect(screen.queryByText("Soreness")).not.toBeInTheDocument();
    expect(screen.queryByText(/Crew member \d/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "14 days" }));
    expect(screen.getByRole("button", { name: "14 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(await screen.findByText("14-day window", { exact: true })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "CDR Vega" }),
    ).toBeInTheDocument();
  });
});
