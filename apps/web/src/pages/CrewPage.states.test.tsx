import { screen } from "@testing-library/react";
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

describe("CrewPage loading and error states", () => {
  it("shows a busy skeleton while recorded data loads", async () => {
    state.current = { records: [], loading: true, error: null };

    const { container } = renderWithProviders(<AppRoutes />, { route: "/crew" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Crew readiness" }),
    ).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(
      screen.getByText(/This build stores one local profile and has no crew roster/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "No check-in in the 7-day window",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "One local profile, pooled recorded aggregates",
      }),
    ).not.toBeInTheDocument();
  });

  it("reports a storage error without estimating crew values", async () => {
    state.current = {
      records: [],
      loading: false,
      error: "Browser storage is unavailable.",
    };

    renderWithProviders(<AppRoutes />, { route: "/crew" });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Crew overview unavailable");
    expect(alert).toHaveTextContent("Browser storage is unavailable.");
    expect(alert).toHaveTextContent(
      /No crew value is estimated or filled from another data class/,
    );
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "No check-in in the 7-day window",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "One local profile, pooled recorded aggregates",
      }),
    ).not.toBeInTheDocument();
  });
});
