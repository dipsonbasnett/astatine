import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const svg = await readFile(new URL("../public/hmc/orbital.svg", import.meta.url), "utf8");
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const bytes = await page.evaluate(async (source) => {
    const { document, Image, MediaRecorder, requestAnimationFrame, performance } =
      globalThis;
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 800;
    const context = canvas.getContext("2d");
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
    await image.decode();
    const stream = canvas.captureStream(24);
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 600_000,
    });
    const chunks = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    const completed = new Promise((resolve) => {
      recorder.onstop = async () => {
        const buffer = await new Blob(chunks).arrayBuffer();
        resolve(Array.from(new Uint8Array(buffer)));
      };
    });
    recorder.start();
    const start = performance.now();
    await new Promise((resolve) => {
      function draw(now) {
        const phase = Math.min(1, (now - start) / 12_000);
        const zoom = 1 + 0.025 * (1 - Math.cos(phase * Math.PI * 2));
        context.fillStyle = "#060b14";
        context.fillRect(0, 0, 1280, 800);
        context.drawImage(
          image,
          (1280 - 1280 * zoom) / 2,
          (800 - 800 * zoom) / 2,
          1280 * zoom,
          800 * zoom,
        );
        if (phase < 1) requestAnimationFrame(draw);
        else resolve();
      }
      requestAnimationFrame(draw);
    });
    recorder.stop();
    const result = await completed;
    stream.getTracks().forEach((track) => track.stop());
    return result;
  }, svg);
  await writeFile(
    new URL("../public/hmc/orbital.webm", import.meta.url),
    Buffer.from(bytes),
  );
  console.log(
    `Original silent orbital loop: ${bytes.length} bytes; 1280×800; approximately 12 seconds.`,
  );
} finally {
  await browser.close();
}
