#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../..", import.meta.url));
const dist = join(root, "dist");
const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

function readDist(relativePath) {
  return readFileSync(join(dist, relativePath), "utf8");
}

function walk(directory) {
  const entries = readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(absolutePath));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    } else {
      fail(`Unsupported artifact entry: ${absolutePath}`);
    }
  }

  return files;
}

function toArtifactPath(absolutePath) {
  return relative(dist, absolutePath).split(sep).join("/");
}

function fileSize(absolutePath) {
  return statSync(absolutePath).size;
}

function formatBytes(bytes) {
  return `${(bytes / 1000).toFixed(1)} kB`;
}

if (!existsSync(dist)) {
  console.error(
    "Release verification failed: dist/ does not exist. Run the release build first.",
  );
  process.exit(1);
}

const files = walk(dist).sort();
const artifactPaths = files.map(toArtifactPath);
const totalBytes = files.reduce((sum, file) => sum + fileSize(file), 0);

const originalMedia = new Map([
  [
    "hmc/astronaut.svg",
    "a330d6b3214d0292b46e280a39dbcfffa7fd644767565f26231622d380dca47b",
  ],
  ["hmc/orbital.svg", "c3f6d2992e80d04946d1b9bdf79d5e8248a80e8e91d176855675fb679b3f3374"],
]);
for (const [path, expected] of originalMedia) {
  if (!artifactPaths.includes(path)) {
    fail(`Required original media is missing: ${path}`);
    continue;
  }
  const actual = createHash("sha256")
    .update(readFileSync(join(dist, path)))
    .digest("hex");
  if (actual !== expected) fail(`Original media checksum mismatch: ${path}`);
}
const suppliedMedia = new Map([
  [
    "hmc/astronaut-unbranded.glb",
    {
      hash: "d2e1a8946c9400f83745700653ed1082724436a59f6127d01af07e71946f8dc3",
      maxBytes: 1_800_000,
    },
  ],
  [
    "hmc/dashboard-background.webm",
    {
      hash: "169a95ecffa2957013daba3f9df883c4b68de998ebb42cb6a8ff681aa35b083e",
      maxBytes: 900_000,
    },
  ],
]);
for (const [path, { hash, maxBytes }] of suppliedMedia) {
  if (!artifactPaths.includes(path)) {
    fail(`Required reviewed media is missing: ${path}`);
    continue;
  }
  const bytes = readFileSync(join(dist, path));
  if (createHash("sha256").update(bytes).digest("hex") !== hash)
    fail(`Reviewed media checksum mismatch: ${path}`);
  if (bytes.length > maxBytes)
    fail(`${path} exceeds its ${formatBytes(maxBytes)} media budget.`);
}
const exactAllowlist = new Set([
  "index.html",
  "favicon.svg",
  ...originalMedia.keys(),
  ...suppliedMedia.keys(),
]);
const assetAllowlist =
  /^assets\/[A-Za-z0-9][A-Za-z0-9._-]*-[A-Za-z0-9_-]{8,16}\.(?:js|css)$/;

for (const artifactPath of artifactPaths) {
  if (exactAllowlist.has(artifactPath) || assetAllowlist.test(artifactPath)) {
    continue;
  }
  fail(
    `Artifact is outside the release allowlist: ${artifactPath}. ` +
      "Only index.html, favicon.svg, checksum-pinned HMC media, and hashed assets/*.js or assets/*.css may ship.",
  );
}

if (artifactPaths.length < 3) {
  fail(
    `Artifact contains only ${artifactPaths.length} files; the build looks incomplete.`,
  );
}

const jsPaths = artifactPaths.filter((artifactPath) => artifactPath.endsWith(".js"));
const cssPaths = artifactPaths.filter((artifactPath) => artifactPath.endsWith(".css"));

if (jsPaths.length === 0) fail("No JavaScript chunks were emitted.");
if (cssPaths.length !== 1) {
  fail(`Expected exactly one CSS file, found ${cssPaths.length}.`);
}

const rendererPaths = jsPaths.filter((path) =>
  /^assets\/astronaut-scene-[A-Za-z0-9_-]{8,16}\.js$/.test(path),
);
if (rendererPaths.length !== 1)
  fail("Expected exactly one lazy astronaut renderer chunk.");
const coreBytes = files
  .filter(
    (file) =>
      !suppliedMedia.has(toArtifactPath(file)) &&
      !rendererPaths.includes(toArtifactPath(file)),
  )
  .reduce((sum, file) => sum + fileSize(file), 0);
if (coreBytes > 1_000_000)
  fail(
    `Core artifact is ${formatBytes(coreBytes)}, above the unchanged 1000.0 kB core budget.`,
  );
if (totalBytes > 4_500_000)
  fail(
    `Artifact is ${formatBytes(totalBytes)}, above the 4500.0 kB media-inclusive budget.`,
  );

for (const artifactPath of jsPaths) {
  const size = fileSize(join(dist, artifactPath));
  const budget = rendererPaths.includes(artifactPath) ? 650_000 : 500_000;
  if (size > budget) {
    fail(
      `${artifactPath} is ${formatBytes(size)}, above its ${formatBytes(budget)} per-chunk budget.`,
    );
  }
}

for (const artifactPath of cssPaths) {
  const size = fileSize(join(dist, artifactPath));
  if (size > 100_000) {
    fail(
      `${artifactPath} is ${formatBytes(size)}, above the 100.0 kB stylesheet budget.`,
    );
  }
}

if (!existsSync(join(repoRoot, "package-lock.json"))) {
  fail("package-lock.json is missing; the release install is not reproducible.");
}

const indexHtml = readDist("index.html");
const rootElement = /<div id="root"><\/div>/.test(indexHtml);
const moduleScripts = [...indexHtml.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)];
const inlineScripts = [...indexHtml.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>/g)];
const externalReferences = [...indexHtml.matchAll(/(?:src|href)="([^"]+)"/g)].map(
  (match) => match[1],
);

if (!rootElement) fail("index.html does not contain the React root element.");
if (!/<html lang="en">/.test(indexHtml))
  fail("index.html does not declare a document language.");
if (moduleScripts.length !== 1) {
  fail(
    `index.html should reference exactly one module script; found ${moduleScripts.length}.`,
  );
}
if (inlineScripts.length > 0) {
  fail("index.html contains an inline script, which the release CSP does not allow.");
}
if (/<base\b/i.test(indexHtml)) fail("index.html contains a <base> element.");
if (/https?:\/\//i.test(indexHtml)) fail("index.html references an external URL.");

for (const reference of externalReferences) {
  if (reference === "/favicon.svg" || /^\/assets\/[A-Za-z0-9._-]+$/.test(reference)) {
    continue;
  }
  fail(`index.html references an unexpected local path: ${reference}`);
}

const entrySpecifier = moduleScripts[0]?.[1];
if (!entrySpecifier || !entrySpecifier.startsWith("/assets/")) {
  fail("index.html does not reference a hashed /assets/ entry script.");
}

for (const match of indexHtml.matchAll(/<link\b[^>]*\bhref="([^"]+)"[^>]*>/g)) {
  const href = match[1];
  if (href === "/favicon.svg") continue;
  if (!href.startsWith("/assets/")) {
    fail(`index.html references an unexpected linked resource: ${href}`);
    continue;
  }
  if (!existsSync(join(dist, href.slice(1)))) {
    fail(`index.html links to a missing artifact: ${href}`);
  }
}

if (entrySpecifier && !existsSync(join(dist, entrySpecifier.slice(1)))) {
  fail(`index.html entry script is missing from the artifact: ${entrySpecifier}`);
}

const favicon = readDist("favicon.svg");
if (!favicon.trimStart().startsWith("<svg")) fail("favicon.svg is not an SVG document.");
if (/<script\b/i.test(favicon)) fail("favicon.svg contains a script.");
const faviconWithoutNamespace = favicon.replace(
  /\bxmlns="http:\/\/www\.w3\.org\/2000\/svg"/g,
  "",
);
if (/https?:\/\//i.test(faviconWithoutNamespace)) {
  fail("favicon.svg references an external URL.");
}

for (const artifactPath of cssPaths) {
  const css = readDist(artifactPath);
  if (/@import\b/.test(css)) fail(`${artifactPath} contains an unresolved @import.`);
  if (/sourceMappingURL/.test(css))
    fail(`${artifactPath} contains a source map reference.`);
  if (/url\(\s*["']?(?:https?:)?\/\//i.test(css)) {
    fail(`${artifactPath} contains an external url() reference.`);
  }
}

const linkedStylesheets = [...indexHtml.matchAll(/<link\b[^>]*>/g)]
  .filter((match) => /\brel="stylesheet"/.test(match[0]))
  .map((match) => /\bhref="([^"]+)"/.exec(match[0])?.[1])
  .filter(Boolean);

for (const artifactPath of cssPaths) {
  if (!linkedStylesheets.includes(`/${artifactPath}`)) {
    fail(`Stylesheet is not linked from index.html: ${artifactPath}`);
  }
}

const secretPatterns = [
  {
    label: "private key block",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  },
  { label: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  {
    label: "GitHub token",
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  },
  { label: "Stripe live key", pattern: /\bsk_live_[A-Za-z0-9]{16,}\b/ },
  { label: "Slack token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { label: "Google API key", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { label: "environment variable", pattern: /\bVITE_[A-Z0-9_]+\b/ },
  { label: "process environment access", pattern: /\bprocess\.env\.[A-Z0-9_]+\b/ },
];

for (const artifactPath of artifactPaths) {
  if (!/\.(?:js|css|html|svg)$/.test(artifactPath)) continue;
  const content = readDist(artifactPath);
  for (const { label, pattern } of secretPatterns) {
    if (pattern.test(content)) fail(`${artifactPath} contains a possible ${label}.`);
  }
}

for (const artifactPath of [...jsPaths, "index.html"]) {
  const content = readDist(artifactPath);
  const externalFetch = [
    /fetch\(\s*["'`]https?:/,
    /\bXMLHttpRequest\b/,
    /\bnew WebSocket\b/,
    /\bEventSource\b/,
    /\bsendBeacon\b/,
    /\bnavigator\.serviceWorker\b/,
  ];
  if (externalFetch.some((pattern) => pattern.test(content))) {
    fail(`${artifactPath} contains a runtime network API that the release does not use.`);
  }
}

const jsModules = new Map();
const staticEdges = new Map();
const dynamicEdges = new Map();

function addEdge(graph, from, to) {
  const edges = graph.get(from) ?? new Set();
  edges.add(to);
  graph.set(from, edges);
}

for (const artifactPath of jsPaths) {
  const content = readDist(artifactPath);
  const statics = new Set();
  const dynamics = new Set();

  for (const match of content.matchAll(/\bfrom\s*["'](\.\/[^"']+)["']/g)) {
    statics.add(match[1]);
  }
  for (const match of content.matchAll(/\bimport\s*["'](\.\/[^"']+)["']/g)) {
    statics.add(match[1]);
  }
  for (const match of content.matchAll(/\bimport\s*\(\s*[`"'](\.\/[^`"']+)[`"']\s*\)/g)) {
    dynamics.add(match[1]);
  }

  const resolvedStatics = new Set();
  const resolvedDynamics = new Set();

  for (const [kind, specifiers, resolved] of [
    ["static", statics, resolvedStatics],
    ["dynamic", dynamics, resolvedDynamics],
  ]) {
    for (const specifier of specifiers) {
      const absoluteTarget = resolve(dirname(join(dist, artifactPath)), specifier);
      const target = toArtifactPath(absoluteTarget);

      if (!target.startsWith("assets/") || target.startsWith("../")) {
        fail(`${artifactPath} has a ${kind} import outside assets/: ${specifier}`);
        continue;
      }
      if (!existsSync(absoluteTarget)) {
        fail(`${artifactPath} has a broken ${kind} import: ${specifier}`);
        continue;
      }
      resolved.add(target);
      addEdge(kind === "static" ? staticEdges : dynamicEdges, artifactPath, target);
    }
  }

  jsModules.set(artifactPath, { statics: resolvedStatics, dynamics: resolvedDynamics });
}

const entryPath = entrySpecifier?.slice(1);
const visited = new Set();
const visitStack = entryPath ? [entryPath] : [];

while (visitStack.length > 0) {
  const current = visitStack.pop();
  if (!current || visited.has(current)) continue;
  visited.add(current);
  for (const target of jsModules.get(current)?.statics ?? []) visitStack.push(target);
  for (const target of jsModules.get(current)?.dynamics ?? []) visitStack.push(target);
}

for (const artifactPath of jsPaths) {
  if (artifactPath === entryPath) continue;
  if (!visited.has(artifactPath)) {
    fail(`JavaScript chunk is not reachable from the entry: ${artifactPath}`);
  }
}

const visiting = new Set();
const finished = new Set();

function detectCycle(modulePath, trail) {
  if (finished.has(modulePath)) return;
  if (visiting.has(modulePath)) {
    fail(`Static import cycle detected: ${[...trail, modulePath].join(" -> ")}`);
    return;
  }

  visiting.add(modulePath);
  for (const target of jsModules.get(modulePath)?.statics ?? []) {
    detectCycle(target, [...trail, modulePath]);
  }
  visiting.delete(modulePath);
  finished.add(modulePath);
}

if (entryPath) detectCycle(entryPath, []);

for (const chunk of jsPaths) {
  if (!visited.has(chunk)) detectCycle(chunk, []);
}

const appRoutesSource = readFileSync(join(root, "src/app/AppRoutes.tsx"), "utf8");
const lazyPageNames = [
  ...appRoutesSource.matchAll(
    /lazy\(\(\)\s*=>\s*import\("@\/pages\/([A-Za-z0-9]+)"\)\)/g,
  ),
].map((match) => match[1]);

if (lazyPageNames.length < 2) {
  fail("Could not read the lazy page routes from src/app/AppRoutes.tsx.");
}

const dynamicTargets = new Set([...dynamicEdges.values()].flatMap((edges) => [...edges]));
for (const renderer of rendererPaths) {
  if (
    !dynamicTargets.has(renderer) ||
    [...staticEdges.values()].some((edges) => edges.has(renderer))
  ) {
    fail("The astronaut renderer must remain exclusively lazy-loaded.");
  }
}
const routeChunkPattern = (name) =>
  new RegExp(`^assets/${name}-[A-Za-z0-9_-]{8,16}\\.js$`);

for (const pageName of lazyPageNames) {
  const matchingChunks = jsPaths.filter((artifactPath) =>
    routeChunkPattern(pageName).test(artifactPath),
  );
  if (matchingChunks.length !== 1) {
    fail(
      `Route ${pageName} should emit exactly one chunk; found ${matchingChunks.length}.`,
    );
    continue;
  }
  if (!dynamicTargets.has(matchingChunks[0])) {
    fail(
      `Route chunk ${matchingChunks[0]} is not loaded through a dynamic route import.`,
    );
  }
}

const routesSource = readFileSync(join(root, "src/app/routes.ts"), "utf8");
const routePaths = [...routesSource.matchAll(/^\s*path:\s*"([^"]+)",$/gm)].map(
  (match) => match[1],
);
const allJavaScript = jsPaths.map((artifactPath) => readDist(artifactPath)).join("\n");

if (routePaths.length === 0) {
  fail("Could not read route metadata from src/app/routes.ts.");
}
for (const routePath of routePaths) {
  if (!allJavaScript.includes(routePath)) {
    fail(`Route path is missing from the built JavaScript: ${routePath}`);
  }
}

const vercelConfig = JSON.parse(readFileSync(join(repoRoot, "vercel.json"), "utf8"));
if (vercelConfig.framework !== "vite") fail("vercel.json framework must be vite.");
if (vercelConfig.buildCommand !== "npm run build") {
  fail("vercel.json buildCommand must remain npm run build.");
}
if (vercelConfig.outputDirectory !== "apps/web/dist") {
  fail("vercel.json outputDirectory must remain apps/web/dist.");
}

const rewrites = Array.isArray(vercelConfig.rewrites) ? vercelConfig.rewrites : [];
const hasSpaRewrite = rewrites.some(
  (rewrite) => rewrite.source === "/(.*)" && rewrite.destination === "/index.html",
);
if (!hasSpaRewrite)
  fail("vercel.json is missing the SPA history fallback to /index.html.");

const headers = Array.isArray(vercelConfig.headers) ? vercelConfig.headers : [];
const headerFor = (source) => headers.find((entry) => entry.source === source);
const assetHeaders = headerFor("/assets/(.*)")?.headers ?? [];
const rootHeaders = headerFor("/(.*)")?.headers ?? [];
const headerValue = (entries, key) =>
  entries.find((entry) => entry.key.toLowerCase() === key.toLowerCase())?.value ?? "";

const assetCache = headerValue(assetHeaders, "Cache-Control");
if (!assetCache.includes("immutable") || !assetCache.includes("max-age=31536000")) {
  fail("vercel.json must keep immutable long-term caching for hashed assets.");
}

const requiredHeaders = [
  ["X-Content-Type-Options", "nosniff"],
  ["X-Frame-Options", "DENY"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
];

for (const [name, expected] of requiredHeaders) {
  if (!headerValue(rootHeaders, name).includes(expected)) {
    fail(`vercel.json is missing the expected ${name} security header.`);
  }
}

const csp = headerValue(rootHeaders, "Content-Security-Policy");
for (const required of [
  "default-src 'self'",
  "script-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
]) {
  if (!csp.includes(required)) fail(`vercel.json CSP is missing: ${required}`);
}

notes.push(`Artifact: dist (${artifactPaths.length} files, ${formatBytes(totalBytes)})`);
notes.push(
  `Core: ${formatBytes(coreBytes)} / 1000.0 kB; lazy renderer: 650.0 kB maximum; model: 1800.0 kB maximum; background video: 900.0 kB maximum`,
);
notes.push(
  "Video: the bundled silent background WebM is user-supplied and included with owner-confirmed publication rights. Artifact verification is not a legal license review.",
);
notes.push(`JavaScript: ${jsPaths.length} chunks; stylesheet: ${cssPaths.length}`);
notes.push(
  `Routes: ${routePaths.length} metadata paths; ${lazyPageNames.length} lazy page chunks`,
);
notes.push(
  `Chunk graph: ${visited.size} reachable chunks; 0 unresolved imports; 0 static cycles`,
);
notes.push(
  `Vercel: SPA fallback, immutable asset caching, and security headers verified`,
);

if (failures.length > 0) {
  console.error(`Release verification failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("Release verification passed.");
for (const note of notes) console.log(`  ${note}`);
