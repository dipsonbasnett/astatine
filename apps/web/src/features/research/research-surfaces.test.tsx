import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AppRoutes } from "@/app/AppRoutes";
import { renderWithProviders } from "@/test/render";

describe("research context across product surfaces", () => {
  it.each([
    ["/readiness", "Recovery readiness"],
    ["/brief", "Mission health brief"],
    ["/crew", "Crew readiness"],
  ])("shows the reviewed OSD-942 insight on %s", async (route, title) => {
    renderWithProviders(<AppRoutes />, { route });

    expect(
      await screen.findByRole("heading", { level: 1, name: title }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { level: 2, name: "Research context" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 3,
        name: "Exercise training attenuated mitochondrial gene downregulation during long-duration bed rest",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Moderate confidence")).toBeInTheDocument();
    expect(screen.getByText(/not personalized medical advice/)).toBeInTheDocument();
    expect(
      screen.getByText(/Small randomized groups of 7, 7, and 8/),
    ).toBeInTheDocument();

    const sourceLink = screen.getByRole("link", {
      name: /Open source: NASA Open Science Data Repository \(OSDR\)/,
    });
    expect(sourceLink).toHaveAttribute(
      "href",
      "https://osdr.nasa.gov/bio/repo/data/studies/OSD-942",
    );
    expect(
      screen.getByRole("link", { name: /Open the Research center/ }),
    ).toHaveAttribute("href", "/research");
  });
});
