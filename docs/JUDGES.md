# Judge and evaluator FAQ

**Project:** Astatine · **Version:** 0.1.0 · **Last reviewed:** 2026-11-16

Astatine is an open-source, local-first application for crew-facing health context in simulated
long-duration missions. It records self-reported check-ins, explains a fixed readiness rubric, keeps
simulated telemetry visible as simulation, and shows attributed research context without treating it
as personal data. It has no backend, no live sensors, and no automatic upload.

Astatine is **not** a medical device, is **not** clinically validated, and is **not** affiliated
with, endorsed by, or clinically validated by NASA or any other agency. One public NASA OSDR
dataset (OSD-942, CC0-1.0) is onboarded as cited research context; no model was trained.

## Quick answers

| Question                     | Short answer                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| What is it?                  | A local-first health-context workspace for a simulated mission setting.                                                     |
| Who is it for?               | Crew members in analog or simulated missions, evaluators, and contributors — not clinicians or flight surgeons.             |
| What does it store?          | Recorded check-ins, derived report snapshots, optional simulated telemetry samples, and UI preferences, all in the browser. |
| Is anything uploaded?        | No. There is no backend, analytics, or automatic health-data upload.                                                        |
| Is there an AI model?        | No. Readiness is a fixed, published rubric.                                                                                 |
| Is there sensor integration? | No. All recorded values are self-report.                                                                                    |
| Is it clinical?              | No. It does not diagnose, predict events, treat, or determine fitness for duty.                                             |
| NASA relationship            | None. One public NASA HRP page and one public NASA OSDR dataset (OSD-942) are cited as bounded context only.                |
| License                      | MIT.                                                                                                                        |
| Repository                   | https://github.com/dipsonbasnett/astatine                                                                                   |

## What problem does Astatine solve?

Crew health tooling can blur three very different things: what a person recorded, what a simulation
is demonstrating, and what a publication or agency says. A single combined score makes that worse.
Astatine instead provides a small, accessible workflow where:

- recorded self-report produces transparent, explainable summaries;
- simulated content is labeled and structurally excluded from recorded summaries;
- research context is attributed, bounded, and never treated as personal data; and
- data stays in the browser, with explicit local export, import, and deletion.

The problem statement and scope are in [PRODUCT.md](PRODUCT.md). Data rules are in
[DATA_POLICY.md](DATA_POLICY.md).

## What data does Astatine use?

**Recorded data (the only source for personal summaries):**

- Check-in values: sleep duration, sleep quality, fatigue, mood, soreness, stress, hydration
  self-rating, optional workload, optional planned and completed exercise minutes, and optional
  hydration or nutrition log-entry counts.
- A local callsign and interface preferences.
- Derived report snapshots created on request.

**Simulated data:** a deterministic mission clock and synthetic telemetry for heart rate,
respiratory rate, and skin temperature, plus display-time vital-sign demonstrations for heart rate,
SpO2, and blood-pressure-style values. Simulated samples are display-time content; if the user
chooses to save one, it is tagged as simulated and remains separate from recorded data.

**Research data:** static, attributed context records. The shipped build cites one public NASA
Human Research Program page and one onboarded de-identified public dataset (OSD-942, CC0-1.0)
shown as non-personal research context.

**Not used:** live sensor data, device pairing, accounts, backend records, location, contacts, or
third-party analytics. The report interface includes an opt-in private-notes statement, but this
build stores no free-text notes.

## How does it protect privacy?

- **Local persistence:** IndexedDB (`astatine` database) for health records and `localStorage` for
  interface preferences. No server round-trip for health data.
- **No upload path:** no API client, no backend, no automatic synchronization, no analytics.
- **Scoped deletion:** delete recorded data, simulated data, or all health data from Settings, each
  behind a confirmation dialog.
- **User-controlled transfer:** export creates a local JSON file; import validates the bundle and
  every record before writing.
- **Defensive headers:** Content Security Policy, `X-Frame-Options: DENY`, and a restrictive
  `Permissions-Policy` are configured for deployment.
- **Honest limits:** browser storage is not encrypted at rest by Astatine; anyone with access to the
  browser profile or device may be able to read it. Import files are plain JSON and should be
  handled as sensitive. The app does not claim HIPAA, GDPR, or other compliance.

Details: [DATA_POLICY.md](DATA_POLICY.md), [ARCHITECTURE.md](ARCHITECTURE.md).

## How are recorded, simulated, and research data separated?

The separation is structural, not just visual:

- **Recorded** values come from check-ins and are the only input to readiness, crew summaries, the
  brief, and reports.
- **Simulated** telemetry is generated deterministically and labeled "Simulated" and "Not sensor
  data." The readiness trend is generated at display time, marked "Not used in readiness," and never
  stored. Simulated samples are excluded from readiness, crew, brief, and report calculations.
- **Research** context is a static citation record with a bounded claim, limitations, publisher, and
  access date. The registry holds one de-identified public dataset record (OSD-942) used only as
  cited context, and research is never counted as personal data, simulated data, or evidence about
  the user.

Each data class has its own badge, source label, and section. See
[DATA_POLICY.md](DATA_POLICY.md) and [RESEARCH.md](RESEARCH.md).

## What does Astatine explicitly not claim?

- It does not diagnose any condition, predict a medical event, recommend treatment, or provide
  clinical validation.
- It does not determine fitness for duty, flight safety, or operational status.
- It does not monitor in real time and cannot detect an emergency.
- It does not measure hydration, nutrition, sleep quality, or recovery; logging counts and
  self-report are not physiological measurements.
- It does not present simulated data as recorded or sensor data.
- It does not present research as personal data, and it does not claim that any model was trained on
  NASA data.
- It does not claim NASA endorsement, partnership, or clinical validation.
- It does not produce a team score, rank people, or attribute pooled values to a teammate.

The in-app caveats and escalation text are the authority. Documentation must not exceed them.

## How are readiness suggestions generated?

Readiness is a fixed rubric, not a model, and not a recommendation system in the clinical sense.
There are seven displayed inputs:

| Input                | Weight | Role                                             |
| -------------------- | -----: | ------------------------------------------------ |
| Sleep duration       |    25% | Scored; affects band                             |
| Sleep regularity     |    15% | Scored; needs at least three check-ins           |
| Exercise adherence   |    20% | Scored; paired planned/completed minutes per day |
| Workload and fatigue |    40% | Scored; uses the latest check-in                 |
| Check-in adherence   |     0% | Context and confidence only                      |
| Hydration logging    |     0% | Context and confidence only                      |
| Nutrition logging    |     0% | Context and confidence only                      |

- Sleep duration scores 100 inside a general 7–9 h reference band and decreases with distance from
  it. Sleep regularity is based on the standard deviation of recorded sleep duration. Exercise
  adherence compares completed with planned minutes. Workload and fatigue average the two
  self-ratings after inversion. These are rubric rules, not clinical targets.
- Missing scored factors are **not** imputed. The available scored factors are combined by their
  published weights, renormalized over the available weight, and the interface reports coverage and
  missing data. A band is described only when at least 0.35 of the scored weight is present.
- **Ready:** weighted score 75+ with at least 0.6 scored weight and every scored factor at 55+.
  **Monitor:** weighted score 50+. **Rest and recover:** weighted score below 50 **or** any scored
  factor below 35. **Insufficient data:** too little scored input.
- Suggestions are selected from fixed templates for the lowest-scoring factors (at most three).
  They describe routines and logging, not treatment, and the UI says not to change operational
  duties on that basis alone.
- The simulated recovery trend is never an input. Every output is labeled with the recorded source.

Implementation: `src/features/readiness/readiness-engine.ts`. The full formula string is displayed
in the interface.

## What research sources are used?

The shipped build cites one public source record:

- **NASA Human Research Program** — https://www.nasa.gov/hrp/ — accessed 2026-11-16. Two bounded
  claims are attached to sleep and exercise context. The app states that Astatine is not affiliated
  with, endorsed by, or clinically validated by the cited agency.

The dataset registry contains one onboarded record (OSD-942); other candidates were reviewed for
provenance, licensing, and privacy feasibility but are **not ingested**, not used for training,
and not shown as evidence about any user. Research display requires the 12-field provenance
record, the 13-item
checklist, the five verification checks, license review, and privacy review described in
[RESEARCH.md](RESEARCH.md).

No model exists, and no NASA data or onboarded dataset was used to train a model. Astatine makes
no NASA endorsement claim.

## What future work is planned?

Release verification is the next step: a final quality gate and an owner-controlled deployment.
Beyond that, carefully gated candidates include:

- additional accessibility and browser-compatibility evidence;
- provenance-complete research records **only** after the review gate passes;
- optional, clearly separated device-data adapters would require a new privacy and validation
  design and are **not** part of this build; and
- broader documentation and contributor onboarding.

Out of scope unless the product boundaries change: accounts, backend synchronization, automatic
upload, clinical claims, live sensor integration, and any model trained on agency data. The roadmap
is in [PRODUCT.md](PRODUCT.md) and the top-level [README](../README.md).

## What would be required for clinical use?

Nothing in this build qualifies for clinical use. A clinical product would need, at minimum:

- **Clinical evidence:** prospective validation of any score or alert against meaningful outcomes,
  with published performance and limitations.
- **Regulatory status:** correct device classification and clearance or approval in each market
  (for example FDA review in the United States or MDR conformity in the EU), plus labeling that
  matches the cleared intended use.
- **Quality and safety systems:** a quality management system, software lifecycle controls such as
  IEC 62304, risk management such as ISO 14971, usability engineering such as IEC 62366, and
  post-market surveillance.
- **Security and privacy controls:** threat modeling, encryption in transit and at rest, access
  control, audit logging, incident response, and applicable health-privacy compliance.
- **Validated inputs:** clinically validated sensors or instruments, calibration, and data-quality
  handling rather than self-report.
- **Clinical governance:** clinician oversight, escalation pathways, real-time monitoring if
  claimed, and clear responsibility for decisions.
- **Operational evidence:** independent security and privacy review, penetration testing,
  availability and data-integrity guarantees, and staff training.

Astatine provides none of these, and its documentation says so.

## Where to look next

| Topic                    | Document                             |
| ------------------------ | ------------------------------------ |
| Three-minute demo        | [DEMO.md](DEMO.md)                   |
| Product scope and stages | [PRODUCT.md](PRODUCT.md)             |
| Technical design         | [ARCHITECTURE.md](ARCHITECTURE.md)   |
| Data classes and rules   | [DATA_POLICY.md](DATA_POLICY.md)     |
| Research gate            | [RESEARCH.md](RESEARCH.md)           |
| Accessibility evidence   | [ACCESSIBILITY.md](ACCESSIBILITY.md) |
| Release process          | [RELEASE.md](RELEASE.md)             |
| Setup and scripts        | [README.md](../README.md)            |
