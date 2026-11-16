import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { createCheckIn } from "@/features/checkin/checkin-repository";
import { renderWithProviders } from "@/test/render";
import type { CheckInDraft } from "@/types/health";

function draft(overrides: Partial<CheckInDraft> = {}): CheckInDraft {
  return {
    observedAt: new Date().toISOString(),
    sleepHours: 7.5,
    sleepQuality: 3,
    fatigue: 2,
    mood: 3,
    soreness: 2,
    stress: 2,
    hydration: 3,
    workload: 3,
    exercisePlannedMinutes: 30,
    exerciseCompletedMinutes: 25,
    hydrationEntries: 2,
    nutritionEntries: 3,
    ...overrides,
  };
}

describe("VitalsPage", () => {
  it("keeps recorded series empty while simulated and organ context stay available", async () => {
    renderWithProviders(<AppRoutes />, { route: "/vitals" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Vitals" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Vitals · Astatine");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("main")).toBeInTheDocument();

    expect(await screen.findByText("No recorded check-ins yet")).toBeInTheDocument();
    expect(
      screen.getByText(/Recorded series are empty and their gaps are shown honestly/),
    ).toBeInTheDocument();

    expect(screen.getByRole("tab", { name: "Heart rate" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByRole("img", { name: /Procedural heart illustration/ }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("tabpanel", { name: "Heart" })).getByText(
        "Simulated monitor",
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("carries a recorded check-in through the sleep view into organ context", async () => {
    await createCheckIn(draft());
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: "/vitals" });

    await screen.findByRole("heading", { level: 1, name: "Vitals" });
    expect(
      await screen.findByText(/1 recorded check-in in the selected window/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Sleep and recovery" }));
    const sleepPanel = screen.getByRole("tabpanel", { name: "Sleep and recovery" });
    expect(within(sleepPanel).getByText("7.5 h")).toBeInTheDocument();
    expect(
      within(sleepPanel).getByText(/Recorded on 1 of 7 days in this window/),
    ).toBeInTheDocument();
    expect(
      within(sleepPanel).getByText(/No simulated series is shown for this view/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Lungs" }));
    const organPanel = screen.getByRole("tabpanel", { name: "Lungs" });
    expect(
      within(organPanel).getByRole("img", { name: /Procedural lung illustration/ }),
    ).toBeInTheDocument();
    expect(within(organPanel).getByText("Simulated monitor")).toBeInTheDocument();
    expect(within(organPanel).getByText("Recorded context")).toBeInTheDocument();
    expect(within(organPanel).getByText("7.5 h")).toBeInTheDocument();
    expect(within(organPanel).getByText(/Newest recorded check-in/)).toBeInTheDocument();
  });

  it("applies the 7- and 14-day window to recorded values", async () => {
    await createCheckIn(draft({ observedAt: new Date().toISOString(), sleepHours: 7 }));
    await createCheckIn(
      draft({
        observedAt: new Date(Date.now() - 10 * 86_400_000).toISOString(),
        sleepHours: 6,
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: "/vitals" });

    expect(
      await screen.findByText(/1 recorded check-in in the selected window/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "14 days" }));
    expect(screen.getByRole("button", { name: "14 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      await screen.findByText(/2 recorded check-ins in the selected window/),
    ).toBeInTheDocument();
  });
});
