# Product

**Status:** Foundation (v0.1.0) · **Last reviewed:** 2026-11-16

Astatine is a browser-based health-intelligence surface for **simulated** long-duration space
missions. This document defines who it serves, the principles that constrain it, what the
foundation includes, and the gates a future feature must pass.

Astatine is not a medical device, clinical decision-support system, or operational mission tool.
It does not diagnose, predict medical events, recommend treatment, or claim clinical validation.

## 1. Users and context

| Audience                               | Primary need                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Crew members in simulated missions     | A calm, legible place to orient, eventually record their own context, and understand what is stored     |
| Mission-support stakeholders           | Confidence that the interface separates crew-entered context from demonstrations and research           |
| Medical-review stakeholders            | Clear product limits, provenance, and a reviewable data policy before any health-adjacent surface ships |
| Open-source contributors and reviewers | A small, testable foundation with explicit boundaries and extension rules                               |

The v0.1.0 build implements a local check-in → readiness → countermeasure-coach loop, a read-only
mission health brief, report snapshots, a clearly labeled simulated telemetry demonstration, a
deterministic simulated mission monitor, and a research integrity workflow with a validated but
intentionally empty dataset registry. No surface receives flight data.

## 2. Problem

Health-adjacent interfaces carry a trust problem that ordinary dashboards do not. Users infer
authority from polish. Demonstration data is mistaken for a record. A cited research finding is
read as a personal result. A crew-entered note is treated as clinical input. In a small crew
interface, those confusions are difficult to detect after the fact.

The product problem is to make three things visible at all times:

1. **What this surface is** — a simulated-mission foundation, not care.
2. **Where information comes from** — recorded, simulated, or research.
3. **What the system will not do** — diagnose, predict, treat, monitor, or upload.

## 3. Product thesis

> A health-adjacent product earns trust first by showing its limits, then by being usable.

Astatine therefore invests in:

- an accessible, low-noise shell that remains readable under stress and on a narrow screen;
- a data-classification model that is expressed in the interface, not only in policy documents;
- honest planned states instead of fabricated metrics, disabled fake forms, or sample "patient"
  records;
- local-only preferences with a visible reset path;
- automated accessibility and privacy-regression checks.

## 4. Experience principles

### Calm, not clinical theater

Deep navy surfaces, restrained gray hierarchy, one cyan accent, generous whitespace, and a single
display moment per page. No decorative gradients, glowing rings, scanning grids, or sci-fi
clichés. Monospace appears only where a telemetry-like value is genuinely being shown, currently
the build version and data-class labels.

### Legible structure

One page heading, short sections, plain language, and a clear distinction between "available" and
"planned." Status is written as text, not encoded only by color.

### Boundaries in the interface

The footer privacy notice opens a data-policy dialog. Planned pages state their intended data
class. The home page names residency, sensors, uploads, clinical use, and build version as
product boundaries. This is the pattern future features must follow.

### Local by default

Preferences, recorded check-ins, report snapshots, and generated telemetry stay in this browser
and in separate stores. The simulated recovery trend is generated at display time and never
persisted. No account, backend, analytics, or third-party runtime service exists.

### Accessible by contract

Keyboard operation, visible focus, semantic landmarks, native dialog behavior, reduced motion,
and no horizontal overflow at 390 CSS px are release requirements. Details and evidence live in
[ACCESSIBILITY.md](ACCESSIBILITY.md).

## 5. Foundation scope

### Included

- Application shell with desktop sidebar and mobile disclosure navigation.
- Ten routes plus an accessible not-found state; every route renders a working surface.
- Design tokens for color, type, spacing, container, and radius.
- Primitives: Button, Card, Input, Select, Badge, Skeleton, EmptyState, ErrorState, Alert, Modal.
- Recorded check-in flow with six self-ratings, sleep duration, and optional workload and
  daily-practice entries, validated and stored locally.
- Recovery readiness with a fixed, published rubric, 7-day and 14-day windows, weighted
  contributing factors, confidence, missing-data awareness, escalation guidance, and a clearly
  labeled simulated trend that is excluded from the band.
- Countermeasure coach covering check-in completion, sleep, exercise, hydration logging,
  nutrition logging, and workload/recovery balance, with one verified NASA Human Research Program
  source cited where it applies and explicit "no verified source" states elsewhere.
- Mission health brief: a read-only, copyable briefing of the seven-day recorded window with
  scored and context factors, the latest self-report, suggested focus, visible missing data, and
  explicit limits. It is composed at display time, not stored, and never describes the mission,
  the crew, or operational status.
- Report snapshots derived only from recorded check-ins and their countermeasure plan, with a
  local archive.
- Seeded simulated telemetry in a separate table, labeled at every point of display and excluded
  from readiness and reports.
- Simulated live mission monitor: a deterministic five-phase mission clock with pause, resume, and
  restart, active-phase progress, and a synthetic telemetry snapshot. Nothing is stored, nothing is
  sent, and the surface states that it receives no flight data.
- Research integrity workflow: a 12-field dataset provenance contract, a 13-item onboarding
  checklist, a five-step source verification record, license and attribution validation, and
  research-context UI patterns. The registry is intentionally empty; no dataset is ingested.
- Local export, validated import, and scoped deletion for recorded and simulated data.
- Local callsign and motion preferences with normalization, failure tolerance, and reset.
- Route title, focus, scroll, and live-announcement behavior.
- Error boundary, database status notice, privacy notice, data-policy dialog, and documentation.
- Unit, data-layer, integration, Playwright, and axe checks at desktop and 390 CSS px, CI, and
  Vercel-ready static hosting configuration.

### Excluded

- Manual vital-sign entry, symptom logs, device pairing, or live sensor integration.
- Live flight data, telemetry ingestion from real systems, or operational mission scheduling.
- Dataset ingestion or browsing; the research integrity workflow exists, but no dataset is
  downloaded or displayed.
- Backend, accounts, synchronization, sharing, or automatic upload.
- Clinical scoring, risk prediction, alerts, triage, diagnosis, prognosis, or treatment guidance.
- Clinical validation, regulatory clearance, or claims of fitness for real missions.
- Analytics, advertising, third-party fonts, CDNs, and copied media.
- Simulated patient records or fabricated crew histories.

## 6. Roadmap and gates

Roadmap order is indicative, not a commitment. Each stage is independently reviewable.

| Stage | Surface             | Intent                                                                         | Status and gate                                                                       |
| ----- | ------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| 0     | Foundation          | Shell, design system, policy, accessibility, tests                             | Complete in v0.1.0                                                                    |
| 1     | Check-in            | Crew-entered self-ratings and optional daily practices with explicit labels    | Implemented locally; no diagnosis, prediction, or opaque score                        |
| 2     | Readiness and coach | Explainable rubric, missing-data awareness, and non-diagnostic countermeasures | Implemented locally; simulated trend excluded; one verified source                    |
| 3     | Vitals              | Clearly labeled simulated telemetry; manual vital entry remains future         | Simulated demonstration implemented; no sensor or device integration                  |
| 4     | Mission             | Simulated mission context and timeline                                         | Implemented as a labeled display-time simulation; no live feed or sensor input        |
| 5     | Reports             | Recorded check-in and countermeasure snapshots with provenance and limitations | Implemented locally; not a clinical document and not uploaded                         |
| 6     | Research            | Cited, verified public context with visible provenance                         | Integrity workflow shipped; registry intentionally empty; one in-context coach source |
| 7     | Brief               | Read-only seven-day self-report briefing with explicit limits                  | Implemented; composed at display time and not stored                                  |

### Universal feature gate

A feature may ship only when all of the following are true:

- Its data class is assigned and the interface labels it consistently.
- Recorded, simulated, and research content cannot be merged or relabeled by the UI or storage
  layer.
- It adds no automatic network transmission of user-entered content.
- It makes no diagnostic, prognostic, treatment, or clinical-validation claim.
- It has unit coverage for behavior, browser coverage at 390 CSS px and desktop, and an axe scan.
- It preserves keyboard access, focus order, visible focus, reduced motion, and semantic headings.
- It documents storage, retention, deletion, and provenance in [DATA_POLICY.md](DATA_POLICY.md).
- It has a rollback path and no irreversible data migration in the first release.

## 7. Foundation success criteria

The foundation is successful when:

- `npm run validate` and `npm run test:e2e` pass from a clean install.
- Every route exposes exactly one level-one heading and the correct document title.
- All routes pass the configured axe rule set in both Playwright projects.
- No route scrolls horizontally at 390 CSS px.
- Keyboard-only operation covers navigation, the mobile disclosure, settings, check-in, report
  creation, and every dialog.
- The app makes no third-party network requests during the browser suite.
- A reload preserves preferences and recorded check-ins; reset removes the preference key without
  deleting records.
- A recorded check-in produces a transparent readiness band, contributing factors, missing-data
  states, a non-diagnostic countermeasure coach, and a local report snapshot; the simulated trend
  is labeled as excluded and simulated telemetry never appears in any recorded view.
- Export, validated import, and scoped deletion pass data-layer tests.
- Documentation matches implementation, including known limitations.

These criteria demonstrate engineering quality, not clinical validity or usability with real
crew populations.

## 8. Risks and mitigations

| Risk                                                  | Mitigation                                                                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Planned previews read as unfinished or deceptive      | Explicit "Planned" badge, data-class label, design-intent and boundary cards, recovery link                 |
| Simulated data is mistaken for recorded data          | Separate IndexedDB table, visible "Simulated" labels, exclusion from readiness and reports, import guards   |
| A trend or citation is read as a personal result      | Trend flagged "Not used in readiness" and never stored; citation framed as program context with limitations |
| Research is mistaken for personal medical information | Research class is cited context only; no personalization; provenance rules in RESEARCH.md                   |
| Interface polish implies clinical authority           | Repeated non-clinical statements; transparent rubric inputs; no opaque score, alerts, or diagnosis          |
| Browser-local data is assumed private from the device | Copy states "stored in this browser only"; scoped deletion; no encryption claim; deviceless scope stated    |
| Accessibility regressions during feature work         | Automated axe, keyboard and reflow checks, manual checklist, contribution requirements                      |
| Dependency drift breaks a pinned toolchain            | Exact major constraints, lockfile, CI on Node 24, documented upgrade procedure                              |
| Version and docs drift                                | Version injected from `package.json`; release checklist includes documentation review                       |

## 9. Measurement and privacy

There is no product analytics pipeline. Evaluation of this foundation must use synthetic or
simulated content, must not collect real crew health information, and must not add network calls
without an explicit data-policy change. Any future usability study requires separate review of
consent, data handling, and retention.

## 10. Decision record

| Date       | Decision                                               | Rationale                                                                            |
| ---------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 2026-11-16 | Browser-local only; no backend or accounts             | Keeps the foundation honest about privacy and removes an unnecessary attack surface  |
| 2026-11-16 | No clinical claims or diagnosis anywhere               | Product is not validated for care and must not imply otherwise                       |
| 2026-11-16 | Fixed, visible readiness rubric; no opaque model       | Shows inputs, confidence, missing data, and caveats instead of an unexplained score  |
| 2026-11-16 | Typed Dexie schema with separate class tables          | Makes provenance and category separation structural rather than cosmetic             |
| 2026-11-16 | Explicit planned states instead of sample data         | Avoids fabricated records and protects the recorded/simulated distinction            |
| 2026-11-16 | Original icons, favicon, and system fonts              | Avoids unverified third-party assets and runtime font requests                       |
| 2026-11-16 | Native `<dialog>` with a custom React wrapper          | Uses platform focus and backdrop behavior without a modal dependency                 |
| 2026-11-16 | Optional callsign as the only profile-style preference | Makes local persistence tangible without collecting health information               |
| 2026-11-16 | Seeded generator, not sensor simulation                | Demonstrates labeling and storage without implying measurement or device accuracy    |
| 2026-11-16 | Weighted readiness rubric with visible coverage        | Makes bands explainable and keeps missing data visible instead of silently scoring   |
| 2026-11-16 | Simulated trend generated at display time, excluded    | Adds a labeled illustration without contaminating readiness, reports, or storage     |
| 2026-11-16 | One verified research source; honest no-source copy    | Ships sourced context where it is bounded and admits where no verified source exists |
| 2026-11-16 | Dataset onboarding gate; registry intentionally empty  | Makes provenance, license, privacy, and training claims checkable before ingestion   |

## 11. Open product questions

These require explicit review before the relevant stage:

- What recorded fields are genuinely useful to crews in simulation without implying clinical
  assessment?
- Local JSON export and validated import exist; should recorded data ever leave the device by any
  other route, and what confirmation and provenance label would that require?
- How should a crew member correct or annotate a past entry without creating a misleading audit
  trail? Check-ins are currently append-only.
- Which research sources meet the provenance bar for the dedicated Research surface, and who
  reviews them on an ongoing basis? The integrity workflow and candidate list are documented, but
  no reviewer roster or dataset has been approved.
- What manual assistive-technology testing and crew usability work is required before beta?
- Does any future surface need a clinical reviewer, and what does that review cover?

## 12. Related documents

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATA_POLICY.md](DATA_POLICY.md)
- [RESEARCH.md](RESEARCH.md)
- [ACCESSIBILITY.md](ACCESSIBILITY.md)
- [RELEASE.md](RELEASE.md)
