import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

async function recordThreeCheckIns(page: Page) {
  await page.goto("/check-in");
  await expect(page.getByRole("heading", { level: 1, name: "Check-in" })).toBeVisible();

  await page.getByLabel("Sleep duration (hours)").fill("6");
  await page.getByLabel("Fatigue").selectOption("4");
  await page.getByLabel("Workload").selectOption("5");
  await page.getByLabel("Planned exercise (minutes)").fill("30");
  await page.getByLabel("Completed exercise (minutes)").fill("20");
  await page.getByLabel("Hydration log entries").fill("3");
  await page.getByLabel("Nutrition log entries").fill("2");

  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("button", { name: "Save check-in" }).click();
    await expect(page.getByRole("button", { name: "Save check-in" })).toBeEnabled();
  }
  await expect(page.getByText("Check-in saved in this browser")).toBeVisible();
}

test.describe("crew readiness", () => {
  test("stays honest and inside the viewport without recorded data", async ({ page }) => {
    await page.goto("/crew");

    await expect(
      page.getByRole("heading", { level: 1, name: "Crew readiness" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "No check-in in the 7-day window",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(/This build stores one local profile and has no crew roster/),
    ).toBeVisible();
    await expect(page.getByText(/No free-text notes are stored/)).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "One local profile, pooled recorded aggregates",
      }),
    ).toHaveCount(0);

    const related = page.getByRole("navigation", {
      name: "Individual and mission surfaces",
    });
    for (const label of ["Check-in", "Readiness", "Mission", "Brief", "Reports"]) {
      await expect(
        related.getByRole("link", { name: new RegExp(`^${label}`) }),
      ).toBeVisible();
    }

    await expectNoHorizontalOverflow(page);
  });

  test("aggregates local check-ins without exposing raw ratings or inventing a roster", async ({
    page,
  }) => {
    await recordThreeCheckIns(page);
    await page.goto("/crew");

    await expect(
      page.getByRole("heading", { level: 1, name: "Crew readiness" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: "One local profile, pooled recorded aggregates",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: "Local crew profile" }),
    ).toBeVisible();

    for (const label of [
      "Check-in completion",
      "Sleep regularity",
      "Exercise adherence",
      "Hydration logging",
      "Nutrition logging",
      "Workload and fatigue",
      "Recovery readiness band",
    ]) {
      await expect(
        page.getByRole("heading", { level: 3, name: label, exact: true }),
      ).toBeVisible();
    }

    await expect(
      page.getByRole("heading", {
        level: 3,
        name: "Workload and fatigue self-report is in the upper range",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 3, name: "How review items are derived" }),
    ).toBeVisible();
    await expect(
      page.getByText(/A workload and fatigue review item appears only when/),
    ).toBeVisible();
    await expect(page.getByText("Simulated · excluded", { exact: true })).toBeVisible();
    await expect(page.getByText("Research · excluded", { exact: true })).toBeVisible();
    await expect(page.getByText(/Every metric here is recorded/)).toBeVisible();
    await expect(page.getByText(/No free-text notes are stored/).first()).toBeVisible();
    await expect(page.getByText("Mood", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Soreness", { exact: true })).toHaveCount(0);
    await expect(page.getByText(/Very high/)).toHaveCount(0);
    await expect(page.getByText(/checkin-/)).toHaveCount(0);
    await expect(
      page.getByRole("heading", { level: 3, name: /Crew member|Teammate/ }),
    ).toHaveCount(0);

    const sevenDays = page.getByRole("button", { name: "7 days" });
    const fourteenDays = page.getByRole("button", { name: "14 days" });
    await expect(sevenDays).toHaveAttribute("aria-pressed", "true");

    await sevenDays.focus();
    await expect(sevenDays).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(fourteenDays).toBeFocused();
    const focusStyle = await fourteenDays.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth),
      };
    });
    expect(focusStyle.outlineStyle).not.toBe("none");
    expect(focusStyle.outlineWidth).toBeGreaterThan(0);

    await page.keyboard.press("Enter");
    await expect(fourteenDays).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("14-day window", { exact: true })).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolations(page);
  });
});
