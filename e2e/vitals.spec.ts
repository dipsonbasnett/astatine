import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    content: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(widths.content).toBeLessThanOrEqual(widths.viewport + 1);
}

function readAnimationPlayState(page: Page) {
  return page.locator(".organ-heartbeat").evaluate((element) => {
    return getComputedStyle(element as SVGElement).animationPlayState;
  });
}

test.describe("vitals", () => {
  test("switches vitality and organ views by keyboard with labeled charts", async ({
    page,
  }) => {
    await page.goto("/vitals");
    await expect(page.getByRole("heading", { level: 1, name: "Vitals" })).toBeVisible();
    await expect(page.getByText(/Sources are labeled throughout/)).toBeVisible();

    const vitalTablist = page.getByRole("tablist", { name: "Vital signs" });
    await expect(vitalTablist).toBeVisible();
    const heartRateTab = page.getByRole("tab", { name: "Heart rate" });
    await expect(heartRateTab).toHaveAttribute("aria-selected", "true");
    await expect(
      page.getByRole("img", { name: /Heart rate, simulated demonstration values/ }),
    ).toBeVisible();

    await heartRateTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "SpO2" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("heading", { level: 3, name: "SpO2" })).toBeVisible();

    await page.keyboard.press("End");
    await expect(page.getByRole("tab", { name: "Nutrition" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const nutritionPanel = page.getByRole("tabpanel", { name: "Nutrition" });
    await expect(
      nutritionPanel.getByText(/No simulated series is shown for this view/),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Sleep and recovery" }).click();
    const sleepPanel = page.getByRole("tabpanel", { name: "Sleep and recovery" });
    await expect(
      sleepPanel.getByText("Rubric benchmark, not a clinical range"),
    ).toBeVisible();
    await expect(
      sleepPanel.getByRole("link", { name: /NASA Human Research Program/ }),
    ).toHaveAttribute("href", "https://www.nasa.gov/hrp/");

    const organTablist = page.getByRole("tablist", { name: "Organ context" });
    await expect(organTablist).toBeVisible();
    const heartTab = page.getByRole("tab", { name: "Heart", exact: true });
    await heartTab.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Lungs" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const lungsPanel = page.getByRole("tabpanel", { name: "Lungs" });
    await expect(
      lungsPanel.getByRole("img", { name: /Procedural lung illustration/ }),
    ).toBeVisible();
    await expect(lungsPanel.getByText("Simulated monitor")).toBeVisible();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Brain" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const brainPanel = page.getByRole("tabpanel", { name: "Brain" });
    await expect(
      brainPanel.getByRole("img", { name: /Procedural brain illustration/ }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });

  test("keeps every vitality view and organ tab inside the viewport", async ({
    page,
  }) => {
    await page.goto("/vitals");
    await expect(page.getByRole("heading", { level: 1, name: "Vitals" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    for (const label of [
      "SpO2",
      "Blood pressure style",
      "Sleep and recovery",
      "Exercise and activity",
      "Hydration",
      "Nutrition",
    ]) {
      await page.getByRole("tab", { name: label, exact: true }).click();
      await expectNoHorizontalOverflow(page);
    }

    const organs = [
      { label: "Lungs", figure: /Procedural lung illustration/ },
      { label: "Brain", figure: /Procedural brain illustration/ },
      { label: "Heart", figure: /Procedural heart illustration/ },
    ] as const;

    for (const organ of organs) {
      await page.getByRole("tab", { name: organ.label, exact: true }).click();
      const panel = page.getByRole("tabpanel", { name: organ.label });
      await expect(panel.getByRole("img", { name: organ.figure })).toBeVisible();
      await expect(panel.getByText("Simulated monitor")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test("pauses organ motion without hiding the organ and honors reduced motion", async ({
    page,
  }) => {
    await page.goto("/vitals");
    const heartPanel = page.getByRole("tabpanel", { name: "Heart" });
    await expect(
      heartPanel.getByRole("img", { name: /Procedural heart illustration/ }),
    ).toBeVisible();
    expect(await readAnimationPlayState(page)).toBe("running");

    await heartPanel.getByRole("button", { name: "Pause organ motion" }).click();
    await expect(
      heartPanel.getByRole("button", { name: "Resume organ motion" }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(heartPanel.getByText(/Organ motion is paused/)).toBeVisible();
    expect(await readAnimationPlayState(page)).toBe("paused");
    await expect(
      heartPanel.getByRole("img", { name: /Procedural heart illustration/ }),
    ).toBeVisible();

    await heartPanel.getByRole("button", { name: "Resume organ motion" }).click();
    expect(await readAnimationPlayState(page)).toBe("running");

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    const reducedHeartPanel = page.getByRole("tabpanel", { name: "Heart" });
    await expect(
      reducedHeartPanel.getByText(
        /Reduced motion is active from your system or in-app preference/,
      ),
    ).toBeVisible();
    expect(await readAnimationPlayState(page)).toBe("paused");
    await expect(
      reducedHeartPanel.getByRole("img", { name: /Procedural heart illustration/ }),
    ).toBeVisible();
  });

  test("honors the in-app reduced-motion preference", async ({ page }) => {
    await page.goto("/settings");
    await page.getByLabel("Motion").selectOption("reduced");
    await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");

    await page.goto("/vitals");
    const heartPanel = page.getByRole("tabpanel", { name: "Heart" });
    await expect(
      heartPanel.getByText(
        /Reduced motion is active from your system or in-app preference/,
      ),
    ).toBeVisible();
    expect(await readAnimationPlayState(page)).toBe("paused");
    await expect(
      heartPanel.getByRole("img", { name: /Procedural heart illustration/ }),
    ).toBeVisible();
  });

  test("keeps the procedural organ visible when WebGL is unavailable", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        contextId: string,
        ...rest: unknown[]
      ) {
        if (contextId.startsWith("webgl")) return null;
        return (originalGetContext as (...args: unknown[]) => unknown).call(
          this,
          contextId,
          ...rest,
        );
      } as typeof originalGetContext;
    });

    await page.goto("/vitals");
    const heartPanel = page.getByRole("tabpanel", { name: "Heart" });
    await expect(
      heartPanel.getByRole("img", { name: /Procedural heart illustration/ }),
    ).toBeVisible();
    await expect(heartPanel.getByText(/No WebGL is required/)).toBeVisible();
    expect(
      await page.evaluate(() => document.createElement("canvas").getContext("webgl")),
    ).toBeNull();
  });
});
