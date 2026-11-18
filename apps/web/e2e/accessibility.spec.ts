import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/check-in",
  "/vitals",
  "/mission",
  "/brief",
  "/readiness",
  "/crew",
  "/reports",
  "/research",
  "/settings",
  "/profile",
  "/about",
  "/not-a-route",
] as const;

test.describe("accessibility polish", () => {
  test("every visible button meets the 44px touch target at 390px", async ({ page }) => {
    const width = page.viewportSize()?.width ?? 0;
    test.skip(width >= 1024, "Touch-target check is mobile-only");

    for (const path of routes) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const buttons = page.locator("button:visible");
      const count = await buttons.count();
      expect(count, `${path} should render at least one button`).toBeGreaterThan(0);

      for (let index = 0; index < count; index += 1) {
        const box = await buttons.nth(index).boundingBox();
        expect(box, `${path} button ${index} has no layout box`).not.toBeNull();
        expect(
          box?.height ?? 0,
          `${path} button ${index} is below the 44px touch target`,
        ).toBeGreaterThanOrEqual(44);
        expect(
          box?.width ?? 0,
          `${path} button ${index} is below the 44px touch target`,
        ).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("keyboard focus is visibly outlined on the first control", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    const outline = await skipLink.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        style: style.outlineStyle,
        width: Number.parseFloat(style.outlineWidth),
      };
    });

    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });

  test("a rejected check-in focuses the first invalid field", async ({ page }) => {
    await page.goto("/check-in");

    const sleep = page.getByLabel("Sleep duration (hours)");
    await sleep.fill("");
    await page.getByRole("button", { name: "Save check-in" }).click();

    await expect(sleep).toHaveAttribute("aria-invalid", "true");
    await expect(sleep).toBeFocused();
    await expect(sleep).toHaveAccessibleDescription(/Enter sleep duration in hours\./);
    await expect(page.getByRole("alert")).toContainText(
      "Check the highlighted fields. Nothing was saved.",
    );
  });

  test("the mobile menu is keyboard reachable and Escape restores focus", async ({
    page,
  }) => {
    const width = page.viewportSize()?.width ?? 0;
    test.skip(width >= 1024, "Mobile-only navigation behavior");

    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Menu" });
    await trigger.focus();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("button", { name: "Close" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await page.keyboard.press("Tab");
    await expect(
      page
        .getByRole("navigation", { name: "Primary navigation" })
        .getByRole("link")
        .first(),
    ).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();
  });

  test("every route stays usable without canvas or WebGL support", async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = function getContext() {
        return null;
      } as unknown as typeof HTMLCanvasElement.prototype.getContext;
    });

    for (const path of routes) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }

    const contexts = await page.evaluate(() => ({
      webgl: document.createElement("canvas").getContext("webgl"),
      canvas2d: document.createElement("canvas").getContext("2d"),
    }));

    expect(contexts.webgl).toBeNull();
    expect(contexts.canvas2d).toBeNull();
  });
});
