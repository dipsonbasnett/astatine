import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { createCheckIn } from "@/features/checkin/checkin-repository";
import { renderWithProviders } from "@/test/render";
import type { CheckInDraft } from "@/types/health";

function lowRecoveryDraft(): CheckInDraft {
  return {
    observedAt: new Date().toISOString(),
    sleepHours: 5,
    sleepQuality: 2,
    fatigue: 5,
    mood: 3,
    soreness: 2,
    stress: 3,
    hydration: 1,
    workload: 5,
    exercisePlannedMinutes: 30,
    exerciseCompletedMinutes: 0,
    hydrationEntries: 1,
    nutritionEntries: 1,
  };
}

describe("ReadinessPage", () => {
  it("shows an honest empty state with window controls and related surfaces", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: "/readiness" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Recovery readiness" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Recovery readiness · Astatine");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "No check-in in the 7-day window",
      }),
    ).toBeInTheDocument();

    const related = screen.getByRole("navigation", { name: "Related surfaces" });
    for (const label of ["Check-in", "Vitals", "Mission", "Reports"]) {
      expect(
        within(related).getByRole("link", { name: new RegExp(label) }),
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

  it("renders recorded readiness, the labeled simulation, and the coach", async () => {
    await createCheckIn(lowRecoveryDraft());
    renderWithProviders(<AppRoutes />, { route: "/readiness" });

    await screen.findByRole("heading", { level: 1, name: "Recovery readiness" });
    expect(await screen.findByText("Rest and recover")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Recorded readiness" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Countermeasure coach" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Simulated recovery trend" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Not used in readiness")).toBeInTheDocument();

    const trend = screen.getByRole("list", {
      name: "Simulated daily recovery values",
    });
    expect(within(trend).getAllByRole("listitem")).toHaveLength(7);

    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "14 days" }));

    expect(screen.getByRole("button", { name: "14 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const coach = screen
      .getByRole("heading", { level: 2, name: "Countermeasure coach" })
      .closest("section");
    if (!coach) throw new Error("Expected the coach section.");
    expect(await within(coach).findByText("14-day window")).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("list", { name: "Simulated daily recovery values" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(14);
  });
});
