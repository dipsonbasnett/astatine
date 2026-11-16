# Release

**Status:** Foundation v0.1.0 · **Last reviewed:** 2026-11-16

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
npm run test:e2e
npm run build
```

`npm run validate` bundles formatting, lint, type-check, the unit suite, and the production build.
`npm run test:e2e` performs its own production build and starts a preview on
`127.0.0.1:4185`; server reuse is disabled so the suite cannot silently test another application.

Expected evidence:

- format check passes;
- ESLint reports zero warnings;
- TypeScript project build succeeds;
- unit suite passes (170 tests in 32 files at this revision);
- Playwright reports 37 passed and one intentionally skipped mobile-only case in the desktop
  project (38 checks total across two projects);
- axe reports zero violations on every route and the not-found state;
- production build completes without a release-blocking warning.

If Rolldown or the build tool reports transient memory pressure, retry once and record it. Do not
disable type checking to make a release pass.

### Manual smoke check

Run `npm run preview` and verify in a real browser:

- direct navigation to `/`, `/readiness`, `/settings`, `/about`, and an unknown path;
- `/mission` runs the simulated clock, pauses and resumes, and keeps its telemetry labeled as
  synthetic; `/research` shows the integrity workflow with an empty registry rather than dataset
  content;
- `/brief` shows an honest empty state without a check-in, and with a recorded check-in composes
  the seven-day brief, keeps missing data visible, and copies a text version locally;
- a recorded check-in produces a readiness band, contributing factors, the labeled simulated
  trend, and the countermeasure coach, and the 7/14-day toggle changes the window;
- keyboard-only navigation through the shell, mobile menu, settings, and both dialogs;
- focus ring visibility and focus return after dialog close;
- 390 CSS px width with no horizontal scroll on every route;
- preference persistence across reload and reset;
- no console errors and no third-party network requests;
- reduced motion under both the system preference and the in-app preference.

`npm run preview` uses port 4173 with a strict port. If another local project already holds that
port, stop it rather than reusing it; a preview from a different application is not evidence.

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

1. **quality** — Node 24, npm cache, `npm ci`, format check, lint, type check, unit tests, build.
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

- [PRODUCT.md](PRODUCT.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATA_POLICY.md](DATA_POLICY.md)
- [RESEARCH.md](RESEARCH.md)
- [ACCESSIBILITY.md](ACCESSIBILITY.md)
