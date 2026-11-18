import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { renderWithProviders } from "@/test/render";
import type { CheckInRecord } from "@/types/health";

const state = vi.hoisted(() => ({
  current: {
    records: [] as CheckInRecord[],
    loading: false,
    error: null as string | null,
  },
}));

vi.mock("@/features/checkin/use-checkins", () => ({
  useCheckIns: () => state.current,
}));

describe("VitalsPage loading and error states", () => {
  it("shows a busy skeleton while recorded data loads", async () => {
    state.current = { records: [], loading: true, error: null };

    const { container } = renderWithProviders(<AppRoutes />, { route: "/vitals" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Vitals" }),
    ).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText("No recorded check-ins yet")).not.toBeInTheDocument();
  });

  it("reports a storage error without hiding simulation or organs", async () => {
    state.current = {
      records: [],
      loading: false,
      error: "Browser storage is unavailable.",
    };

    renderWithProviders(<AppRoutes />, { route: "/vitals" });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Recorded vitals unavailable");
    expect(alert).toHaveTextContent("Browser storage is unavailable.");
    expect(alert).toHaveTextContent(
      /Recorded values stay empty rather than being estimated/,
    );
    expect(
      screen.getByRole("img", { name: /Procedural heart illustration/ }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("tabpanel", { name: "Heart" })).getByText(
        "Simulated monitor",
      ),
    ).toBeInTheDocument();
  });
});
