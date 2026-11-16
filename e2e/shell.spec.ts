import { expect, test } from "@playwright/test";

test("route changes move focus to main and reset scroll", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Dashboard for HMC",
    }),
  ).toBeVisible();

  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  const width = page.viewportSize()?.width ?? 0;
  if (width < 1024) {
    await page.getByRole("button", { name: "Menu" }).click();
  }

  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: /Vitals/ })
    .click();

  await expect(page.getByRole("heading", { level: 1, name: "Vitals" })).toBeVisible();
  await expect(page.getByRole("main")).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("skip link is the first focusable control and targets main", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
});

test("mobile navigation is a labelled disclosure that supports Escape", async ({
  page,
}) => {
  const width = page.viewportSize()?.width ?? 0;
  test.skip(width >= 1024, "Mobile-only navigation behavior");

  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Menu" });
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await menuButton.click();

  const closeButton = page.getByRole("button", { name: "Close" });
  await expect(closeButton).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeHidden();
  await expect(page.getByRole("button", { name: "Menu" })).toBeFocused();

  await page.getByRole("button", { name: "Menu" }).click();
  await page
    .getByRole("navigation", { name: "Primary navigation" })
    .getByRole("link", { name: /Check-in/ })
    .click();

  await expect(page.getByRole("heading", { level: 1, name: "Check-in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});

test("data policy dialog opens, is named, and closes with Escape", async ({ page }) => {
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Data policy" });
  await trigger.click();

  const dialog = page.getByRole("dialog", {
    name: "Data policy at a glance",
  });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Recorded", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Simulated", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Research", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("local preferences persist across reloads and reset cleanly", async ({ page }) => {
  await page.goto("/settings");

  const callsign = page.getByLabel("Callsign");
  const motion = page.getByLabel("Motion");

  await callsign.fill("ORION");
  await motion.selectOption("reduced");

  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");

  await page.reload();

  await expect(page.getByLabel("Callsign")).toHaveValue("ORION");
  await expect(page.getByLabel("Motion")).toHaveValue("reduced");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");

  await page.getByRole("button", { name: "Reset local preferences" }).click();

  const dialog = page.getByRole("dialog", {
    name: "Reset local preferences?",
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Reset preferences" }).click();

  await expect(page.getByLabel("Callsign")).toHaveValue("");
  await expect(page.getByLabel("Motion")).toHaveValue("system");

  const storedValue = await page.evaluate(() =>
    window.localStorage.getItem("astatine.preferences.v1"),
  );
  expect(storedValue).toBeNull();

  const motionAttribute = await page.locator("html").getAttribute("data-motion");
  expect(motionAttribute).toBeNull();
});

test("loads no third-party network requests", async ({ page, baseURL }) => {
  const allowedOrigin = baseURL ? new URL(baseURL).origin : "";
  const externalRequests: string[] = [];

  page.on("request", (request) => {
    const url = request.url();
    if (!/^https?:/.test(url)) return;
    if (new URL(url).origin !== allowedOrigin) externalRequests.push(url);
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Dashboard for HMC",
    }),
  ).toBeVisible();

  expect(externalRequests).toEqual([]);
});
