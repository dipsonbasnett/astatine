import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { renderWithProviders } from "@/test/render";

const routeCases = [
  {
    path: "/",
    heading: /Mission-ready health intelligence for human spaceflight/,
    title: "Astatine — Mission-ready health intelligence for human spaceflight",
  },
  { path: "/check-in", heading: "Check-in", title: "Check-in · Astatine" },
  {
    path: "/readiness",
    heading: "Recovery readiness",
    title: "Recovery readiness · Astatine",
  },
  { path: "/vitals", heading: "Vitals", title: "Vitals · Astatine" },
  { path: "/mission", heading: "Mission", title: "Mission · Astatine" },
  {
    path: "/brief",
    heading: "Mission health brief",
    title: "Mission health brief · Astatine",
  },
  { path: "/reports", heading: "Reports", title: "Reports · Astatine" },
  { path: "/research", heading: "Research", title: "Research · Astatine" },
  { path: "/settings", heading: "Settings", title: "Settings · Astatine" },
  {
    path: "/about",
    heading: "Precision, calm, and explicit boundaries",
    title: "About · Astatine",
  },
] as const;

describe("application routes", () => {
  it.each(routeCases)(
    "renders $path with one page heading and the correct title",
    async ({ path, heading, title }) => {
      renderWithProviders(<AppRoutes />, { route: path });

      expect(
        await screen.findByRole("heading", { level: 1, name: heading }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      expect(document.title).toBe(title);
    },
  );

  it("renders a clear not-found state for unknown paths", async () => {
    renderWithProviders(<AppRoutes />, { route: "/unknown-route" });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(document.title).toBe("Page not found · Astatine");
  });

  it("provides a skip link", async () => {
    renderWithProviders(<AppRoutes />, { route: "/" });

    await screen.findByRole("heading", { level: 1 });
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
  });

  it("focuses main content and resets scroll after a route change", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AppRoutes />, { route: "/" });

    await screen.findByRole("heading", {
      level: 1,
      name: /Mission-ready health intelligence/,
    });

    const primaryNavigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    await user.click(within(primaryNavigation).getByRole("link", { name: /Vitals/ }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Vitals" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveFocus();
    expect(vi.mocked(window.scrollTo)).toHaveBeenCalledWith(0, 0);
  });
});
