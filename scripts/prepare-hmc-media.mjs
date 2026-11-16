import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sources = [
  ["astronaut.glb", "b60ccce157bbbda177deda47e29bff248e00765f757ebc9fe04e064e50f96046"],
  [
    "dashboard-background.mp4",
    "f3a84c95ed8a17634294e4a6855f14f89c32117d141b9491308129dd70908b0e",
  ],
];
const inputs = new Map();
for (const [name, expected] of sources) {
  const bytes = await readFile(resolve(root, "essentials", name));
  if (createHash("sha256").update(bytes).digest("hex") !== expected) {
    throw new Error(`Source changed; repeat provenance and visual review: ${name}`);
  }
  inputs.set(`/${name}`, bytes);
}
const original = inputs.get("/astronaut.glb");
const metadata = JSON.parse(original.subarray(20, 20 + original.readUInt32LE(12)));
const threeRoot = resolve(root, "node_modules/three");
const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/") {
    response.setHeader("Content-Type", "text/html");
    response.end(
      '<script type="importmap">{"imports":{"three":"/three/build/three.module.js"}}</script>',
    );
    return;
  }
  if (inputs.has(pathname)) {
    response.setHeader(
      "Content-Type",
      pathname.endsWith("mp4") ? "video/mp4" : "model/gltf-binary",
    );
    response.end(inputs.get(pathname));
    return;
  }
  const target = resolve(threeRoot, pathname.replace(/^\/three\//, ""));
  if (
    !pathname.startsWith("/three/") ||
    !target.startsWith(threeRoot + sep) ||
    !target.endsWith(".js")
  ) {
    response.writeHead(404).end();
    return;
  }
  try {
    response.setHeader("Content-Type", "text/javascript");
    response.end(await readFile(target));
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const modelBytes = await page.evaluate(async () => {
    const { GLTFLoader } = await import("/three/examples/jsm/loaders/GLTFLoader.js");
    const { GLTFExporter } =
      await import("/three/examples/jsm/exporters/GLTFExporter.js");
    const { scene } = await new GLTFLoader().loadAsync("/astronaut.glb");
    const removed = [];
    scene.traverse((object) => {
      if (object.isMesh && /Badge|Insignia/.test(object.material.name))
        removed.push(object);
    });
    if (removed.length !== 4) throw new Error("Unexpected insignia mesh count");
    removed.forEach((mesh) => mesh.removeFromParent());
    const output = await new GLTFExporter().parseAsync(scene, { binary: true });
    return Array.from(new Uint8Array(output));
  });
  const exported = Buffer.from(modelBytes);
  const jsonLength = exported.readUInt32LE(12);
  const json = JSON.parse(exported.subarray(20, 20 + jsonLength));
  json.asset.extras = {
    ...metadata.asset.extras,
    modifications:
      "Badge and insignia meshes removed by Astatine contributors on 2026-11-16; re-exported without unused geometry. No affiliation or endorsement implied.",
  };
  const text = Buffer.from(JSON.stringify(json));
  const padded = Buffer.alloc(Math.ceil(text.length / 4) * 4, 0x20);
  text.copy(padded);
  const binaryChunk = exported.subarray(20 + jsonLength);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + padded.length + binaryChunk.length, 8);
  header.writeUInt32LE(padded.length, 12);
  header.writeUInt32LE(0x4e4f534a, 16);
  const derived = Buffer.concat([header, padded, binaryChunk]);
  await writeFile(resolve(root, "public/hmc/astronaut-unbranded.glb"), derived);

  const videoBytes = await page.evaluate(async () => {
    const { document, MediaRecorder, requestAnimationFrame } = globalThis;
    const video = document.createElement("video");
    video.muted = true;
    video.src = "/dashboard-background.mp4";
    await new Promise((done, reject) => {
      video.onloadeddata = done;
      video.onerror = reject;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const stream = canvas.captureStream(24);
    if (stream.getAudioTracks().length) throw new Error("Audio must not be exported");
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 500_000,
    });
    const chunks = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    const completed = new Promise((done, reject) => {
      recorder.onerror = reject;
      recorder.onstop = async () =>
        done(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));
    });
    recorder.start();
    await video.play();
    await new Promise((done) => {
      const draw = () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (video.ended) done();
        else requestAnimationFrame(draw);
      };
      draw();
    });
    recorder.stop();
    const output = await completed;
    stream.getTracks().forEach((track) => track.stop());
    return output;
  });
  const videoBuffer = Buffer.from(videoBytes);
  await writeFile(resolve(root, "essentials/dashboard-background.webm"), videoBuffer);
  await writeFile(resolve(root, "public/hmc/dashboard-background.webm"), videoBuffer);
  for (const [name, directory] of [
    ["astronaut-unbranded.glb", "public/hmc"],
    ["dashboard-background.webm", "public/hmc"],
  ]) {
    const bytes = await readFile(resolve(root, directory, name));
    console.log(
      `${name}: ${bytes.length} bytes; SHA-256 ${createHash("sha256").update(bytes).digest("hex")}`,
    );
  }
} finally {
  await browser.close();
  server.close();
}
