# Release

**Status:** v0.1.0 local candidate; full validation remains required, the unresolved-rights background video is excluded, and deployment is owner-gated ·
**Last reviewed:** 2026-11-16

Astatine is a static single-page application. A release is a validated production bundle plus the
hosting configuration in `vercel.json`. There is no backend, database, migration, scheduler, or
required environment variable.

The repository owner controls deployment. Nothing in this document authorizes an automated push,
deployment, or settings change.

## 1. Versioning

- Astatine follows semantic versioning with a `0.y.z` pre-1.0 line.
- `package.json` is the single version source. Vite injects it as `__APP_VERSION__` at build time,
  and the UI renders that value. Do not add a second hard-coded version.
- Use `npm version patch --no-git-tag-version` (or `minor` / `major`) to update `package.json` and
  the lockfile without creating a Git commit or tag. Git actions require separate approval.
- Breaking changes are allowed in `0.y` releases but must be called out in release notes.
- A release tag should match `package.json` (for example, `v0.1.0`).

## 2. Prerequisites

- Node.js 24 in CI; local Node.js `>=22.12.0`.
- npm with the committed `package-lock.json`.
- Chromium for Playwright (`npm run test:e2e:install`, once per machine).
- Access to the repository and Vercel project for the repository owner.
- No `.env` file is required. Do not create one for release.

## 3. Pre-release gate

Run from a clean working tree. Do not stage or commit as part of this gate.

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build:release
npm run test:e2e
```

`npm run validate` bundles formatting, lint, type-check, the unit suite, and the production build.
`npm run test:e2e` performs its own production build and starts a preview on
`127.0.0.1:4185`; server reuse is disabled so the suite cannot silently test another application.

`npm run build:release` type-checks, builds into the explicit `dist/` output directory with stale
artifacts removed, and runs `scripts/verify-release.mjs` against the result. It does not deploy.
The plain `npm run build` remains the Vercel build command so hosting settings do not need to
change; CI runs the verified release build before any deployment is possible.

Expected evidence:

- format check passes;
- ESLint reports zero warnings;
- TypeScript project build succeeds;
- the entire unit suite passes; record actual counts rather than relying on a prior baseline;
- release verifier passes with zero unresolved imports, static cycles or unreachable chunks;
  record actual core, renderer and media bytes;
- Playwright passes across desktop and mobile; record actual counts and intentional skips;
- axe reports zero violations on every route and the not-found state;
- production build completes without a release-blocking warning.

If Rolldown or the build tool reports transient memory pressure, retry once and record it. Do not
disable type checking to make a release pass.

### Release artifact policy

`dist/` is an explicit allowlist, not a directory that happens to look clean:

- `index.html`;
- `favicon.svg`;
- the four exact, checksum-pinned HMC assets documented in [ARCHITECTURE.md](ARCHITECTURE.md#hmc-dashboard-and-reviewed-local-media);
- content-hashed `assets/*.js` and `assets/*.css`.

The core-app cap remains 1,000 kB; ordinary JS chunks remain capped at 500 kB and CSS at
100 kB. The explicitly lazy astronaut renderer is capped at 650 kB and the reviewed model
at 1,800 kB. The complete artifact must fit 3,500 kB. Vite still reports its default 500 kB
advisory for the isolated renderer; the stricter, feature-specific release verifier controls
this exception.

The user-supplied background video is **excluded from the release artifact** because its
original source and redistribution rights remain unverified. It stays local-only in
`essentials/`, and the app uses the original procedural `orbital.webm` with the static SVG
fallback. Resolve rights before publishing it. An artifact-check pass is not license
clearance. Do not stage the originals or derivatives in `essentials/`.

Anything else fails the verifier, including unreviewed images/video/models, audio, fonts,
source maps, JSON, text files, archives, environment files, and unhashed code. The verifier also checks the HTML shell,
the link and import graph, per-chunk and total size budgets, secret-like strings, runtime network
APIs, the route metadata and lazy chunks, and the SPA rewrite and security headers in `vercel.json`.
It reads hosting configuration but never changes it.

### Manual smoke check

The three-minute evaluation narrative in [DEMO.md](DEMO.md) is a useful smoke-check script. It
covers the recorded check-in → readiness → crew → reports path plus the research and privacy
boundaries. For release verification, start a preview on a free local port and confirm in a real
browser:

```bash
npm run preview -- --host 127.0.0.1 --port <free-port> --strictPort
```

Do not stop or reuse a server owned by another project. If a port is occupied, choose another free
port; strict-port failure is the correct signal that the requested preview did not start.

- direct navigation to `/`, `/readiness`, `/settings`, `/about`, and an unknown path;
- `/mission` runs the simulated clock, pauses and resumes, and keeps its telemetry labeled as
  synthetic; `/research` shows the integrity workflow plus the single onboarded OSD-942 provenance
  record, labeled research-only;
- `/brief` shows an honest empty state without a check-in, and with a recorded check-in composes
  the seven-day brief, keeps missing data visible, and copies a text version locally;
- `/vitals` separates recorded gaps, simulated demonstrations, and research context, switches all
  seven views and three organ tabs by keyboard, pauses organ motion while keeping the organ visible,
  and keeps the procedural organ visible with WebGL unavailable;
- a recorded check-in produces a readiness band, contributing factors, the labeled simulated
  trend, and the countermeasure coach, and the 7/14-day toggle changes the window;
- `/crew` shows an honest empty state; with recorded check-ins it shows pooled recorded metrics,
  data gaps, the one-profile/no-roster boundary, and explicit simulated and research exclusions,
  and its 7/14-day toggle remains keyboard operable with no raw ratings or record ids on screen;
- keyboard-only navigation through the shell, mobile menu, settings, and both dialogs;
- focus ring visibility and focus return after dialog close;
- 390 CSS px width with no horizontal scroll on every route;
- preference persistence across reload and reset;
- no console errors and no third-party network requests;
- reduced motion under both the system preference and the in-app preference.

A preview from a different application is not evidence. Verify the page title and build version in
the UI before trusting any smoke check.

## 4. Dependency and security review

```bash
npm audit --omit=dev
npm audit
```

- At v0.1.0, `npm audit --omit=dev` reports zero vulnerabilities. Nothing from the development
  toolchain is shipped in `dist/`.
- The full audit reports seven moderate advisories in the TypeScript ESLint chain, rooted in a
  `minimatch` denial-of-service advisory (`GHSA-g3hv-75wg-m249`). The affected package is a local
  lint tool, not a runtime dependency, and it is not present in the browser bundle.
- Do not run `npm audit fix --force` during a release. Review reachability and upstream fixes; apply
  a deliberate upgrade with the full gate when a compatible version is available.
- Verify the lockfile is committed and unchanged by the release build.
- Do not add secrets, `.env` files, tokens, or personal data to the repository or hosting settings.

## 5. Continuous integration

`.github/workflows/ci.yml` runs on pushes to `main`, pull requests, and manual dispatch:

1. **quality** — Node 24, npm cache, `npm ci`, format check, lint, type check, unit tests, and the
   verified release build (`npm run build:release`).
2. **browser** — installs Chromium with system dependencies, runs the Playwright suite, and uploads
   the HTML report and failure artifacts when needed.

Both jobs are release gates. A red check is not waived because the change is small. The workflow
has read-only repository permissions and does not deploy.

## 6. Vercel configuration

The repository includes:

- framework: Vite;
- install: `npm install` (Vercel default; the lockfile is committed);
- build: `npm run build`;
- output: `dist`;
- SPA rewrite: every path to `/index.html`;
- immutable caching for hashed assets;
- security headers: CSP, `X-Content-Type-Options`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, and `Permissions-Policy`.

The Vercel build command stays `npm run build`; no hosting setting needs to change for this release.
The release verifier runs locally and in CI. Because Vercel can deploy a push independently of CI,
the owner must treat a red CI run as a deployment blocker and promote only after both jobs pass. If
the owner later wants Vercel itself to run the verifier, that is a settings change requiring
separate approval.

Steps for the repository owner:

1. Import the repository into Vercel and select the Vite preset if it is not detected.
2. Confirm Node.js 24 for the build if the dashboard default differs.
3. Do not add environment variables; none are read.
4. Deploy a preview and verify headers and direct route loads.
5. Promote the validated deployment through the normal Vercel flow.

The CSP restricts scripts, connections, fonts, and images to the site origin (with inline styles
and data images allowed for the build), disables form actions and object embedding, and denies
framing. HSTS is not set in the repository; it belongs to domain-level deployment policy.

## 7. Deployment verification

After a preview or production deployment:

```bash
curl -sSI https://<deployment-host>/settings
curl -sSI https://<deployment-host>/assets/<hashed-file>.js
```

Confirm:

- `/settings` returns the HTML shell, not a 404;
- the CSP, frame denial, referrer policy, permissions policy, and content-type protection are
  present;
- a hashed asset is served with an immutable cache policy;
- no unexpected `Set-Cookie` or third-party redirect appears;
- no source map or environment file is publicly served.

Then repeat the manual smoke check against the deployment. Browser tests run against a local
production build and do not replace deployment verification.

## 8. Rollback

There are no database migrations or server-side data to reverse.

- **Hosting:** promote the previous known-good Vercel deployment.
- **Code:** revert the release commit through a reviewed pull request and redeploy.
- **Storage:** the preferences schema is versioned. A rollback must not read or transform another
  version's key silently; invalid data falls back to defaults.

After a rollback, verify direct routes, headers, settings reset, and the privacy dialog. Record the
reason and the affected version in the release notes.

## 9. Hotfix procedure

1. Reproduce the issue against a production build.
2. Fix only the release-blocking defect; do not bundle unrelated changes.
3. Add a regression test.
4. Run the full pre-release gate.
5. Deploy a preview, verify, then promote.
6. Publish a patch release and a short note describing impact and limits.

A security-sensitive fix must not be described with exploitable details before users can update.

## 10. Release notes

Each release note should state:

- version and date;
- what changed, at the level of user-visible behavior;
- any storage, data-class, or network change;
- the safety statement: not medical care, no sensors, no automatic upload;
- known limitations relevant to the release;
- dependency or security notes that affect users.

Do not claim clinical validation, diagnostic capability, or fitness for real missions.

## 11. Post-release checklist

- [ ] `package.json` version matches the tag and the UI.
- [ ] Release notes repeat the safety statement.
- [ ] The production deployment loads every route directly.
- [ ] Security headers are present.
- [ ] Settings persistence and reset work on the deployment.
- [ ] No third-party request appears in the browser network panel.
- [ ] CI is green for the released commit.
- [ ] Any incident, rollback, or known issue is recorded.
- [ ] The next roadmap stage has not started without explicit approval.

## 12. Out of scope

The following are not release activities for this foundation and require separate review:

- enabling real crew data;
- adding a backend or synchronization;
- integrating sensors or wearables;
- adding clinical scoring, alerts, or recommendations;
- changing the data policy to allow automatic upload;
- adding analytics or third-party runtime services;
- deploying, pushing, or changing hosting settings without owner approval.

## 13. Related documents

- [README.md](../README.md)
- [PRODUCT.md](PRODUCT.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATA_POLICY.md](DATA_POLICY.md)
- [RESEARCH.md](RESEARCH.md)
- [ACCESSIBILITY.md](ACCESSIBILITY.md)
- [DEMO.md](DEMO.md)
- [JUDGES.md](JUDGES.md)
