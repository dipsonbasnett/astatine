import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  {
    path: "/",
    heading: "Dashboard for HMC",
    title: "Dashboard for HMC · Astatine",
  },
  {
    path: "/check-in",
    heading: "Check-in",
    title: "Check-in · Astatine",
  },
  {
    path: "/readiness",
    heading: "Recovery readiness",
    title: "Recovery readiness · Astatine",
  },
  {
    path: "/crew",
    heading: "Crew readiness",
    title: "Crew readiness · Astatine",
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
  { path: "/profile", heading: "Profile", title: "Profile · Astatine" },
  {
    path: "/about",
    heading: "Precision, calm, and explicit boundaries",
    title: "About · Astatine",
  },
] as const;

const notFoundRoute = {
  path: "/not-a-route",
  heading: "Page not found",
  title: "Page not found · Astatine",
} as const;

test.describe("route integrity", () => {
  for (const route of routes) {
    test(`${route.path} renders at 390px without horizontal overflow`, async ({
      page,
    }) => {
      await page.goto(route.path);

      await expect(
        page.getByRole("heading", { level: 1, name: route.heading }),
      ).toBeVisible();
      await expect(page).toHaveTitle(route.title);
      await expect(page.getByRole("main")).toBeVisible();

      const widths = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1);
    });
  }

  test("unknown routes render the not-found surface", async ({ page }) => {
    await page.goto(notFoundRoute.path);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: notFoundRoute.heading,
      }),
    ).toBeVisible();
    await expect(page).toHaveTitle(notFoundRoute.title);
  });
});

test("axe finds no WCAG A/AA violations on any route", async ({ page }) => {
  const allRoutes = [...routes, notFoundRoute];

  for (const route of allRoutes) {
    await page.goto(route.path);
    await expect(
      page.getByRole("heading", { level: 1, name: route.heading }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();

    const violations = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      targets: violation.nodes.map((node) => node.target),
    }));

    expect(
      violations,
      `${route.path} accessibility violations: ${JSON.stringify(violations)}`,
    ).toEqual([]);
  }
});
