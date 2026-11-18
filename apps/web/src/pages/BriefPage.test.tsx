import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { createCheckIn } from "@/features/checkin/checkin-repository";
import { renderWithProviders } from "@/test/render";
import type { CheckInDraft } from "@/types/health";

function currentDraft(): CheckInDraft {
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

describe("BriefPage", () => {
  it("shows an honest empty state instead of filling the brief", async () => {
    renderWithProviders(<AppRoutes />, { route: "/brief" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mission health brief" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Mission health brief · Astatine");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "No check-in in the 7-day window",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Record a check-in" })).toHaveAttribute(
      "href",
      "/check-in",
    );
  });

  it("renders a recorded brief with limits and copies it locally", async () => {
    await createCheckIn(currentDraft());
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    try {
      renderWithProviders(<AppRoutes />, { route: "/brief" });

      expect(
        await screen.findByRole("heading", { level: 1, name: "Mission health brief" }),
      ).toBeInTheDocument();
      expect(await screen.findByText("Rest and recover band")).toBeInTheDocument();
      expect(screen.getAllByText("Recorded only").length).toBeGreaterThan(0);

      for (const heading of [
        "Readiness band",
        "Scored factors",
        "Latest self-report",
        "Suggested focus",
        "Missing data",
        "What this brief is not",
      ]) {
        expect(
          screen.getByRole("heading", { level: 3, name: heading }),
        ).toBeInTheDocument();
      }

      const scored = screen.getByRole("region", { name: "Scored readiness factors" });
      expect(
        within(scored).getByRole("rowheader", { name: "Workload and fatigue" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("region", { name: "Context readiness factors" }),
      ).toBeInTheDocument();

      expect(
        screen.getByText(/not a medical record, clinical assessment/),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Copy brief as text" }));

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText.mock.calls[0]?.[0]).toContain("Astatine mission health brief");
      expect(
        await screen.findByText(
          "Copied to this device's clipboard. Astatine did not send it anywhere.",
        ),
      ).toBeInTheDocument();
    } finally {
      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        configurable: true,
      });
    }
  });
});
