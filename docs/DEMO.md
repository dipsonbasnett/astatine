# Demo script

**Audience:** judges, new contributors, mission-support stakeholders · **Length:** 3 minutes ·
**Last reviewed:** 2026-11-16

This script demonstrates the shipped local-only build with synthetic values. It does not require
accounts, credentials, a backend, or network access beyond the local app. Read the claim boundaries
in [JUDGES.md](JUDGES.md) before presenting.

## Before you start

1. Use a clean browser profile or a dedicated demo profile. Do not enter real health information.
2. Run either:
   - `npm install && npm run dev` and open `http://localhost:5173`, or
   - `npm ci && npm run build && npm run preview` and open `http://localhost:4173`.
3. Set browser zoom to 100% and a desktop viewport of at least 1280 px wide. Keep a second window
   at 390 px wide if you want to show the mobile layout.
4. Clear site data for the origin before the demo so the empty states are honest.
5. Keep [docs/ARCHITECTURE.md](ARCHITECTURE.md), [docs/DATA_POLICY.md](DATA_POLICY.md), and
   [docs/RESEARCH.md](RESEARCH.md) open in another window as fallback references.

Use only the synthetic values below. The readiness band is computed by the fixed rubric; it is not
scripted, and it is not a judgment about a person.

## Three-minute narrative

### 0:00–0:20 — Overview: the problem and the boundaries

Open `/`.

> "Astatine is a local-first workspace for crew health context in simulated long-duration
> missions. The hard problem is not making a dashboard. It is keeping three things from blurring:
> what a crew member recorded, what a simulation is demonstrating, and what published research
> says. The home page is a simulated operations dashboard, and its boundary notice, chart names,
> and sample table keep that distinction visible."

Point to the **Operating boundaries** card: data residency is this browser, live sensors are none,
automatic uploads are none, clinical use is not intended. Click **Record a check-in**.

### 0:20–0:50 — Check-in: recorded, local, and explicit

On `/check-in`:

1. Leave **Sleep duration (hours)** at `7.5`.
2. Set **Fatigue** to `5 · Very high`.
3. In **Daily practices (optional)**, set **Workload** to `5 · Very high`.
4. Optionally enter `30` planned minutes, `20` completed minutes, and `3` hydration log entries.
5. Click **Save check-in**.

> "Every value here is self-report. Optional blanks stay missing, not zero. The success message
> says the record is saved in this browser, and the links make the next step explicit."

Do not describe the values as measurements or clinical observations.

### 0:50–1:20 — Readiness: explainable, not diagnostic

Click **Review recovery readiness**.

> "The rubric is fixed and published: sleep duration 25%, sleep regularity 15%, exercise adherence
> 20%, workload and fatigue 40%. Four scored factors; completion, hydration logging, and nutrition
> logging are context and confidence inputs. There is no AI model and no hidden weighting."

Point to the band, the per-factor meters, the confidence explanation, and the visible missing-data
notes. With the values above, the band is **Rest and recover**. Click **14 days** and then **7 days**
to show the window change.

> "The trend below is simulated, labeled 'Not used in readiness,' generated at display time, and
> never stored. The coach suggests routines, not treatment. Only sleep and exercise carry a
> verified public NASA Human Research Program link; other items say no verified source is linked."

### 1:20–1:35 — Crew: one profile, no roster

Open `/crew`.

> "This pools recorded check-ins on this device into completion, sleep regularity, exercise
> adherence, logging, workload and fatigue, bands, and data gaps. It is one local profile. There is
> no roster, no team score, no member attribution, and no simulated or research data in these
> values."

Click **14 days** and then **7 days** to show the pooled window. Point to the privacy notice.

### 1:35–2:05 — Vitals: three classes, three sections

Open `/vitals`.

> "Each view shows recorded self-report, a simulated demonstration, and reference or research
> context in separate cards. They are never combined into one series or one score."

Point to the **Recorded self-report**, **Simulated demonstration**, and **Research context** cards
under **Heart rate**. Note the "Recorded" gap remains empty when nothing was recorded. Switch to
**Sleep and recovery** to show the attributed research context reuse. Point out that the organ
illustration is procedural SVG/CSS, requires no WebGL, and can pause while staying visible.

Do not imply that any displayed value was measured by a sensor or describes a real person.

### 2:05–2:20 — Mission: simulation without operational authority

Open `/mission`.

> "This is a deterministic simulated clock and synthetic telemetry. It receives no flight data,
> connects to no sensors, stores nothing, and is excluded from readiness and reports."

Click **Pause simulation**, then **Resume simulation**. Do not describe the mission state as
operational.

### 2:20–2:45 — Reports: recorded-only review and local export

Open `/reports`.

1. Click **14 days**, then **7 days**.
2. Point to the report identity, period, source labels, readiness, adherence, brief, recorded
   vitals, and gaps.
3. Click **Download Markdown**. Mention that the file is created locally and the app did not upload
   it.
4. Toggle **Include private notes (opt-in)** on and off. Note that this build stores no free-text
   notes and never invents them.
5. If time allows, click **Create report snapshot** and point to **Snapshot saved**.

> "Simulated and research content are structurally excluded. This is not a medical document and
> not a clinical record."

### 2:45–3:00 — Research, settings, and close

Open `/research`.

> "One dataset record (OSD-942) passed the 12-field provenance contract, 13-item checklist, five
> verification checks, license review, and privacy review. It is cited context only. Astatine has
> no trained model and no NASA endorsement."

Open `/settings` and point to **Recorded check-ins**, **Report snapshots**, **Simulated telemetry
samples**, and **Automatic uploads: None**. Optionally open **Delete all health data** and cancel it
to show the confirmation boundary. Do not delete data unless you are resetting the demo.

> "Everything stays in this browser until the user deletes it. There is no backend, analytics, or
> automatic upload. Recorded, simulated, and research content stay separate by design."

## Screen-by-screen walkthrough

| Route        | What to show                                                   | Exact interactions                                                  | Talking points                                                                  | Data class                    |
| ------------ | -------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------- |
| `/`          | Boundary card, feature cards, data-class section               | Click **Record a check-in**                                         | Problem, local-only, no sensors or uploads, no clinical use                     | —                             |
| `/check-in`  | Self-ratings, optional practices, local-only notice            | Fatigue `5`, Workload `5`, **Save check-in**                        | Self-report, blanks stay missing, browser-local, not a medical record           | Recorded                      |
| `/readiness` | Band, factor meters, confidence, trend, coach                  | Toggle **14 days**, **7 days**; open a research link only if useful | Fixed weights, no AI model, simulated trend excluded, routine suggestions       | Recorded + labeled simulation |
| `/crew`      | One-profile summary, metrics, gaps                             | Toggle **14 days**, **7 days**                                      | No roster, no team score, no member attribution, no simulated/research values   | Recorded                      |
| `/vitals`    | Recorded, simulated, reference, research cards; organ tabs     | Switch **Heart rate** → **Sleep and recovery**; pause organ motion  | Three classes never merge; no sensors; SVG/CSS organ; research is context       | All three                     |
| `/mission`   | Mission clock, progress, synthetic snapshot                    | **Pause simulation**, **Resume simulation**                         | Deterministic display-time demo; no flight data, no storage                     | Simulated                     |
| `/brief`     | Seven-day recorded brief, missing data, copy action            | Click **Copy brief as text** if time                                | Read-only, display-time, not clinical or operational                            | Recorded                      |
| `/reports`   | Report builder, preview, export status, snapshot archive       | Toggle period; **Download Markdown**; **Create report snapshot**    | Recorded-only, simulated/research excluded, local file, not uploaded            | Recorded                      |
| `/research`  | Onboarded dataset, checklist, source verification, UI patterns | Scroll the checklist and five verification steps                    | One OSD-942 record; provenance before display; no training claim                | Research                      |
| `/settings`  | Preferences, stored counts, export/import/delete               | Show counts; open **Delete all health data**, then **Cancel**       | Local preferences, scoped deletion, no automatic uploads, storage not encrypted | —                             |
| `/about`     | Problem, principles, scope, repository link                    | Click **View repository** only if network is available              | Independence, MIT license, explicit excluded scope                              | —                             |

## Fallback plan if live interaction fails

Use the first fallback that works. Do not invent a result, show a recorded value that was not
actually created, or claim a download or deployment succeeded when it did not.

1. **Dev server fails:** stop it, run `npm ci && npm run build && npm run preview`, and open
   `http://localhost:4173`.
2. **Browser storage is blocked:** open a fresh browser profile or a new incognito window. Recorded
   values will be local to that session. If IndexedDB still fails, say so and switch to the
   documentation path; do not describe the empty state as a completed check-in.
3. **A download is blocked:** explain that the action creates a local file and show the on-screen
   status text. Do not claim a file exists. Printing can be skipped.
4. **The NASA link does not open:** use the provenance record in [RESEARCH.md](RESEARCH.md). Do not
   paraphrase beyond the bounded claims, and do not imply endorsement.
5. **Time is short:** prioritize Overview → Check-in → Readiness → Reports → Research → Settings.
   Skip Mission, Brief, Crew, and Vitals rather than skipping the privacy and safety boundaries.
6. **The app will not run at all:** walk through [ARCHITECTURE.md](ARCHITECTURE.md),
   [DATA_POLICY.md](DATA_POLICY.md), and [JUDGES.md](JUDGES.md), then show the passing test output
   from `npm test` or `npm run test:e2e`. State clearly that the demonstration is unavailable.

## Closing statement

> "Astatine is a small, honest foundation for a hard domain. It makes recorded self-report useful
> without pretending to be clinical, keeps simulated and research content visibly separate, and
> keeps all health data in the browser. The next step is release verification, not a clinical
> claim. Real clinical use would require validation, regulatory review, security and privacy
> controls, and clinician oversight that this project does not claim."

Do not end with a diagnosis, a risk prediction, a fitness-for-duty statement, a NASA endorsement,
or a claim that any model was trained on NASA data.
