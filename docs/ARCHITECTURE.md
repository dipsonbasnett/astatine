# Architecture

**Status:** Foundation (v0.1.0), documentation and demo readiness complete ·
**Last reviewed:** 2026-11-16

## 1. Goals and constraints

Astatine is a static, client-only single-page application. The architecture exists to make three
properties easy to preserve as features are added:

1. **No hidden data movement.** There is no backend, runtime API, analytics, or third-party asset
   request. Browser storage holds interface preferences and only the health records a user
   explicitly records or generates; nothing is uploaded.
2. **No category mixing.** Recorded, simulated, and research content have separate definitions,
   separate storage tables, and separate export sections, and must remain visibly distinct in
   state, UI, and documentation.
3. **No accessibility regression.** Semantic structure, focus management, reduced motion, and
   narrow-screen layout are part of the component contract.

Constraints:

- npm is the package manager; Node.js `>=22.12.0` (CI uses Node 24).
- React 19 + TypeScript 6 strict + Vite 8 + Tailwind CSS 4.
- Static hosting with SPA fallback (Vercel configuration included).
- No runtime environment variables and no secrets.
- No clinical logic, sensor integration, or automatic upload.

## 2. Layered architecture

The diagram shows the seven cooperating parts and the only paths by which data reaches a screen or
a file. Recorded data is the sole input to readiness, crew values, briefs, and reports. Simulated
telemetry is generated separately and excluded from those summaries. Research context is static,
attributed, and never treated as personal data. Privacy controls span every path.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ 1 · USER INTERFACE                                                           │
│ React 19 SPA · BrowserRouter · lazy route chunks · accessible shell          │
│ / · /check-in · /readiness · /crew · /vitals · /mission · /brief             │
│ /reports · /research · /settings · /about · not found                        │
└──────────────┬───────────────────┬───────────────────┬──────────────────────┘
               │ read/write        │ recorded inputs   │ user actions
               ▼                   ▼                   ▼
┌──────────────────────────┐ ┌──────────────────────────┐ ┌─────────────────────────┐
│ 2 · LOCAL DATA LAYER     │ │ 3 · DOMAIN ENGINES       │ │ 6 · REPORTS & EXPORTS   │
│ localStorage             │ │ pure TypeScript          │ │ recorded report builder │
│  preferences             │ │ check-in validation      │ │ Markdown · JSON · print │
│ IndexedDB `astatine`     │ │ readiness rubric         │ │ local snapshot archive  │
│  checkIns     recorded   │ │ brief · crew · vitals    │ │ local file only         │
│  reportSnapshots recorded│ │ report draft             │ │ no upload               │
│  telemetrySamples simul. │ │ no React · no Dexie      │ │ recorded data only      │
│ no network · no server   │ │ no model                 │ │                         │
└──────────────┬───────────┘ └──────────▲───────────────┘ └──────────▲──────────────┘
               │                        │ recorded records           │ engine output
               │ optional samples       └────────────────────────────┘
               ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│ 4 · SIMULATED TELEMETRY  │   │ 5 · RESEARCH CONTEXT     │
│ seeded PRNG              │   │ static attributed source │
│ labeled "Simulated"      │   │ records and checklist    │
│ never an input to        │   │ registry intentionally   │
│ readiness, crew, brief,  │   │ empty; never personal    │
│ or reports               │   │ data; no training claim  │
└──────────────────────────┘   └──────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│ 7 · PRIVACY CONTROLS (cross-cutting)                                         │
│ no backend or runtime API · no automatic upload · local export               │
│ validated import · scoped deletion with confirmation · preference reset      │
│ storage counts · data-class rule enforced by types, tables, and UI labels    │
└──────────────────────────────────────────────────────────────────────────────┘
```

Data rules:

- **Recorded → summaries → reports.** Check-ins are validated, stored in `checkIns`, read by pure
  engines, and, when requested, copied into `reportSnapshots` or a local export file.
- **Simulated → illustration only.** The mission monitor and vitals simulation generate values at
  display time. The optional sample table is separate and cannot feed recorded surfaces.
- **Research → context only.** The registry module is static and validated. It cannot be joined to
  a person, a check-in, or a readiness score.
- **Nothing leaves the device.** Reports and exports are user-initiated local files. There is no
  backend, queue, analytics, or third-party runtime request.

### Runtime context

```text
Browser
├── Static assets from the site origin
│   ├── HTML shell
│   ├── JavaScript route chunks
│   ├── CSS and favicon
│   └── No font, image, analytics, or API requests elsewhere
├── React application
│   ├── BrowserRouter and lazy routes
│   ├── Design-system components
│   ├── Feature engines and repositories
│   └── Preferences provider + minimal Zustand data store
├── localStorage: astatine.preferences.v1
│   └── { callsign?: string, motion: "system" | "reduced" }
└── IndexedDB: astatine (Dexie)
    ├── checkIns          # recorded, crew-entered
    ├── reportSnapshots   # recorded, derived from check-ins
    └── telemetrySamples  # simulated generator output

Hosting (Vercel)
├── SPA rewrite: /(.*) -> /index.html
├── Security headers and CSP
└── Standard request logs under the host's policy
```

There is no server-side application, database, queue, scheduler, or authentication service. The
IndexedDB database is local to the browser profile and is never synchronized.

## 3. Stack and rationale

| Concern       | Choice                                   | Rationale                                                               |
| ------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| UI runtime    | React 19                                 | Mature ecosystem, testability, and team familiarity                     |
| Routing       | React Router 7 (`BrowserRouter`)         | Nested layout routes, lazy modules, and accessible `NavLink` state      |
| Language      | TypeScript 6, strict                     | Compile-time protection for a small, safety-sensitive interface         |
| Build         | Vite 8 (Rolldown)                        | Fast development and a small static production output                   |
| Styling       | Tailwind CSS 4 via `@tailwindcss/vite`   | Utility composition with tokens defined in CSS, no separate config file |
| Local data    | Dexie 4 (IndexedDB)                      | Typed tables, schema versions, transactions, and additive migrations    |
| UI data state | Zustand 5                                | One small data-revision/status store, not a general app store           |
| Unit tests    | Vitest 5 + Testing Library + jsdom       | Same transform pipeline as the app; behavior-focused queries            |
| Data tests    | Vitest + `fake-indexeddb`                | Real Dexie code against an in-memory IndexedDB implementation           |
| Browser tests | Playwright 1.65 + `@axe-core/playwright` | Real layout, keyboard, viewport, and automated accessibility checks     |
| Lint/format   | ESLint 10 flat config, Prettier 3        | Deterministic quality gate with zero warnings                           |
| Hosting       | Vercel static SPA configuration          | Rewrites, cache policy, and security headers without a server           |

Version constraints are deliberate. TypeScript is pinned to the 6.0 line because the current
typescript-eslint range does not support TypeScript 7. Vitest 5 and the React plugin target Vite 8.
Do not run unbounded `latest` upgrades without checking peer ranges and the full validation gate.

## 4. Source layout

```text
src/
├── app/
│   ├── App.tsx              # Router, providers, database boot
│   ├── AppRoutes.tsx        # Lazy page routes and not-found route
│   ├── AppLayout.tsx        # Shell, skip link, navigation, main, footer, live region
│   ├── routes.ts            # Route metadata: label, title, group, status, data class context
│   └── useRouteEffects.ts   # Document title, focus, scroll, and announcement
├── components/
│   ├── brand/               # Original monogram and lockup
│   ├── feedback/            # Error boundary
│   ├── layout/              # Sidebar, mobile header, nav, footer, page header, related surfaces,
│   │                        # database notice
│   ├── settings/            # Local export, import, and deletion controls
│   └── ui/                  # Button, Card, Input, Select, Badge, SourceBadge, Skeleton, alerts, modal
├── features/
│   ├── checkin/             # Check-in fields, validation, repository, form, hook
│   ├── telemetry/           # Seeded simulation engine, repository, demo UI
│   ├── readiness/           # Weighted rubric, simulated trend generator, panel, snapshot details
│   ├── crew/                # Pooled recorded crew summary, privacy filtering, and overview UI
│   ├── countermeasures/     # Coach items, plan builder, and the verified research library
│   ├── mission/             # Simulated plan and timeline engine, monitor snapshot, monitor UI
│   ├── brief/               # Read-only seven-day briefing builder, text export, document UI
│   ├── reports/             # Snapshot builder, recorded report engine, Markdown/JSON export,
│   │                        # preview document, and archive UI
│   ├── vitals/              # Display-time vitals snapshot, seeded device simulation, and
│   │                        # procedural organ illustrations
│   └── research/            # Dataset provenance guards, registry, checklist, and context UI
├── lib/
│   ├── cn.ts                # Small class-name joiner; no runtime dependency
│   ├── constants.ts         # Name, tagline, repository URL, build version
│   ├── data-policy.ts       # The three data categories and their copy
│   ├── db.ts                # Dexie schema, versions, IDs, and error mapping
│   ├── validation.ts        # Pure runtime guards shared by storage and import
│   ├── data-transfer.ts     # Local export bundle, validation, merge import
│   ├── data-privacy.ts      # Counts and per-class deletion operations
│   └── format.ts            # Locale-stable date and decimal formatting
├── pages/                   # One lazy-loaded module per route
├── preferences/             # Schema, normalization, storage, context, hook
├── state/
│   └── app-store.ts         # Zustand: database status, error, data revision
├── styles/
│   ├── index.css            # Tailwind import plus token and base layers
│   ├── tokens.css           # @theme design tokens
│   └── base.css             # Base element, focus, selection, motion, dialog styles
├── types/
│   └── health.ts            # Shared domain and provenance types
└── test/                    # Setup, render helper, fixtures, and colocated tests

e2e/                         # Playwright route, accessibility, shell, and health-flow specs
.github/workflows/ci.yml     # Quality and browser jobs
```

Tests are colocated with the code they cover. End-to-end specs live at repository root because
they exercise the built application rather than a module. Domain engines are pure functions with no
React or Dexie imports; repositories own persistence; UI imports both.

## 5. Boot and routing

`index.html` loads `/src/main.tsx`, which mounts `<App />` in `StrictMode`. `App.tsx` composes:

```text
BrowserRouter
└── PreferencesProvider
    └── AppRoutes
        └── AppLayout (element route)
            ├── SkipLink / Sidebar / MobileHeader
            ├── DatabaseStatusNotice
            ├── ErrorBoundary (reset by pathname)
            │   └── Suspense -> RouteFallback
            │       └── Outlet -> lazy page
            ├── Footer
            └── RouteAnnouncement (polite, visually hidden)
```

`App.tsx` also calls `initializeDatabase()` once on mount. The call opens the Dexie database,
sets the store status to `ready`, and surfaces mapped storage failures through a non-blocking
notice instead of a render crash.

### Route table

| Path         | Page      | Status    | Notes                                                                |
| ------------ | --------- | --------- | -------------------------------------------------------------------- |
| `/`          | Overview  | Available | Orientation and boundaries                                           |
| `/check-in`  | Check-in  | Available | Recorded self-report and optional daily practices                    |
| `/readiness` | Readiness | Available | Recorded rubric, coach, and labeled simulated trend                  |
| `/crew`      | Crew      | Available | Pooled recorded adherence, workload, band, and gaps; no roster       |
| `/vitals`    | Vitals    | Available | Recorded gaps, labeled simulation, research context, and organ views |
| `/mission`   | Mission   | Available | Simulated clock and synthetic telemetry; no live feed                |
| `/brief`     | Brief     | Available | Read-only seven-day self-report briefing; nothing stored             |
| `/reports`   | Reports   | Available | Recorded 7/14-day review, exports, and local snapshot archive        |
| `/research`  | Research  | Available | Integrity workflow, onboarding gate, and empty validated registry    |
| `/settings`  | Settings  | Available | Preferences and local data controls                                  |
| `/about`     | About     | Available | Scope, principles, project links                                     |
| `*`          | Not found | Available | Recovery links                                                       |

`routes.ts` is the metadata source for navigation labels, grouping, document titles, and the route
list used by tests. Every route in this build is available; a surface that is not ready must not be
represented by a dead link or fabricated content.

### Lazy loading and transitions

Each page is a separate dynamic import. `Suspense` shows a skeleton fallback with a concise status
role. Because chunks are local static assets, no third-party request is made.

### Route effects

`useRouteEffects`:

- sets `document.title` from route metadata;
- after the first render, moves focus to the `<main>` element with `preventScroll` and resets the
  window scroll position;
- returns a short announcement such as "Settings page" or "Page not found."

Skipping the first render avoids stealing focus on initial load. `main` has `tabIndex={-1}` so it
can receive programmatic focus without appearing in the tab order. The announcement is rendered in
a polite live region in the layout.

### Hosting fallback

Direct loads such as `/settings` depend on the SPA rewrite to `/index.html`. Without that rewrite,
static hosting returns a 404 before React starts. The included `vercel.json` owns this rule.

## 6. Design system

### Tokens

`src/styles/tokens.css` defines a Tailwind `@theme` block; there is no `tailwind.config.*`.
Semantic names, not raw hex values, are used in components.

| Group    | Tokens                                                                          |
| -------- | ------------------------------------------------------------------------------- |
| Surfaces | `canvas`, `surface`, `raised`, `overlay`, `line`, `line-strong`, `line-control` |
| Text     | `ink`, `ink-muted`, `ink-subtle`                                                |
| Accent   | `accent`, `accent-strong`, `accent-ink`                                         |
| Danger   | `danger`, `danger-surface`                                                      |
| Type     | `display`, `title`, `label`, system sans, telemetry mono                        |
| Layout   | `shell` container, `prose` measure, responsive `page-x`, `page-y`, `section`    |
| Radius   | `control` (0.625rem), `panel` (1rem)                                            |

The dark surface palette was chosen first; contrast ratios were computed before page styling and
are recorded in [ACCESSIBILITY.md](ACCESSIBILITY.md).

### Component layers

- **Primitives** encapsulate accessible behavior and variant styles. Button uses a variant helper
  rather than a component library. Input and Select own label, hint, and error association through
  generated IDs. Modal wraps native `<dialog>`.
- **Layout components** own navigation structure, page headers, footer policy access, and the
  empty and unavailable-state patterns. They do not contain feature data.
- **Pages** compose those pieces. Overview, Check-in, Readiness, Crew, Brief, Vitals, Mission,
  Reports, Research, Settings, and About are working surfaces. Mission is a client-only,
  deterministic simulation; nothing it displays is stored or sent. The brief is composed from
  recorded data at display time and stores nothing. Crew pools recorded check-ins at display time
  for one local profile; it has no roster or member store and never reads simulated or research
  data. Vitals builds its recorded snapshot, simulated device series, and organ monitor at display
  time and stores none of them; recorded gaps stay visible. One verified source appears inside the
  readiness countermeasure coach and, where applicable, the Vitals sleep and exercise views.
  Research displays the integrity workflow and an empty dataset registry rather than ingesting
  data.

### HMC dashboard and reviewed local media

The `/` route is a simulated vitals dashboard with a visually hidden `Dashboard`
heading for screen-reader structure. The five primary links are Dashboard, Reports,
Vitals, Settings, and Profile;
existing Check-in, Readiness, Crew, Mission, Brief, Research, and About routes remain
available under Workspace. `/profile` exposes existing browser-local preferences and
privacy links, not an account or new health-data store.

- `src/features/hmc/HmcDashboard.tsx` composes the dashboard. Existing route Suspense,
  error boundary, database notice, keyboard navigation and native-dialog focus handling
  remain in place. Missing simulation samples render an explicit unavailable state.
- `dashboard-data.ts` requests one-minute samples from the existing seeded Vitals
  generator without changing its default two-hour cadence. The 15-minute, 1-hour,
  6-hour and 24-hour controls filter timestamps from the same generated series. While the
  simulated session runs, the window advances one simulated minute per second and new
  samples enter at the right edge; existing timestamps keep their generated values.
  The pause control freezes charts and clock together, and nothing reads a sensor,
  network, or personal record.
- `TelemetryChart.tsx` renders straight SVG segments with timestamp-based positions,
  numeric axes and endpoints. Heart rate, saturation, and blood pressure have separate
  scales; systolic is solid and diastolic is dashed. A numerical table exposes every
  sample. Scales are display domains, not clinical reference ranges.
- Recovery bars reuse the existing seven-day synthetic generator. Their arbitrary units
  have no clinical or predictive meaning and do not affect recorded readiness. No model,
  research registry, personal record repository, sensor, or API is read by this dashboard.
- The local session clock shares the pause control with chart advancement. Pausing freezes
  both; restarting starts a new demonstration, not a real mission. No backend connection or
  healthy/stable status is fabricated. Profile callsigns are recorded preferences, while
  HMC-DEMO-01 identifies a fictional simulation, never the selected user's health.
- `src/styles/hmc.css` reuses the existing navy `#070b12`, surface `#0b111b`, teal
  `#5eead4`, ink `#edf3fa`, and gray `#94a3b8` tokens. System sans and system monospace
  avoid remote fonts. The desktop sidebar occupies approximately 14% of the viewport;
  narrow screens retain the existing keyboard-operated mobile disclosure. Small screens
  stack charts without combining incompatible measurement scales.

The original SVG fallbacks were authored for Astatine on 2026-11-16 under the repository
MIT license. The supplied model is **not** covered by that blanket asset claim; its
CC BY 4.0 terms apply. The user-supplied background video is bundled with the owner's
confirmed publication rights, not an independently verified license.

| Asset                                  | Origin and integration                                                                                                                                                  | SHA-256                                                            |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `public/hmc/astronaut.svg`             | Original concept suit and connected platform; 6,085 bytes. Loading, reduced-motion, model-error and no-WebGL fallback.                                                  | `a330d6b3214d0292b46e280a39dbcfffa7fd644767565f26231622d380dca47b` |
| `public/hmc/orbital.svg`               | Original procedural Earth-like horizon, not observational imagery; 2,256 bytes. Static fallback.                                                                        | `c3f6d2992e80d04946d1b9bdf79d5e8248a80e8e91d176855675fb679b3f3374` |
| `public/hmc/dashboard-background.webm` | User-supplied silent dashboard loop used as the active background; 809,106 bytes. Bundled with owner-confirmed publication rights.                                      | `169a95ecffa2957013daba3f9df883c4b68de998ebb42cb6a8ff681aa35b083e` |
| `public/hmc/astronaut-unbranded.glb`   | Modified Jungle Jim model, CC BY 4.0; 1,782,960 bytes. Four badge/insignia meshes removed, including flag-style shoulder geometry; re-exported without unused geometry. | `d2e1a8946c9400f83745700653ed1082724436a59f6127d01af07e71946f8dc3` |

Model attribution: [Astronaut by Jungle Jim](https://sketchfab.com/3d-models/astronaut-by-jungle-jim-c775a977606a4e4e990afe783c6bc845),
by [Jungle Jim](https://sketchfab.com/jungle_jim), licensed under
[Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).
The source page and embedded license were checked on 2026-11-16. Astatine contributors
removed badge/insignia meshes and added studio lighting and camera framing; the earlier
runtime platform was removed on 2026-11-17. Credit, license link and modification notice
appear beneath the model and remain in the derived GLB metadata. No affiliation or
endorsement is implied.
Four model angles and five representative timestamps of the background video were reviewed;
that review is not a guarantee of ownership or source. The owner confirmed publication rights
on 2026-11-17, so the silent WebM is bundled and checksum-pinned. The source MP4 and the
derived WebM in `essentials/` are not staged.

`node scripts/prepare-hmc-media.mjs` checks the original input hashes, writes the reviewed
model and video derivatives to `public/hmc`, archives the video derivative in `essentials`,
and never modifies the original inputs. Input hashes:
`astronaut.glb`: `b60ccce157bbbda177deda47e29bff248e00765f757ebc9fe04e064e50f96046`;
`dashboard-background.mp4`: `f3a84c95ed8a17634294e4a6855f14f89c32117d141b9491308129dd70908b0e`.
The MP4 originally contains AAC audio; the audio is not present in the bundled WebM.
Encoding is browser-dependent; regeneration requires new visual, audio and checksum
review. Do not stage `essentials`.

`Astronaut.tsx` dynamically imports `astronaut-scene.ts` only outside reduced motion
and where WebGL2 is available. Three.js loads one local, texture-free GLB. The scene
renders only after loading and resizing, with device-pixel ratio capped at 1.5. A
`requestAnimationFrame` loop revolves the astronaut slowly with no platform and no sensor
connection; the loop stops and GPU resources are disposed on unmount. Load, parsing and context-loss failures retain the
original SVG without affecting telemetry. `DashboardBackground.tsx` autoplays the bundled
`dashboard-background.webm` muted with a dark overlay and pause control, pauses in hidden tabs,
and avoids video requests under OS/app reduced motion. Codec/network/autoplay failure retains
`orbital.svg`. Attribution links do not trigger external requests unless followed.

The release verifier retains the 1,000 kB core-app budget, 500 kB ordinary JS-chunk
budget and 100 kB CSS budget. The exact-path, checksum-pinned media caps are 1,800 kB for the
model and 900 kB for the background video. The sole exclusively lazy renderer chunk has a
650 kB cap. The combined artifact cap is 4,500 kB.
No arbitrary GLB/video, remote resources or new network API exceptions are allowed; Vercel/CSP
settings are unchanged. Passing artifact checks does not establish media publication rights.

### Styling rules

- Utilities in TSX; `@apply` is limited to base element styles.
- No inline style attributes except runtime animation state for organ illustrations (duration and
  play state).
- No remote fonts or images. The favicon is a local SVG authored for the project.
- Monospace is reserved for values and labels that read as telemetry, not for body copy.
- Motion is minimal and disabled under `prefers-reduced-motion` or the explicit reduced preference.

## 7. State and persistence

State is split by purpose. UI state stays local to components, durable records live in typed
IndexedDB tables, and one small Zustand store coordinates database readiness and refetching.

### Zustand surface

`src/state/app-store.ts` contains only:

- `databaseStatus`: `idle` | `ready` | `error`;
- `databaseError`: a user-facing message or `null`;
- `dataRevision`: a counter incremented after a successful write or deletion;
- `initializeDatabase`, `refreshData`, and `reportDatabaseError` actions.

Initialization is deduplicated with a module-level promise. Feature hooks read `dataRevision` and
refetch when it changes. Records are not copied into global state, so there is no second source of
truth to desynchronize from IndexedDB.

### Preferences schema

```json
{
  "callsign": "optional, normalized, max 32 characters",
  "motion": "system"
}
```

- Storage key: `astatine.preferences.v1`. The version suffix makes a future schema change explicit.
- Reads are defensive: unknown shapes fall back to defaults; storage access is wrapped so a
  blocked or unavailable `localStorage` does not crash the app.
- The callsign is normalized by replacing control characters with spaces and truncating to 32
  characters. React escapes rendered text.
- Writes occur synchronously on change, not on a timer. The context keeps a ref so callbacks do not
  capture stale preference values.
- Reset removes the key and returns to defaults.
- The motion preference sets `data-motion="reduced"` on the document element, which base CSS uses
  in addition to the media query.
- Preferences remain separate from health records. Resetting preferences never deletes records.

### Recorded and simulated data (Dexie)

Database name `astatine`; schema version 2. Every record carries an id, `createdAt`, `updatedAt`,
and a typed `source` object that identifies its data class and origin.

| Table              | Class     | Contents                                                                       | Indexes                                                        |
| ------------------ | --------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `checkIns`         | Recorded  | Six 1–5 ratings, sleep hours, optional daily-practice counts, observation time | `id`, `observedAt`, `createdAt`, `source.category`             |
| `reportSnapshots`  | Recorded  | Frozen check-in copy, readiness, countermeasure plan, caveats                  | `id`, `createdAt`, `source.category`                           |
| `telemetrySamples` | Simulated | Generator output, unit, signal quality, scenario and seed                      | `id`, `scenarioId`, `channel`, `capturedAt`, `source.category` |

Research content is static and attributed; it is not stored in this database. Dataset provenance
records live in a static, validated repository module (`RESEARCH_DATASETS`), never in IndexedDB.
Recorded surfaces never read `telemetrySamples`, and reports copy recorded fields only.

Version 1 declared the check-in and telemetry stores. Version 2 adds snapshots, category indexes,
and an upgrade that backfills `updatedAt` and `source` on legacy rows. Released version blocks are
never edited; future schema changes add a new version with an additive upgrade.

### Validation and writes

Pure guards in `src/lib/validation.ts` validate timestamps, scale values, telemetry ranges, and
provenance shapes. Repositories validate a draft before writing, wrap Dexie transactions, and map
storage failures to `DataLayerError` codes (`unavailable`, `blocked`, `quota`, `validation`,
`version`, `unknown`). The database is opened on boot; failures appear in a retryable notice rather
than a crash.

### Engines and explainability

Feature engines are pure functions independent of React and Dexie:

- the check-in engine validates and stamps crew-entry records, including optional daily practices;
- the readiness engine applies a published, weighted rubric over a 7- or 14-day window and returns
  per-factor inputs, scores, coverage, band, confidence with reasons, missing data, actions, and
  caveats;
- the recovery-trend generator produces a deterministic simulated series at display time; it is
  explicitly flagged as not affecting readiness and is never persisted;
- the countermeasure engine builds six explainable coach items and a ranked snapshot plan, and
  attaches verified research context only where a source exists;
- the telemetry engine produces deterministic simulated samples from a seeded PRNG;
- the vitals engine assembles seven views over a 7- or 14-day window from recorded check-ins and a
  deterministic device simulation. Recorded, simulated, and research context stay in separate
  series and are never merged into one score or conclusion;
- the crew engine pools recorded check-ins into completion, sleep regularity, exercise adherence,
  logging, workload and fatigue, and recovery-band metrics with explicit coverage and data gaps.
  It emits no raw ratings, record ids, roster, team score, or medical interpretation, and it cannot
  read simulated or research data;
- the mission and research engines validate plans and attributed entries and build timelines or
  filtered context;
- the dataset integrity engine validates the 12-field provenance record, privacy and training
  branches, duplicate ids and source URLs, and formats citation, attribution, verification, and
  training-disclosure lines. Its registry ships intentionally empty;
- the report engine freezes a check-in, readiness assessment, and countermeasure plan into a
  snapshot draft that must match the source check-in, and composes a recorded mission report over a
  7- or 14-day window. The report carries identity, timestamp, selected period, data-source labels,
  readiness, adherence, the mission brief, recorded lifestyle vitals, gaps, escalation language, and
  limits. Simulated and research data and private notes are structurally excluded.

No engine predicts medical events or produces an opaque score. Simulated telemetry and the
simulated recovery trend are never inputs to readiness or reports.

### Export, import, and deletion

`src/lib/data-transfer.ts` defines `astatine.local-export` version 1 with separate `recorded` and
`simulated` sections. Import is bounded to 5 MB and 10,000 records per section, validates every
record and provenance object, rejects duplicate ids, and merges with `bulkPut` inside one
transaction. `src/lib/data-privacy.ts` provides counts and scoped deletion for recorded data,
simulated data, or everything. Report review exports serialize the same visible report to Markdown
or JSON, and the print stylesheet renders that document to a light, paginated layout. Every export
includes report identity, timestamp, period, source labels, a privacy notice, and the disclaimer,
and private notes stay excluded unless explicitly enabled. All operations are local; none contacts
a server.

### Storage limits

There is no encryption. IndexedDB is origin-scoped browser storage, not a secure medical vault.
The browser may evict local data under storage pressure. Export is the only backup path, and it is
user-initiated.

## 8. Accessibility architecture

- Landmarks: header, navigation with label, main, footer. Desktop and mobile navigation do not
  expose duplicate active landmarks to assistive technology at the same breakpoint.
- Skip link targets the focusable main region.
- `NavLink` render props set `aria-current="page"` and a visible active style.
- The mobile navigation is a disclosure, not a modal: the trigger has `aria-expanded` and
  `aria-controls`; Escape closes it and restores focus; navigation closes it.
- Dialog uses native `<dialog>` and `showModal()`, preserving platform focus trapping and inert
  background behavior. Escape emits the same close path as the close button.
- Form fields have explicit labels, descriptions, and error associations. Required vs optional
  state is stated in text.
- Focus is visible with a 2 px accent outline and offset on all interactive elements.
- Interactive controls meet a 44 px minimum target, including small buttons and icon-only controls.
- Reduced motion is honored from system preference and the in-app preference.
- Icons are decorative and hidden; every icon-only control has an accessible name.

Detailed evidence and limitations are in [ACCESSIBILITY.md](ACCESSIBILITY.md).

## 9. Error handling

- A top-level error boundary catches render errors below the shell. It replaces the route content
  with a recovery state that states no data was uploaded, offers a reload, and links home. It is
  keyed by pathname so navigation can recover from a failed route.
- The boundary logs to the browser console only. There is no error-reporting network call.
- Storage failures are mapped to `DataLayerError` and shown in an inline notice or a retryable
  banner. Record writes fail closed: nothing is written when validation or storage fails.
- Export and import failures are reported inline. Import validation reports up to five specific
  record issues and writes nothing when any record is invalid.
- Async route loading failures surface through React's rendering path; there is no retry UI yet.
- A 404 route handles unknown paths with keyboard-accessible recovery links.

## 10. Security and privacy

- **CSP** (hosting configuration): default, script, style, image, font, and connect sources are
  restricted to the site origin (with inline styles and data images allowed where required by the
  build); objects are blocked; framing is denied; form submission is disabled.
- **No network surface:** there is no fetch/XHR/WebSocket code, no analytics, and no third-party
  runtime asset.
- **No secrets:** no environment files or credentials are required or committed.
- **Untrusted input:** the callsign, numeric check-in ratings, and imported JSON files. The
  callsign is normalized and rendered by React; ratings are validated against a 1–5 scale and a
  0–16 hour bound; imports are size-limited and validated record by record. No input is inserted as
  HTML, used in a URL, or sent to a server.
- **Storage:** `localStorage` for preferences and IndexedDB for health records are origin-scoped but
  not encrypted. XSS would expose them. The app avoids `dangerouslySetInnerHTML`, URL parameters,
  and remote scripts, and the CSP narrows script sources. Deletion controls remove records rather
  than hiding them.
- **Headers:** the deployment config sets content-type protection, frame denial, referrer policy,
  and a restrictive permissions policy. HSTS is intentionally not set in the repository because it
  belongs to domain-level deployment policy.

CSP and headers are applied by the host, not by the Vite development server. Verify them on a real
deployment.

## 11. Testing architecture

| Layer         | Tool                         | Covers                                                                       |
| ------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| Unit          | Vitest + Testing Library     | Engines, guards, primitives, forms, dialogs, storage, settings               |
| Data layer    | Vitest + `fake-indexeddb`    | Schema upgrade, repositories, export/import, scoped deletion                 |
| Integration   | Testing Library + real Dexie | Check-in → readiness → coach; check-in → readiness → brief → report → export |
| Browser       | Playwright (two projects)    | Route integrity, health flow, 390 px reflow, keyboard, dialogs               |
| Accessibility | axe-core via Playwright      | WCAG A/AA rules on every route and on populated health views                 |
| Static        | TypeScript, ESLint, Prettier | Type invariants, lint rules, formatting                                      |
| CI            | GitHub Actions               | Clean install, quality gate, browser suite, failure artifacts                |

Unit tests use a MemoryRouter and the real preferences provider. Database tests use
`fake-indexeddb`; the shared test setup clears all tables after each test. jsdom lacks dialog
methods, so the test setup shims them; native behavior is verified in Playwright. The browser suite
runs against a production build and preview server, not the development server.

## 12. Build and hosting

- `npm run build` runs `tsc -b` and `vite build`; output is `dist/`.
- `npm run build:release` runs the same type-check and an explicit `vite build --outDir dist
--emptyOutDir`, then verifies the artifact with `scripts/verify-release.mjs`. The verifier enforces
  the `dist/` allowlist, hashed asset names, the import graph, route chunks, size budgets, secret
  patterns, runtime network APIs, and the SPA and security-header settings in `vercel.json`.
- The version shown in the UI is injected at build time from `package.json` via the `__APP_VERSION__`
  define. There is no second version constant to drift.
- Assets are content-hashed and served with immutable cache headers by the included Vercel config.
- `vercel.json` sets the framework, SPA rewrite, and security headers. No environment variables are
  required.
- The app uses `BrowserRouter`, so non-root direct loads require the rewrite.

## 13. Extending the system

When adding a feature:

1. **Classify first.** Write down whether the data is recorded, simulated, or research, plus where
   it lives and when it is deleted. If the answer is "a mix," split the surface.
2. **Update policy and product docs.** Add the storage row, limits, and review decision before
   implementation.
3. **Keep modules boring.** Add a page under `src/pages`, register it in `routes.ts`, and put
   domain logic in a pure engine under `src/features`. Persistence belongs in a repository that
   targets the owning data-class table. Do not add an engine that reads a table of another class.
4. **Version the schema, not just the data.** Add a Dexie version with an additive upgrade and
   indexes. Validate every draft before write and every import before merge. Provide scoped
   deletion for the new class.
5. **Label in the UI.** Every simulated block says "Simulated"; every research block carries its
   citation; every recorded surface says it is browser-local and non-clinical.
6. **Do not add network calls** without an explicit architecture and data-policy change.
7. **Test the contract.** Add engine tests, repository/import tests where persistence changes, a
   route entry in browser tests, an axe scan, and a 390 px overflow check. Add keyboard cases for
   any new interaction.
8. **Document limitations.** Update the known-limitations sections rather than implying coverage
   that does not exist.

## 14. Known limitations

- No backend, accounts, synchronization, or automatic backup. Export is a manual local file.
- No offline/service-worker support; a reload requires the host to be reachable.
- Dark theme only; no light theme, high-contrast theme, RTL, or localization.
- No manual screen-reader or real-crew usability validation has been completed.
- Native `<dialog>` behavior depends on a modern evergreen browser.
- IndexedDB is not encrypted and may be evicted by the browser under storage pressure. Preference
  writes fail silently when storage is blocked; database failures are surfaced with a retry notice.
- The mission monitor is a deterministic display-time simulation. It receives no flight data, reads
  no sensors, stores nothing, and its synthetic readings are excluded from readiness and reports.
  One verified source is shown inside the readiness countermeasure coach; the Research surface
  presents the integrity workflow and the onboarded OSD-942 research record.
- The readiness rubric is a fixed heuristic over self-reported values. It is not validated, not
  personalized by a model, and not a clinical or fitness-for-duty assessment.
- The simulated recovery trend is a deterministic illustration. It is not derived from recorded
  data history and carries no physiological meaning.
- The main bundle is approximately 375 kB (119.5 kB gzip), with the route CSS at approximately
  38.3 kB (7.9 kB gzip) and route chunks loaded on demand. The release verifier enforces a 500 kB
  per-chunk and 1,000 kB total artifact budget.
- There is no automated migration test against a real browser profile, only `fake-indexeddb`.
- CSP and headers are not exercised in local preview; they require deployment verification.
- Automated accessibility scans catch only a subset of WCAG issues.
- There is no automated visual regression or cross-browser matrix beyond Chromium.
- Automated generated telemetry is synthetic and carries no physiological meaning.

## 15. Dependency policy

- Prefer platform APIs and a small amount of local code over a package.
- Runtime dependencies require a stated user-facing need and a privacy review.
- Development dependencies must not add network behavior to the deployed app.
- Upgrade one major at a time, read peer ranges, update the lockfile, and run
  `npm run validate` plus `npm run test:e2e`.
- Never run `npm audit fix --force` during a release. Review advisories and their reachability;
  tooling-only issues are tracked but do not justify breaking the pinned toolchain.
- The current lockfile includes a moderate advisory chain in a development-only lint dependency.
  It is not shipped to the browser; see the release notes in [RELEASE.md](RELEASE.md).
