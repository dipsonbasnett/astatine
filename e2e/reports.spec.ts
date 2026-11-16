import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

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

async function recordCheckIn(page: Page) {
  await page.goto("/check-in");
  await expect(page.getByRole("heading", { level: 1, name: "Check-in" })).toBeVisible();
  await page.getByLabel("Sleep duration (hours)").fill("6");
  await page.getByLabel("Fatigue").selectOption("4");
  await page.getByLabel("Workload").selectOption("5");
  await page.getByLabel("Planned exercise (minutes)").fill("30");
  await page.getByLabel("Completed exercise (minutes)").fill("20");
  await page.getByLabel("Hydration log entries").fill("3");
  await page.getByLabel("Nutrition log entries").fill("2");
  await page.getByRole("button", { name: "Save check-in" }).click();
  await expect(page.getByText("Check-in saved in this browser")).toBeVisible();
}

test.describe("mission report", () => {
  test("previews a recorded-only review with an explicit privacy boundary", async ({
    page,
  }) => {
    await recordCheckIn(page);
    await page.goto("/reports");

    await expect(page.getByRole("heading", { level: 1, name: "Reports" })).toBeVisible();
    await expect(page).toHaveTitle("Reports · Astatine");
    const article = page.getByRole("article", {
      name: "Astatine recorded mission-health review",
    });
    await expect(article).toBeVisible();
    await expect(
      article.getByText("Recorded only", { exact: true }).first(),
    ).toBeVisible();
    await expect(article.getByText("Not clinical", { exact: true })).toBeVisible();

    for (const heading of [
      "Data sources",
      "Executive summary",
      "Recovery readiness",
      "Countermeasure adherence",
      "Mission health brief",
      "Vitals trends",
      "Data gaps",
      "Non-diagnostic escalation",
      "Disclaimer and limitations",
      "Privacy notice",
    ]) {
      await expect(
        article.getByRole("heading", { level: 3, name: heading }),
      ).toBeVisible();
    }

    await expect(
      article.getByText("Simulated demonstration", { exact: true }),
    ).toBeVisible();
    await expect(article.getByText("Research context", { exact: true })).toBeVisible();
    await expect(article.getByText("Excluded", { exact: true })).toHaveCount(2);
    await expect(article).toContainText("Private notes: excluded by default");
    await expect(article).toContainText(
      "Heart rate, oxygen saturation, and blood-pressure-style values are not recorded",
    );
    await expect(page.getByText(/\bbpm\b/)).toHaveCount(0);
    await expect(page.getByText(/checkin-/)).toHaveCount(0);

    const privateNotes = page.getByRole("checkbox", {
      name: /Include private notes/,
    });
    await expect(privateNotes).not.toBeChecked();
    const sevenDays = page.getByRole("button", { name: "7 days" });
    const fourteenDays = page.getByRole("button", { name: "14 days" });
    await expect(sevenDays).toHaveAttribute("aria-pressed", "true");

    await sevenDays.focus();
    await page.keyboard.press("Tab");
    await expect(fourteenDays).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(fourteenDays).toHaveAttribute("aria-pressed", "true");
    await expect(article).toContainText("Last 14 days");

    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolations(page);
  });

  test("downloads Markdown and JSON that share the visible report identity", async ({
    page,
  }) => {
    await recordCheckIn(page);
    await page.goto("/reports");

    const article = page.getByRole("article", {
      name: "Astatine recorded mission-health review",
    });
    await expect(article).toBeVisible();
    const reportId = (await article.getByText(/^AST-RPT-/).textContent())?.trim();
    if (!reportId) throw new Error("Expected a visible report ID.");

    const markdownDownloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Markdown" }).click();
    const markdownDownload = await markdownDownloadEvent;
    expect(markdownDownload.suggestedFilename()).toBe(
      `astatine-mission-report-${reportId.toLowerCase()}.md`,
    );
    const markdownPath = await markdownDownload.path();
    if (!markdownPath) throw new Error("Expected a Markdown download path.");
    const markdown = await readFile(markdownPath, "utf8");
    expect(markdown).toContain(`**Report ID:** ${reportId}`);
    expect(markdown).toContain("**Data class:** Recorded only");
    expect(markdown).toContain("| Simulated demonstration | Excluded |");
    expect(markdown).toContain("| Research context | Excluded |");
    expect(markdown).toContain("**Private notes:** Excluded by default");
    expect(markdown).not.toContain("## Private notes");
    expect(markdown).toContain("## Privacy notice");
    expect(markdown).toContain("## Disclaimer and limitations");
    await expect(page.getByText(/Astatine did not upload it/).first()).toBeVisible();

    await page.getByRole("checkbox", { name: /Include private notes/ }).check();
    await expect(article).toContainText("included by explicit consent");

    const jsonDownloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download JSON" }).click();
    const jsonDownload = await jsonDownloadEvent;
    expect(jsonDownload.suggestedFilename()).toBe(
      `astatine-mission-report-${reportId.toLowerCase()}.json`,
    );
    const jsonPath = await jsonDownload.path();
    if (!jsonPath) throw new Error("Expected a JSON download path.");
    const exported = JSON.parse(await readFile(jsonPath, "utf8")) as {
      id: string;
      title: string;
      dataClasses: string[];
      excludedDataClasses: string[];
      privacyNotice: string;
      disclaimer: string;
      privateNotes: { included: boolean; items: string[] };
      sourceSummary: { category: string; status: string }[];
      vitals: { trends: { id: string; sourceLabel: string }[] };
    };

    expect(exported.id).toBe(reportId);
    expect(exported.title).toBe("Astatine recorded mission-health review");
    expect(exported.dataClasses).toEqual(["recorded"]);
    expect(exported.excludedDataClasses).toEqual(["simulated", "research"]);
    expect(exported.sourceSummary).toEqual([
      expect.objectContaining({ category: "recorded", status: "included" }),
      expect.objectContaining({ category: "simulated", status: "excluded" }),
      expect.objectContaining({ category: "research", status: "excluded" }),
    ]);
    expect(exported.privateNotes).toMatchObject({ included: true, items: [] });
    expect(exported.privacyNotice).toContain("did not upload it");
    expect(exported.disclaimer).toContain("not a medical record");
    expect(
      exported.vitals.trends.every(
        (trend) =>
          ["sleepRecovery", "activity", "hydration", "nutrition"].includes(trend.id) &&
          trend.sourceLabel.includes("Recorded"),
      ),
    ).toBe(true);
    expect(JSON.stringify(exported)).not.toContain("checkin-");
  });

  test("opens the print layout with report content and without app chrome", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "print", {
        configurable: true,
        value: () => {
          document.documentElement.dataset.printCalled = "true";
        },
      });
    });
    await recordCheckIn(page);
    await page.goto("/reports");

    const article = page.getByRole("article", {
      name: "Astatine recorded mission-health review",
    });
    await expect(article).toBeVisible();
    await page.getByRole("button", { name: "Print or save as PDF" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-print-called", "true");

    await page.emulateMedia({ media: "print" });
    await expect(page.locator("aside")).toBeHidden();
    await expect(page.locator("footer")).toBeHidden();
    await expect(page.getByRole("button", { name: "Print or save as PDF" })).toBeHidden();
    await expect(article).toBeVisible();
    await expect(
      article.getByRole("heading", {
        level: 2,
        name: "Astatine recorded mission-health review",
      }),
    ).toBeVisible();

    const printStyles = await article.evaluate((element) => {
      const style = getComputedStyle(element);
      const table = element.querySelector("table");
      const card = element.querySelector(".rounded-control");
      const tableWidth = table?.getBoundingClientRect().width ?? 0;
      const cardBreak = card ? getComputedStyle(card).breakInside : "";
      return {
        background: style.backgroundColor,
        color: style.color,
        padding: style.padding,
        tableWidth,
        articleWidth: element.getBoundingClientRect().width,
        cardBreak,
      };
    });
    expect(printStyles.background).toBe("rgb(255, 255, 255)");
    expect(printStyles.color).toBe("rgb(15, 23, 42)");
    expect(printStyles.padding).toBe("0px");
    expect(printStyles.tableWidth).toBeLessThanOrEqual(printStyles.articleWidth + 1);
    expect(printStyles.cardBreak).toBe("avoid");
    await expectNoHorizontalOverflow(page);

    await page.emulateMedia({ media: "screen" });
    await expect(
      page.getByRole("button", { name: "Print or save as PDF" }),
    ).toBeVisible();
  });
});
