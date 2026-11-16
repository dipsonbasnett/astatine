# Astatine

**Mission-ready health intelligence for human spaceflight.**

Astatine is an open-source, local-first workspace for crew-facing health context in **simulated**
long-duration missions. That tagline names the domain the project is designed around; it is not a
certification of operational, clinical, or flight readiness. The shipped build is a deliberately
narrow foundation: recorded self-report feeds an explainable readiness view and a non-diagnostic
countermeasure coach, while recorded, simulated, and research content stay visibly separate.

> **Status:** v0.1.0 release-ready foundation build. Not medical care. Not a diagnostic,
> monitoring, or emergency tool. No live sensors, no backend, and no automatic health-data upload.

## Problem statement

Long-duration missions compress many kinds of information into a small, shared interface: what a
crew member chose to record, what a simulation is demonstrating, and what published research says.
In simulation and mission-support settings, those categories are easy to blur. A polished dashboard
can imply clinical authority it does not have, and a demonstration can be mistaken for a real
record.

The problem is therefore not only presentation. It is **legible boundaries**: crews and
mission-support stakeholders need a calm, accessible place to orient themselves, while the
interface must make data provenance and product limits unmistakable before any health-adjacent
feature is added.

Primary users are crew members in simulated long-duration missions. Secondary users are
mission-support and medical-review stakeholders who need to understand what the product does, what
it does not do, and where its information comes from.

## Solution overview

Astatine combines a calm application shell, a browser-local data layer, and pure domain engines
that keep three data classes separate:

- **Recorded** — self-reported check-ins and locally derived report snapshots in IndexedDB.
- **Simulated** — seeded telemetry and a deterministic recovery trend, labeled wherever shown.
- **Research** — static, attributed public context, plus one onboarded de-identified public
  dataset record (OSD-942) used only as cited context; no model is trained on it.

The result is a complete demoable loop: record a check-in, read an explainable readiness band,
review a seven-day brief, pool recorded context into one local crew summary, inspect source-separated
vitals, build a local report, and delete everything from Settings. Nothing is diagnosed, predicted,
uploaded, or attributed to NASA.

## Core principles

1. **Boundaries before features.** A feature does not ship until its data class and limits are
   explicit in the interface and the documentation.
2. **Crew-readable calm.** The interface favors legibility, restraint, and low visual noise over
   dashboard density. There are no decorative gradients, sci-fi tropes, or ornamental telemetry.
3. **Accessible by default.** Semantic HTML, keyboard operation, visible focus, reduced motion, and
   a 390 CSS px layout are baseline requirements, not follow-up work.
4. **Honest provenance.** Recorded, simulated, and research content are never mixed or relabeled.
   Simulated content is labeled as simulation; research stays cited context.
5. **Local-first privacy.** Browser storage holds preferences and only the health records a user
   explicitly records or generates. There is no backend, analytics, third-party font, CDN, or
   automatic upload; export and deletion are user actions.
6. **No clinical claims.** Astatine does not diagnose, predict medical events, recommend treatment,
   or replace a medical professional. No model is used, and the onboarded public dataset has not
   been used to train one.

## Feature overview

- A responsive application shell with accessible primary navigation, a keyboard-operated mobile
  disclosure, route titles, focus and scroll management, and a skip link.
- A dark, low-glare visual system with one cyan accent, a neutral hierarchy, and monospace
  treatment only for telemetry-style values.
- Reusable primitives: Button, Card, Input, Select, Badge, Skeleton, EmptyState, ErrorState,
  InlineAlert, Tabs, and a native-dialog Modal.
- Eleven routes plus an accessible not-found state. Every route is a working surface; none is a
  placeholder.
- A typed Dexie/IndexedDB data layer with separate tables for recorded check-ins, derived report
  snapshots, and simulated telemetry, plus explicit provenance on every record.
- A recorded check-in flow with six self-ratings, sleep duration, and optional workload and daily
  practice entries. Blank optional fields stay missing rather than becoming zero.
- An explainable recovery-readiness rubric with four weighted factors, 7-day and 14-day windows,
  confidence, missing-data awareness, and no opaque model.
- A non-diagnostic countermeasure coach with one verified public NASA Human Research Program source
  used only for sleep and exercise context, and explicit "no verified source" copy elsewhere.
- A deterministic simulated recovery trend, labeled "Simulated" and "Not used in readiness,"
  generated at display time and never stored.
- A read-only mission health brief for the seven-day recorded window with a local copy action;
  nothing is stored.
- A privacy-conscious crew overview that pools recorded check-ins into completion, sleep
  regularity, exercise adherence, hydration and nutrition logging, workload and fatigue, recovery
  bands, and data gaps. One local profile, no roster, no team score, no member-level attribution.
- A recorded reports workflow: choose 7 or 14 days, preview a source-labeled report, download
  Markdown or JSON, print to PDF, and optionally save a local snapshot. Private notes are excluded
  by default; simulated and research content are structurally excluded.
- Vitals views that keep recorded self-report, labeled device simulation, reference context, and
  attributed research context in separate cards. Procedural organ illustrations are SVG/CSS, need
  no WebGL, and can pause without hiding the organ.
- A deterministic simulated mission clock and synthetic telemetry monitor; it receives no flight
  data and stores nothing.
- A research integrity workflow: a 12-field dataset provenance contract, a 13-item onboarding
  checklist, a five-step source verification record, license and attribution rules, and one
  de-identified public dataset record (OSD-942) used only as cited research context. No model is
  trained.
- Local export, validated import, and scoped deletion for recorded and simulated data.
- A settings surface for two browser-local preferences, with confirmation before reset.
- Automated unit, integration, browser, accessibility, and no-canvas checks, plus CI and
  Vercel-ready static hosting configuration.

### Routes

| Surface   | Route        | Data class | Scope note                                                         |
| --------- | ------------ | ---------- | ------------------------------------------------------------------ |
| Overview  | `/`          | —          | Orientation, boundaries, and route discovery                       |
| Check-in  | `/check-in`  | Recorded   | Six self-ratings, sleep duration, and optional daily practices     |
| Readiness | `/readiness` | Recorded   | Explainable rubric, 7/14-day windows, coach, and a simulated trend |
| Crew      | `/crew`      | Recorded   | Pooled adherence, logging, workload, band, and gaps; no roster     |
| Vitals    | `/vitals`    | All three  | Recorded gaps, labeled simulation, research, and organ views       |
| Mission   | `/mission`   | Simulated  | Deterministic mission clock and synthetic telemetry; no live feed  |
| Brief     | `/brief`     | Recorded   | Read-only seven-day self-report briefing; nothing stored           |
| Reports   | `/reports`   | Recorded   | Review a 7/14-day report; Markdown, JSON, print; never clinical    |
| Research  | `/research`  | Research   | Integrity workflow, checklist, and empty validated registry        |
| Settings  | `/settings`  | —          | Local preferences plus export, import, and deletion controls       |
| About     | `/about`     | —          | Problem, principles, scope, and project links                      |
| Not found | any other    | —          | Accessible recovery links                                          |

### What the interface looks like

This repository intentionally ships **no screenshots**. The brand mark, favicon, interface icons,
and procedural astronaut and orbital SVGs are original; typography uses system font stacks. The
one third-party visual asset is a CC BY 4.0 astronaut model with visible credit and removed
insignia. The user-supplied background video is excluded from the release pending rights
clearance. Any future screenshot must follow the attribution policy below and record a public
source and license.

The interface uses deep navy surfaces, a restrained gray text hierarchy, and a single cyan accent.
Pages open with a short eyebrow, one `h1`, a plain-language description, and textual status badges.
Data-class badges and boundary notices are visible in the content, not hidden in a legend. Recorded
values use normal prose and numerals; simulated and telemetry-style values use a monospace face and
an explicit "Simulated" label. The layout is a desktop sidebar with a mobile disclosure, and every
route reflows to 390 CSS px without horizontal scrolling.

## Demo and evaluation

- [docs/DEMO.md](docs/DEMO.md) — a three-minute narrative, exact screen interactions, talking
  points, and a fallback plan if live interaction fails.
- [docs/JUDGES.md](docs/JUDGES.md) — a concise FAQ covering the problem, data, privacy, readiness
  method, research sources, limitations, and what clinical use would require.

The fastest evaluation path is: open `/`, record a check-in, review `/readiness`, inspect `/crew`
and `/vitals`, build `/reports`, view `/research`, and finish at `/settings` to see stored counts and
deletion controls. Use synthetic values only.

## Roadmap

The build follows an explicit, reviewable sequence:

- **Complete in this revision:** foundation and design system; local data and privacy controls;
  check-in; simulated mission monitor; readiness and coach; mission brief; vitals and organ context;
  crew readiness; reports and exports; research integrity workflow; accessibility and mobile polish;
  documentation and demo readiness; release verification and release build.
- **Next, owner-controlled:** deployment. The repository contains Vercel configuration and a
  verified release build, but no deployment is performed by the project or this documentation. See
  [docs/RELEASE.md](docs/RELEASE.md).
- **Future candidates, not commitments:** additional verified research context, manual
  assistive-technology and crew usability studies, and deeper platform hardening. Each would need
  the universal feature gate in [docs/PRODUCT.md](docs/PRODUCT.md) and a data-policy review.
- **Out of scope:** live sensors or wearables, backend storage or synchronization, automatic
  upload, clinical decision support, diagnosis, prognosis, treatment guidance, clinical-validation
  claims, and any claim of NASA endorsement or NASA-trained models.

## Documentation

| Document                                                                                     | Purpose                                                         |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [docs/PRODUCT.md](docs/PRODUCT.md)                                                           | Users, product principles, scope, roadmap, and stage gates      |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                                                 | System design, layered diagram, routing, state, and extension   |
| [docs/DATA_POLICY.md](docs/DATA_POLICY.md)                                                   | The three data classes and the rules that keep them separate    |
| [docs/RESEARCH.md](docs/RESEARCH.md)                                                         | Provenance, citation, and review standards for research context |
| [docs/research/DATASET_ONBOARDING_TEMPLATE.md](docs/research/DATASET_ONBOARDING_TEMPLATE.md) | One-record dataset admission and verification template          |
| [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)                                               | Accessibility commitments, evidence, and known limitations      |
| [docs/DEMO.md](docs/DEMO.md)                                                                 | Three-minute demo script, screen walkthrough, and fallback      |
| [docs/JUDGES.md](docs/JUDGES.md)                                                             | Judge-oriented FAQ and claim boundaries                         |
| [docs/RELEASE.md](docs/RELEASE.md)                                                           | Versioning, validation, deployment, and rollback                |

## Local development

**Requirements:** Node.js `>=22.12.0` and npm. CI and `.nvmrc` use Node 24; the package engine floor
exists for contributors on a current Node 22 line.

```bash
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173`. The port is strict, so a conflicting process fails
loudly rather than silently moving to another port. No environment variables, API keys, or local
services are required.

### Available scripts

| Command                    | What it does                                                     |
| -------------------------- | ---------------------------------------------------------------- |
| `npm run dev`              | Start the Vite development server                                |
| `npm run build`            | Type-check the project, then build the production bundle         |
| `npm run build:release`    | Type-check, build `dist/`, and run the release verifier          |
| `npm run preview`          | Serve the production build locally at `http://localhost:4173`    |
| `npm run lint`             | ESLint with zero warnings allowed                                |
| `npm run typecheck`        | TypeScript project-reference build with no emit                  |
| `npm run format`           | Format the repository with Prettier                              |
| `npm run format:check`     | Verify formatting without writing                                |
| `npm test`                 | Run the Vitest suite once                                        |
| `npm run test:watch`       | Run Vitest in watch mode                                         |
| `npm run test:e2e`         | Build, preview, and run Playwright at desktop and 390 CSS px     |
| `npm run test:e2e:install` | Install the Playwright Chromium browser once                     |
| `npm run validate`         | Format check, lint, type-check, unit tests, and production build |

### Technology

React 19, React Router 7, TypeScript 6 in strict mode, Vite 8, Tailwind CSS 4 through the official
Vite plugin, Dexie 4, Zustand 5, Vitest 5 with Testing Library, Playwright 1.65, ESLint 10, and
Prettier 3.

The runtime dependency set is intentionally small: React, React DOM, React Router, Dexie, and
Zustand. The brand mark and icons are original inline SVG; typography uses system font stacks;
there is no component library, icon package, analytics SDK, or webfont. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the rationale and version constraints.

## Testing instructions

```bash
npm test
npm run test:e2e:install   # once per machine
npm run test:e2e
```

At this revision the unit and integration suite runs **233 tests in 47 files** and covers
primitives, form associations, the modal, preferences, settings, the error boundary, routes, skip
navigation, route focus/reset, readiness and countermeasure engines, crew aggregation and privacy
filtering, reports and exports, dataset provenance validation, the simulated mission monitor, the
mission brief, vitals aggregation and simulation, organ keyboard and motion behavior, and the
recorded flows from check-in through readiness, brief, reports, crew, and vitals.

`npm run test:e2e` starts its own production build and preview server. Playwright runs every spec in
two projects: desktop (1280×900) and mobile (390×844, touch, DPR 2). At this revision the suite
reports **70 checks: 67 passed and 3 intentionally skipped** (the mobile-only touch-target and menu
cases are skipped on desktop, along with the existing mobile-navigation disclosure case). The
browser suite checks:

- every route for one visible `h1`, the correct document title, and no horizontal overflow at
  390 CSS px;
- the not-found state;
- axe scans for WCAG 2.0, 2.1, and 2.2 A/AA rules across all routes and populated health views;
- 44 × 44 px touch targets for every visible button at 390 CSS px;
- keyboard focus visibility, skip navigation, mobile menu operation with Escape and focus return,
  route focus, scroll reset, and dialog Escape handling;
- a rejected check-in focusing the first invalid field with its accessible description;
- preference persistence across reload and reset, including the in-app reduced-motion setting;
- a recorded check-in producing a readiness band, contributing factors, a simulated trend labeled
  "Not used in readiness," a countermeasure coach, brief, report, crew summary, and vitals views;
- every route remaining usable with canvas and WebGL contexts forced unavailable;
- that the app makes no third-party network requests.

For the full local gate, run:

```bash
npm run validate
npm run test:e2e
```

CI runs the quality gate and the browser suite on pushes and pull requests; see
`.github/workflows/ci.yml`. Automated checks do not replace manual assistive-technology review; the
current limitations are recorded in [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

## Release instructions

Astatine is a static SPA with no backend, database, or required environment variables. The
repository owner controls deployment; nothing here authorizes an automated push or deploy.

1. Install exactly: `npm ci`.
2. Run `npm run validate`.
3. Run `npm run test:e2e`.
4. Confirm the version in `package.json`; the app reads that value at build time, so it is not
   duplicated in source.
5. Build with `npm run build:release`; the verifier checks the `dist/` allowlist, import graph,
   routes, size budgets, secrets, runtime network APIs, and hosting configuration.
6. Let CI pass both required jobs.
7. The repository owner deploys through Vercel. The included `vercel.json` supplies the SPA
   rewrite, immutable asset caching, and security headers. No environment variables are needed.
8. Verify direct route loads, headers, the 390 CSS px layout, keyboard navigation, preference
   persistence, and the data-policy dialog on the deployment.
9. Tag the release and publish notes that repeat the safety statement.

Rollback is a previous-deployment promotion in Vercel or a Git revert; there are no data migrations
to reverse. The full checklist, versioning policy, and post-release steps are in
[docs/RELEASE.md](docs/RELEASE.md). The manual smoke narrative in [docs/DEMO.md](docs/DEMO.md) is a
useful starting point for deployment verification.

## Privacy and safety boundaries

- **No clinical use.** Astatine does not diagnose, predict medical events, recommend treatment, or
  claim clinical validation. It is not a medical device and must not be used for care decisions,
  fitness-for-duty determinations, or emergencies.
- **No automatic collection.** There is no sensor integration, wearable pairing, backend, or
  automatic health-data upload.
- **No third-party runtime services.** No analytics, advertising, third-party fonts, CDNs, or
  remote API calls are loaded by the app.
- **Browser-local data.** `localStorage` key `astatine.preferences.v1` stores an optional callsign
  (maximum 32 characters) and a motion preference (`system` or `reduced`). IndexedDB database
  `astatine` stores recorded check-ins, derived report snapshots, and simulated telemetry in
  separate tables. Neither store is encrypted. The simulated recovery trend is generated at display
  time and never stored. Data stays in this browser until the user deletes it, resets preferences,
  or clears site data. Local JSON export and report downloads are user-initiated.
- **Three data classes.** Recorded content is user-entered and browser-local. Simulated content is
  clearly labeled demonstration data. Research content is open, cited context with verified
  provenance. One verified NASA Human Research Program page is linked from the countermeasure coach
  and the Vitals sleep/exercise views, and one de-identified public dataset (OSD-942, CC0-1.0) is
  onboarded as cited context; neither is stored or used for model training. The classes are never
  mixed,
  and simulated or research content is never presented as a crew member's personal data.
- **Hosting metadata.** The app itself sends no health data. A hosting provider may record standard
  HTTP request metadata under its own policy; see [docs/DATA_POLICY.md](docs/DATA_POLICY.md).
- **Content Security Policy.** The deployment configuration restricts scripts and connections to
  the site origin, blocks framing, and disables form submissions.

These are product boundaries, not claims of regulatory compliance. Read the complete rules in
[docs/DATA_POLICY.md](docs/DATA_POLICY.md) and the provenance standards in
[docs/RESEARCH.md](docs/RESEARCH.md).

## Research attribution policy

- **Original assets.** The favicon, brand mark, and interface icons were authored for this project.
  They carry no third-party license obligations.
- **One third-party visual asset is bundled.** The astronaut is "Astronaut by Jungle Jim" under
  CC BY 4.0, credited in the interface and in the file metadata; badge and insignia meshes were
  removed and no affiliation is implied. No stock photography, NASA imagery, video, audio, or
  copied illustration is included; the user-supplied background video is excluded from the release.
  This repository also bundles no screenshots.
- **Research links are context, not endorsement.** Sources are cited with publisher, URL, and
  access date where they appear. The countermeasure coach links one verified NASA Human Research
  Program page with bounded claims and visible limitations; no page content is copied. A link does
  not imply that the source or NASA endorses Astatine.
- **One public dataset is onboarded as context, never for training.** OSD-942 (NASA OSDR,
  CC0-1.0, de-identified) is represented by a validated provenance record and normalized per-array
  summaries; raw expression files and direct identifiers are not bundled. Astatine has no trained
  model, and no NASA data or other dataset has been used to train one.
- **Future assets require provenance.** Any proposed third-party asset must have a public source, a
  verified license that permits this use, a recorded attribution and access date, and review before
  merge. Unverified assets are rejected.
- **Independence.** Astatine is an independent open-source project. References to NASA programs or
  other organizations describe public research context only; no affiliation, sponsorship, or
  endorsement is implied, and no organizational marks are used.

## License

Astatine is released under the [MIT License](LICENSE). Copyright © 2026 Astatine contributors.

The license applies to this repository's original code, documentation, and brand assets.
Third-party dependencies remain under their own licenses. The project is provided "as is", without
warranty, and is not fit for clinical or operational use.

## Contribution guidance

Contributions are welcome when they preserve the project's boundaries.

Before significant work, open an issue describing the problem, the proposed surface, and its data
class. Keep changes scoped; do not add unrelated features, speculative abstractions, or dependencies
without a stated need.

A pull request should:

- state which data class it touches and why the category cannot be confused with another;
- include tests for new behavior and accessibility-relevant interactions;
- preserve semantic HTML, keyboard operation, focus behavior, reduced motion, and the 390 CSS px
  layout;
- add no clinical diagnosis, prognosis, treatment, or validation claim;
- add no sensor integration, backend, automatic upload, analytics, or third-party runtime call;
- add no secret, local environment file, real crew health information, or third-party media
  without verified provenance;
- pass `npm run validate` and, for interface changes, `npm run test:e2e`;
- update the relevant document when behavior, data handling, or limits change.

Do not include personal health information in issues, pull requests, test fixtures, or commits.
Report security-sensitive concerns without publishing exploit details or private data.
