import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { makeCheckIn } from "@/test/fixtures";
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

describe("ReportsPage loading, empty, and error states", () => {
  it("shows a busy skeleton while recorded check-ins load", async () => {
    state.current = { records: [], loading: true, error: null };

    const { container } = renderWithProviders(<AppRoutes />, { route: "/reports" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Reports" }),
    ).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "No check-in in the 7-day window",
      }),
    ).not.toBeInTheDocument();
  });

  it("reports a storage error without building a partial report", async () => {
    state.current = {
      records: [],
      loading: false,
      error: "Browser storage is unavailable.",
    };

    renderWithProviders(<AppRoutes />, { route: "/reports" });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Recorded check-ins unavailable");
    expect(alert).toHaveTextContent("Browser storage is unavailable.");
    expect(
      screen.queryByRole("checkbox", { name: /Include private notes/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        level: 2,
        name: "No check-in in the 7-day window",
      }),
    ).not.toBeInTheDocument();
  });

  it("defaults private notes off and rebuilds an empty report for another period", async () => {
    state.current = { records: [], loading: false, error: null };
    const user = userEvent.setup();

    renderWithProviders(<AppRoutes />, { route: "/reports" });

    const privateNotes = await screen.findByRole("checkbox", {
      name: /Include private notes/,
    });
    expect(privateNotes).not.toBeChecked();
    expect(screen.getByRole("button", { name: "7 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "14 days" }));
    expect(screen.getByRole("button", { name: "14 days" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "No check-in in the 14-day window",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Record a check-in" })).toHaveAttribute(
      "href",
      "/check-in",
    );
  });

  it("explains when recorded check-ins fall outside the selected period", async () => {
    const observedAt = new Date(Date.now() - 30 * 24 * 3_600_000).toISOString();
    state.current = {
      records: [
        makeCheckIn({
          id: "checkin-outside",
          observedAt,
          createdAt: observedAt,
          updatedAt: observedAt,
        }),
      ],
      loading: false,
      error: null,
    };

    renderWithProviders(<AppRoutes />, { route: "/reports" });

    expect(
      await screen.findByRole("heading", {
        level: 2,
        name: "No check-in in the 7-day window",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The recorded check-ins are outside the selected period/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("article", {
        name: "Astatine recorded mission-health review",
      }),
    ).not.toBeInTheDocument();
  });
});
