import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  expect(results.violations).toEqual([]);
}

test("records a check-in, creates a snapshot, simulates telemetry, and deletes local data", async ({
  page,
}) => {
  await page.goto("/check-in");
  await expect(page.getByRole("heading", { level: 1, name: "Check-in" })).toBeVisible();

  await page.getByLabel("Fatigue").selectOption("5");
  await page.getByLabel("Workload").selectOption("5");
  await page.getByRole("button", { name: "Save check-in" }).click();
  await expect(page.getByText("Check-in saved in this browser")).toBeVisible();

  await page.getByRole("link", { name: "Create a local report snapshot" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Reports" })).toBeVisible();

  await page.getByRole("button", { name: "Create report snapshot" }).click();
  await expect(page.getByText("Snapshot saved", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Snapshot readiness" }),
  ).toBeVisible();
  await expect(
    page.getByRole("meter", { name: "Workload and fatigue rubric score" }),
  ).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByText("Rest and recover", { exact: true })).toBeVisible();
  await expect(page.getByText("Workload and recovery balance")).toBeVisible();
  await expectNoAxeViolations(page);

  await page.goto("/readiness");
  await expect(
    page.getByRole("heading", { level: 1, name: "Recovery readiness" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Countermeasure coach" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /NASA Human Research Program/ }),
  ).toHaveCount(2);
  await expect(page.getByText("Not used in readiness")).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByRole("button", { name: "14 days" }).click();
  await expect(page.getByRole("button", { name: "14 days" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByText("14-day window", { exact: true })).toBeVisible();

  await page.goto("/brief");
  await expect(
    page.getByRole("heading", { level: 1, name: "Mission health brief" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Recorded recovery summary" }),
  ).toBeVisible();
  await expect(page.getByText("Rest and recover band", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Scored readiness factors" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "What this brief is not" }),
  ).toBeVisible();
  await expectNoAxeViolations(page);

  await page.goto("/vitals");
  await page.getByLabel("Demonstration scenario").selectOption("rest-window");
  await page.getByRole("button", { name: "Generate simulated sample" }).click();
  await expect(page.getByText("Simulated sample saved")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Recent simulated samples" }),
  ).toBeVisible();
  await expect(page.getByText("Simulated only", { exact: true })).toBeVisible();
  await expectNoAxeViolations(page);

  await page.goto("/settings");
  const counts = page.locator("dl").filter({ hasText: "Recorded check-ins" });
  await expect(counts).toContainText("Recorded check-ins");
  await expect(counts).toContainText("Automatic uploads");

  await page.getByRole("button", { name: "Delete all health data" }).click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("heading", { name: "Delete all health data?" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Delete all health data" }).click();
  await expect(page.getByText("Local data deleted")).toBeVisible();

  await page.goto("/reports");
  await expect(page.getByText("No recorded check-in to summarize")).toBeVisible();

  await page.goto("/readiness");
  await expect(
    page.getByRole("heading", { level: 2, name: "No check-in in the 7-day window" }),
  ).toBeVisible();

  await page.goto("/brief");
  await expect(
    page.getByRole("heading", { level: 2, name: "No check-in in the 7-day window" }),
  ).toBeVisible();

  await page.goto("/vitals");
  await expect(page.getByText("No simulated samples yet")).toBeVisible();
});
