import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("supplied assets render under the unchanged production security policy", async ({
  page,
}) => {
  const config = JSON.parse(readFileSync("vercel.json", "utf8")) as {
    headers: { source: string; headers: { key: string; value: string }[] }[];
  };
  const csp = config.headers
    .find((entry) => entry.source === "/(.*)")!
    .headers.find((header) => header.key === "Content-Security-Policy")!.value;
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/Content Security Policy|violates.*directive/i.test(message.text()))
      violations.push(message.text());
  });
  await page.route(
    (url) => url.pathname === "/",
    async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), "content-security-policy": csp },
      });
    },
  );
  await page.goto("/");
  await expect(page.locator(".hmc-astronaut-stage")).toHaveAttribute(
    "data-model-ready",
    "true",
    { timeout: 30_000 },
  );
  await expect(page.locator("video.hmc-video-ready")).toBeVisible({ timeout: 30_000 });
  await expect
    .poll(() => page.locator("video").evaluate((video: HTMLVideoElement) => video.paused))
    .toBe(false);
  expect(violations).toEqual([]);
});

test("HMC cards, ranges, sources and numerical channels work by keyboard", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
  const navigation = page.getByRole("navigation", { name: "Primary navigation" });
  if (testInfo.project.name === "desktop") {
    await expect(
      navigation.getByRole("link", { name: "Dashboard", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(
      navigation.getByRole("link", { name: "Profile", exact: true }),
    ).toBeVisible();
  }
  for (const [label, count] of [
    ["15 minutes", 16],
    ["1 hour", 61],
    ["6 hours", 361],
    ["24 hours", 1441],
  ] as const) {
    const button = page.getByRole("button", { name: label, exact: true });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByText(`${count} one-minute samples per channel.`, { exact: false }),
    ).toBeVisible();
  }
  await page.getByText("View numerical samples", { exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "Systolic (mmHg)" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Diastolic (mmHg)" }),
  ).toBeVisible();
  await page.getByText("View numerical samples", { exact: true }).click();
  await page.getByRole("button", { name: "1 hour", exact: true }).click();
  const trigger = page.getByRole("button", { name: "View Blood Pressure details" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Blood Pressure details" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/No personal applicability/)).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  expect(errors).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await testInfo.attach("hmc-dashboard", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
});

test("local profile details preserve privacy and provide a real navigation destination", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "View Details", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Profile details" });
  await expect(dialog.getByText("Not assigned")).toBeVisible();
  await expect(dialog.getByText(/Private notes are not displayed/)).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Profile", level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Manage local data and privacy" }).click();
  await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
});

test("mission timer pauses, resumes and restarts without claiming a backend connection", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const timer = page.getByRole("timer");
  const snapshot = page.getByText(/^Snapshot \d\d:\d\d UTC$/).first();
  const initialSnapshot = await snapshot.textContent();
  await expect(timer).toContainText("T+ 00:00:00");
  await page.clock.fastForward(3000);
  await expect(timer).toContainText("T+ 00:00:03");
  await expect(snapshot).not.toHaveText(initialSnapshot!);
  await page.getByRole("button", { name: "Pause session" }).click();
  const paused = await timer.textContent();
  const pausedSnapshot = await snapshot.textContent();
  await page.clock.fastForward(5000);
  await expect(timer).toHaveText(paused!);
  await expect(snapshot).toHaveText(pausedSnapshot!);
  await expect(page.getByRole("button", { name: "Resume session" })).toBeVisible();
  await page.getByRole("button", { name: "Resume session" }).click();
  await page.clock.fastForward(2000);
  await expect(timer).not.toHaveText(paused!);
  await expect(snapshot).not.toHaveText(pausedSnapshot!);
  await page.getByRole("button", { name: "New simulated session" }).click();
  await expect(timer).toContainText("T+ 00:00:00");
  await expect(page.getByText("System Online", { exact: true })).toHaveCount(0);
});

test("silent video plays and can pause without removing the fallback", async ({
  page,
}) => {
  await page.goto("/");
  const video = page.locator("video");
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState))
    .toBeGreaterThanOrEqual(2);
  expect(
    await video.evaluate(
      (element: HTMLVideoElement) => element.muted && element.loop && element.autoplay,
    ),
  ).toBe(true);
  expect(
    await video.evaluate((element) => {
      const stream = (
        element as HTMLVideoElement & { captureStream: () => MediaStream }
      ).captureStream();
      const count = stream.getAudioTracks().length;
      stream.getTracks().forEach((track) => track.stop());
      return count;
    }),
  ).toBe(0);
  await page.getByRole("button", { name: "Pause background" }).click();
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(true);
  await page.getByRole("button", { name: "Play background" }).click();
  await expect
    .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
    .toBe(false);
});

test("reduced motion and unavailable video/WebGL retain readable original artwork", async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.goto("/");
  await expect(page.locator("video")).toHaveCount(0);
  await expect(page.getByText("Reduced motion · static backdrop")).toBeVisible();
  await expect(page.getByRole("img", { name: /concept astronaut/ })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View Heart Rate details" }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await testInfo.attach("hmc-reduced-motion", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/hmc/dashboard-background.webm", (route) => route.abort());
  await page.reload();
  await expect(page.getByText("Static backdrop · video unavailable")).toBeVisible();
  expect(
    await page
      .locator(".hmc-environment img")
      .evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
  ).toBe(true);
});

test("credited model loads locally, survives resizing, and falls back on context loss", async ({
  page,
}, testInfo) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const stage = page.locator(".hmc-astronaut-stage");
  await expect(stage).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
  await expect(page.getByRole("img", { name: /Fictional 3D astronaut/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Astronaut by Jungle Jim" })).toBeVisible();
  expect(requests.some((url) => url.endsWith("astronaut-unbranded.glb"))).toBe(true);
  expect(requests.filter((url) => !url.startsWith(new URL(page.url()).origin))).toEqual(
    [],
  );
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await testInfo.attach("supplied-astronaut", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png",
  });
  await page.setViewportSize({ width: 600, height: 900 });
  await expect(stage).toHaveAttribute("data-model-ready", "true");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await stage.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext("webgl2");
    const extension = gl?.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("Context-loss extension unavailable");
    extension.loseContext();
  });
  await expect(stage).toHaveAttribute("data-model-ready", "false");
  await expect(
    page.getByRole("img", { name: /Original concept astronaut/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View Heart Rate details" }).click();
  await expect(page.getByRole("dialog", { name: "Heart Rate details" })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const failure of ["unavailable", "invalid"] as const) {
  test(`model ${failure} keeps telemetry usable and the original SVG visible`, async ({
    page,
  }) => {
    await page.route("**/hmc/astronaut-unbranded.glb", (route) =>
      failure === "unavailable"
        ? route.abort()
        : route.fulfill({ contentType: "model/gltf-binary", body: "invalid model" }),
    );
    await page.goto("/");
    await expect(page.locator(".hmc-astronaut-stage")).toBeVisible();
    await expect(page.locator(".hmc-astronaut-stage canvas")).toHaveCount(0, {
      timeout: 30_000,
    });
    await expect(
      page.getByRole("img", { name: /Original concept astronaut/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "15 minutes", exact: true }).click();
    await expect(
      page.getByText("16 one-minute samples per channel.", { exact: false }),
    ).toBeVisible();
  });
}

test("motion changes unload the scene and reload it without a blank model", async ({
  page,
}) => {
  await page.goto("/");
  const stage = page.locator(".hmc-astronaut-stage");
  await expect(stage).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(stage.locator("canvas")).toHaveCount(0);
  await expect(page.locator("video")).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: /Original concept astronaut/ }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(stage).toHaveAttribute("data-model-ready", "true", { timeout: 30_000 });
  await expect(page.locator("video.hmc-video-ready")).toBeVisible();
});

test("app reduced-motion preference disables video and model requests", async ({
  page,
}) => {
  await page.goto("/settings");
  await page.getByLabel("Motion", { exact: true }).selectOption("reduced");
  const requests: string[] = [];
  page.on("request", (request) => {
    if (
      /dashboard-background\.webm|astronaut-unbranded\.glb|astronaut-scene/.test(
        request.url(),
      )
    )
      requests.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByText("Reduced motion · static backdrop")).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  expect(requests).toEqual([]);
});
