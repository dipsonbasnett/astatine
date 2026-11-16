# Astatine

**Mission-ready health intelligence for human spaceflight.**

Astatine is an open-source web foundation for crew-facing health context during simulated
long-duration missions. This release adds the first flagship loop: a recorded check-in feeds an
explainable readiness assessment and a non-diagnostic countermeasure coach, while data classes stay
visibly separate. It is not a clinical product and it does not monitor anyone.

> **Status:** v0.1.0, foundation build. Not medical care. Not a diagnostic, monitoring, or
> emergency tool. No live sensors, no backend, and no automatic health-data upload.

## Problem statement

Long-duration missions compress many kinds of information into a small, shared interface:
what a crew member chose to record, what a simulation is demonstrating, and what published
research says. In simulation and mission-support settings, those categories are easy to blur.
A polished dashboard can imply clinical authority it does not have, and a demo can be mistaken
for a real record.

The problem this project addresses is therefore not only presentation. It is **legible
boundaries**: crews and mission-support stakeholders need a calm, accessible place to orient
themselves, while the interface must make data provenance and product limits unmistakable
before any health-adjacent feature is added.

Primary users are crew members in simulated long-duration missions. Secondary users are
mission-support and medical-review stakeholders who need to understand what the product does,
what it does not do, and where its information comes from.

## Solution overview

Astatine establishes the product's operating surface and its first local health loop:

- A responsive application shell with accessible primary navigation and a mobile disclosure.
- A dark, low-glare visual system with one cyan accent, a neutral hierarchy, and monospace
  treatment only for telemetry-style values.
- Reusable primitives: Button, Card, Input, Select, Badge, Skeleton, EmptyState, ErrorState,
  Alert, and Modal.
- Ten routes plus a not-found state. Mission is a deterministic simulated clock and synthetic
  telemetry monitor that receives no flight data, not a fake form or invented flight metrics.
- A research integrity workflow: a validated dataset provenance contract, a 13-item onboarding
  checklist, a five-step source verification record, license and attribution rules, and an
  intentionally empty dataset registry. No dataset is ingested.
- A typed, browser-local IndexedDB data layer that keeps recorded check-ins, derived report
  snapshots, and simulated telemetry in separate tables with explicit provenance.
- A recorded check-in flow with optional daily-practice entries, a fixed-rubric readiness view
  with weighted factors, confidence, missing-data awareness, and 7-day or 14-day windows.
- A read-only mission health brief that composes the seven-day recorded window with visible
  missing data, explicit limits, and a local copy action; nothing is stored.
- A non-diagnostic countermeasure coach covering check-in completion, sleep, exercise, hydration
  logging, nutrition logging, and workload/recovery balance, with one verified NASA source
  cited where it applies and "no verified source" honesty elsewhere.
- A deterministic simulated recovery trend, labeled "Simulated" and "Not used in readiness,"
  generated at display time and never stored.
- Simulated telemetry generated from a seeded scenario, labeled at every point of display and
  excluded from readiness and reports.
- Local export, validated import, and scoped deletion for recorded and simulated data.
- A settings surface for two browser-local preferences, with confirmation before reset.
- Route-change focus and scroll management, page titles, a screen-reader route announcement,
  skip navigation, reduced-motion support, and an error boundary.
- A privacy notice and data-policy dialog that separate **recorded**, **simulated**, and
  **research** content in the product itself.
- Automated unit, data-layer, integration, browser, and accessibility checks, plus CI and
  Vercel-ready hosting configuration.

Nothing in this build accepts sensor input, diagnoses, predicts medical events, or sends health
data anywhere. Overview, Check-in, Readiness, Brief, Vitals, Mission, Reports, Research, Settings,
and About are working surfaces; Mission is a client-only simulation with no live feed.

### Documentation

| Document                                                                                     | Purpose                                                         |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [docs/PRODUCT.md](docs/PRODUCT.md)                                                           | Users, product principles, scope, roadmap, and stage gates      |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)                                                 | System design, routing, state, styling, and extension rules     |
| [docs/DATA_POLICY.md](docs/DATA_POLICY.md)                                                   | The three data classes and the rules that keep them separate    |
| [docs/RESEARCH.md](docs/RESEARCH.md)                                                         | Provenance, citation, and review standards for research context |
| [docs/research/DATASET_ONBOARDING_TEMPLATE.md](docs/research/DATASET_ONBOARDING_TEMPLATE.md) | One-record dataset admission and verification template          |
| [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md)                                               | Accessibility commitments, evidence, and known limitations      |
| [docs/RELEASE.md](docs/RELEASE.md)                                                           | Versioning, validation, deployment, and rollback                |

## Core principles

1. **Boundaries before features.** A feature does not ship until its data class and limits are
   explicit in the interface and the documentation.
2. **Crew-readable calm.** The interface favors legibility, restraint, and low visual noise
   over dashboard density. There are no decorative gradients, sci-fi tropes, or ornamental
   telemetry.
3. **Accessible by default.** Semantic HTML, keyboard operation, visible focus, reduced motion,
   and a 390 CSS px layout are baseline requirements, not follow-up work.
4. **Honest provenance.** Recorded, simulated, and research content are never mixed or
   relabeled. Simulated content is labeled as simulation; research stays cited context.
5. **Local-first privacy.** Browser storage holds preferences and only the health records a user
   explicitly records or generates. There is no backend, analytics, third-party font, CDN, or
   automatic upload; export and deletion are user actions.
6. **No clinical claims.** Astatine does not diagnose, predict medical events, recommend
   treatment, or replace a medical professional.

## Feature roadmap

The current build implements the first local health loop. A "Planned" route would render an
intentional, accessible preview with a stated data class and no working feature logic; every route
in this revision is available.

| Surface   | Route        | Data class | Status    | Scope note                                                         |
| --------- | ------------ | ---------- | --------- | ------------------------------------------------------------------ |
| Overview  | `/`          | —          | Available | Orientation, boundaries, and route discovery                       |
| Check-in  | `/check-in`  | Recorded   | Available | Six self-ratings, sleep duration, and optional daily practices     |
| Readiness | `/readiness` | Recorded   | Available | Explainable rubric, 7/14-day windows, coach, and a simulated trend |
| Vitals    | `/vitals`    | Simulated  | Available | Seeded demonstration telemetry only; no devices or sensor input    |
| Mission   | `/mission`   | Simulated  | Available | Deterministic mission clock and synthetic telemetry; no live feed  |
| Brief     | `/brief`     | Recorded   | Available | Read-only seven-day self-report briefing; nothing stored           |
| Reports   | `/reports`   | Recorded   | Available | Local snapshots of check-ins and countermeasures; never clinical   |
| Research  | `/research`  | Research   | Available | Integrity workflow, checklist, and empty validated registry        |
| Settings  | `/settings`  | —          | Available | Local preferences plus export, import, and deletion controls       |
| About     | `/about`     | —          | Available | Problem, principles, scope, and project links                      |
| Not found | any other    | —          | Available | Accessible recovery links                                          |

Roadmap rules:

- A planned surface must first pass the data-policy review gate in
  [docs/DATA_POLICY.md](docs/DATA_POLICY.md), then the product gate in
  [docs/PRODUCT.md](docs/PRODUCT.md).
- Live sensor integration, automatic upload, backend storage, clinical decision support, and
  clinical-validation claims are out of scope, not merely unscheduled.
- Simulated records remain visibly labeled, live in a separate table, and never populate
  recorded-data views or report snapshots.

## Local development

**Requirements:** Node.js `>=22.12.0` and npm. CI and `.nvmrc` use Node 24; the package engine
floor exists for contributors on a current Node 22 line.

```bash
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173`. The port is strict, so a conflicting process
fails loudly rather than silently moving to another port.

### Available scripts

| Command                    | What it does                                                     |
| -------------------------- | ---------------------------------------------------------------- |
| `npm run dev`              | Start the Vite development server                                |
| `npm run build`            | Type-check the project, then build the production bundle         |
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

React 19, React Router 7, TypeScript 6 in strict mode, Vite 8, Tailwind CSS 4 through the
official Vite plugin, Vitest 5 with Testing Library, Playwright, ESLint 10, and Prettier 3.

The runtime dependency set is intentionally small: React, React DOM, and React Router. The
brand mark and icons are original inline SVG; typography uses system font stacks; there is no
component library, icon package, or webfont. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
for the rationale and version constraints.

## Testing instructions

```bash
npm test
npm run test:e2e:install   # once per machine
npm run test:e2e
```

The unit suite covers primitives, form associations, the modal, preferences, the settings flow,
the error boundary, the route table, skip navigation, route focus/reset behavior, the readiness
rubric and band thresholds, the simulated trend generator, the countermeasure coach, and the
check-in → readiness → coach and check-in → report flows.

`npm run test:e2e` starts its own production build and preview server. Playwright runs every
spec in two projects: desktop (1280×900) and mobile (390×844, touch, DPR 2). The browser suite
checks:

- every route for one page heading, the correct document title, and no horizontal overflow at
  390 CSS px;
- the not-found state;
- axe scans for WCAG 2.0, 2.1, and 2.2 A/AA rules across all routes;
- keyboard route focus, scroll reset, the skip link, the mobile menu, and dialog Escape handling;
- preference persistence across reload and reset;
- a recorded check-in producing a readiness band, contributing factors, a simulated trend
  labeled "Not used in readiness," and a countermeasure coach, including the 14-day toggle;
- that the app makes no third-party network requests.

For the full local gate, run:

```bash
npm run validate
```

CI runs the quality gate and the browser suite on pushes and pull requests; see
`.github/workflows/ci.yml`. Automated checks do not replace manual assistive-technology review;
the current limitations are recorded in [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

## Release instructions

Astatine is a static SPA with no backend, database, or required environment variables.

1. Install exactly: `npm ci`.
2. Run `npm run validate`.
3. Run `npm run test:e2e`.
4. Confirm the version in `package.json`; the app reads that value at build time, so it is not
   duplicated in source.
5. Build with `npm run build` and inspect `dist/`.
6. Let CI pass both required jobs.
7. The repository owner deploys through Vercel. The included `vercel.json` supplies the SPA
   rewrite, immutable asset caching, and security headers. No environment variables are needed.
8. Verify direct route loads, headers, the 390 CSS px layout, keyboard navigation, preference
   persistence, and the data-policy dialog on the deployment.
9. Tag the release and publish notes that repeat the safety statement.

Astatine does not deploy itself and does not include credentials for any platform. Rollback is a
previous-deployment promotion in Vercel or a Git revert; there are no data migrations to reverse.
The full checklist, versioning policy, and post-release steps are in
[docs/RELEASE.md](docs/RELEASE.md).

## Privacy and safety boundaries

- **No clinical use.** Astatine does not diagnose, predict medical events, recommend treatment,
  or claim clinical validation. It is not a medical device and must not be used for care
  decisions or emergencies.
- **No automatic collection.** There is no sensor integration, wearable pairing, backend, or
  automatic health-data upload.
- **No third-party runtime services.** No analytics, advertising, third-party fonts, CDNs, or
  remote API calls are loaded by the app.
- **Browser-local data.** `localStorage` key `astatine.preferences.v1` stores an optional callsign
  (maximum 32 characters) and a motion preference (`system` or `reduced`). IndexedDB database
  `astatine` stores recorded check-ins, derived report snapshots, and simulated telemetry in
  separate tables. Neither store is encrypted. The simulated recovery trend is generated at
  display time and never stored. Data stays in this browser until the user deletes it, resets
  preferences, or clears site data. Local JSON export is user-initiated.
- **Three data classes.** Recorded content is user-entered and browser-local by default.
  Simulated content is clearly labeled demonstration data. Research content is open, cited
  context with verified provenance; the only shipped item links a NASA Human Research Program
  page from the countermeasure coach and is not stored. The dataset registry is intentionally
  empty: no dataset has been downloaded or ingested, and a record appears only after the
  onboarding template and verification gate are complete. The classes are never mixed, and
  simulated or research content is never presented as a crew member's personal data.
- **Hosting metadata.** The app itself sends no health data. A hosting provider may record
  standard HTTP request metadata under its own policy; see [docs/DATA_POLICY.md](docs/DATA_POLICY.md).
- **Content Security Policy.** The deployment configuration restricts scripts and connections
  to the site origin, blocks framing, and disables form submissions.

These are product boundaries, not claims of regulatory compliance. Read the complete rules in
[docs/DATA_POLICY.md](docs/DATA_POLICY.md) and the provenance standards in
[docs/RESEARCH.md](docs/RESEARCH.md).

## License

Astatine is released under the [MIT License](LICENSE). Copyright © 2026 Astatine contributors.

The license applies to this repository's original code, documentation, and brand assets.
Third-party dependencies remain under their own licenses. The project is provided "as is",
without warranty, and is not fit for clinical or operational use.

## Attribution policy

- **Original assets.** The favicon, brand mark, and interface icons were authored for this
  project. They carry no third-party license obligations.
- **No third-party media is bundled.** No stock photography, NASA imagery, video, audio, or
  copied illustration is included.
- **Research links are context, not endorsement.** Sources are cited with publisher, URL, and
  access date where they appear. The countermeasure coach links one verified NASA Human Research
  Program page with two bounded claims and limitations; no page content is copied. A link does not
  imply that the source endorses Astatine.
- **No dataset is ingested.** The research integrity workflow records the fields, checks, and
  approvals a dataset would need, but the registry is empty. No dataset files, figures, tables, or
  participant-level records are bundled. Dataset candidates in the documentation are orientation
  only and were not downloaded.
- **Future assets require provenance.** Any proposed third-party asset must have a public
  source, a verified license that permits this use, a recorded attribution and access date, and
  review before merge. Unverified assets are rejected.
- **Independence.** Astatine is an independent open-source project. References to NASA programs
  or other organizations describe public research context only; no affiliation, sponsorship,
  or endorsement is implied, and no organizational marks are used.

## Contribution guidance

Contributions are welcome when they preserve the project's boundaries.

Before significant work, open an issue describing the problem, the proposed surface, and its
data class. Keep changes scoped; do not add unrelated features, speculative abstractions, or
dependencies without a stated need.

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
