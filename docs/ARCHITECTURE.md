# Architecture

**Status:** Foundation (v0.1.0) · **Last reviewed:** 2026-11-16

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

## 2. System context

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
│   ├── countermeasures/     # Coach items, plan builder, and the verified research library
│   ├── mission/             # Simulated plan and timeline engine, monitor snapshot, monitor UI
│   ├── brief/               # Read-only seven-day briefing builder, text export, document UI
│   ├── reports/             # Snapshot builder, validator, repository, archive UI
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

| Path         | Page      | Status    | Notes                                                             |
| ------------ | --------- | --------- | ----------------------------------------------------------------- |
| `/`          | Overview  | Available | Orientation and boundaries                                        |
| `/check-in`  | Check-in  | Available | Recorded self-report and optional daily practices                 |
| `/readiness` | Readiness | Available | Recorded rubric, coach, and labeled simulated trend               |
| `/vitals`    | Vitals    | Available | Simulated telemetry only; no sensor input                         |
| `/mission`   | Mission   | Available | Simulated clock and synthetic telemetry; no live feed             |
| `/brief`     | Brief     | Available | Read-only seven-day self-report briefing; nothing stored          |
| `/reports`   | Reports   | Available | Recorded check-in snapshots and local archive                     |
| `/research`  | Research  | Available | Integrity workflow, onboarding gate, and empty validated registry |
| `/settings`  | Settings  | Available | Preferences and local data controls                               |
| `/about`     | About     | Available | Scope, principles, project links                                  |
| `*`          | Not found | Available | Recovery links                                                    |

`routes.ts` is the metadata source for navigation labels, grouping, document titles, availability,
and the route list used by tests. A route is "planned" until product and data-policy gates pass;
the planned state is a real page, not a dead link.

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
  planned-feature pattern. They do not contain feature data.
- **Pages** compose those pieces. Overview, Check-in, Readiness, Brief, Vitals, Mission, Reports,
  Research, Settings, and About are working surfaces. Mission is a client-only, deterministic
  simulation; nothing it displays is stored or sent. The brief is composed from recorded data at
  display time and stores nothing. One verified source appears inside the readiness
  countermeasure coach. Research displays the integrity workflow and an empty dataset registry
  rather than ingesting data.

### Styling rules

- Utilities in TSX; `@apply` is limited to base element styles.
- No inline style attributes except where a primitive needs runtime state (none currently).
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
- the mission and research engines validate plans and attributed entries and build timelines or
  filtered context;
- the dataset integrity engine validates the 12-field provenance record, privacy and training
  branches, duplicate ids and source URLs, and formats citation, attribution, verification, and
  training-disclosure lines. Its registry ships intentionally empty;
- the report engine freezes a check-in, readiness assessment, and countermeasure plan into a
  snapshot draft that must match the source check-in.

No engine predicts medical events or produces an opaque score. Simulated telemetry and the
simulated recovery trend are never inputs to readiness or reports.

### Export, import, and deletion

`src/lib/data-transfer.ts` defines `astatine.local-export` version 1 with separate `recorded` and
`simulated` sections. Import is bounded to 5 MB and 10,000 records per section, validates every
record and provenance object, rejects duplicate ids, and merges with `bulkPut` inside one
transaction. `src/lib/data-privacy.ts` provides counts and scoped deletion for recorded data,
simulated data, or everything. All operations are local; none contacts a server.

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

| Layer         | Tool                         | Covers                                                         |
| ------------- | ---------------------------- | -------------------------------------------------------------- |
| Unit          | Vitest + Testing Library     | Engines, guards, primitives, forms, dialogs, storage, settings |
| Data layer    | Vitest + `fake-indexeddb`    | Schema upgrade, repositories, export/import, scoped deletion   |
| Integration   | Testing Library + real Dexie | Check-in → readiness → coach and check-in → report snapshot    |
| Browser       | Playwright (two projects)    | Route integrity, health flow, 390 px reflow, keyboard, dialogs |
| Accessibility | axe-core via Playwright      | WCAG A/AA rules on every route and on populated health views   |
| Static        | TypeScript, ESLint, Prettier | Type invariants, lint rules, formatting                        |
| CI            | GitHub Actions               | Clean install, quality gate, browser suite, failure artifacts  |

Unit tests use a MemoryRouter and the real preferences provider. Database tests use
`fake-indexeddb`; the shared test setup clears all tables after each test. jsdom lacks dialog
methods, so the test setup shims them; native behavior is verified in Playwright. The browser suite
runs against a production build and preview server, not the development server.

## 12. Build and hosting

- `npm run build` runs `tsc -b` and `vite build`; output is `dist/`.
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
  presents the integrity workflow but contains no dataset.
- The readiness rubric is a fixed heuristic over self-reported values. It is not validated, not
  personalized by a model, and not a clinical or fitness-for-duty assessment.
- The simulated recovery trend is a deterministic illustration. It is not derived from recorded
  data history and carries no physiological meaning.
- The main bundle is approximately 374 kB (119 kB gzip) with route chunks loaded on demand; no
  bundle-budget test is configured yet.
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
