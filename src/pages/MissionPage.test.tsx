import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { renderWithProviders } from "@/test/render";

describe("MissionPage", () => {
  it("renders the simulated monitor with a paused clock and no operational claims", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: "/mission" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Mission" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Mission · Astatine");

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Simulated live mission monitor",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/not a live feed, not flight data/)).toBeInTheDocument();
    expect(screen.getByText(/No live feed · No sensors/i)).toBeInTheDocument();

    expect(screen.getByText(/Active phase · Science block/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Mission progress" })).toHaveAttribute(
      "aria-valuenow",
      "42",
    );

    const telemetry = screen.getByRole("list", {
      name: "Synthetic telemetry snapshot",
    });
    expect(within(telemetry).getAllByRole("listitem")).toHaveLength(3);
    expect(within(telemetry).getByText("Heart rate")).toBeInTheDocument();
    expect(within(telemetry).getByText("Respiratory rate")).toBeInTheDocument();
    expect(within(telemetry).getByText("Skin temperature")).toBeInTheDocument();
    expect(screen.getByText(/Not sensor data/)).toBeInTheDocument();

    const phases = screen.getByRole("list", { name: "Simulated mission phases" });
    expect(within(phases).getAllByRole("listitem")).toHaveLength(5);
    expect(
      within(phases).getByRole("heading", { level: 4, name: "Science block" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pause simulation" }));
    expect(screen.getByRole("button", { name: "Resume simulation" })).toBeInTheDocument();
    expect(screen.getByText(/Simulation paused/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Resume simulation" }));
    expect(screen.getByRole("button", { name: "Pause simulation" })).toBeInTheDocument();
  });
});
