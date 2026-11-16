# Data policy

**Status:** Foundation (v0.1.0), documentation and demo readiness complete ·
**Last reviewed:** 2026-11-16

This policy governs the Astatine repository, the deployed application, its tests, fixtures,
documentation, and any future surface added to the product. It is product design guidance, not
legal advice or a compliance certification.

If a proposed change conflicts with this policy, the policy wins. Change the policy deliberately
through review before changing the product.

## 1. The three data classes

Astatine recognizes exactly three classes of content. Every future surface must declare one before
implementation.

| Class         | Definition                                        | Origin                                   | Default location                        | Required UI treatment                                     |
| ------------- | ------------------------------------------------- | ---------------------------------------- | --------------------------------------- | --------------------------------------------------------- |
| **Recorded**  | User-entered content                              | A crew member or local user              | This browser (IndexedDB)                | Labeled local, non-clinical, and never uploaded           |
| **Simulated** | Clearly labeled demonstration data                | Generated scenarios or authored fixtures | This browser (separate IndexedDB table) | Persistent "Simulated" label at the point of display      |
| **Research**  | Open, properly attributed public research context | Verified external sources                | Static content                          | Citation, publisher, access date, and claim scope visible |

These categories are not themes or visual variants. They are provenance contracts.

### Recorded

Recorded content is entered by a person and kept in the browser by default. It must never be
described as clinical data, a medical record, or a validated measurement. It must never be
uploaded automatically. The current build stores crew-entered check-ins and locally derived report
snapshots in the `checkIns` and `reportSnapshots` IndexedDB tables. Preferences remain separate.
The crew overview adds no record type: it pools recorded check-ins at display time into one local
profile's summary and never reads simulated or research content.

### Simulated

Simulated content demonstrates an interface without representing a real person or event. It must be
visibly labeled as simulation wherever it appears, must never enter a recorded-data store, and must
never be described with clinical authority. The current build generates deterministic synthetic
telemetry into the separate `telemetrySamples` table after an explicit user action. Values are not
sensor measurements, are labeled "Simulated," and are excluded from readiness and reports. The
readiness view also renders a deterministic simulated recovery trend that is generated at display
time, never stored, and marked "Not used in readiness."

### Research

Research content is public, cited context that helps explain the domain. It is not personal data,
not a diagnosis, and not a recommendation. It must carry provenance and must never be personalized
or combined with a crew member's recorded data to imply an individual medical conclusion. The
current build links one verified NASA Human Research Program page beneath the sleep and exercise
countermeasure coach items, labeled "Research context" with a bounded claim and visible
limitations. That context is repository-authored, is not stored in IndexedDB, and is excluded from
readiness scoring, coach status, and report snapshots. Every other coach item states that no
verified research source is linked.

The `/research` surface presents a dataset integrity gate and one onboarded, de-identified public
dataset record (OSD-942, CC0-1.0) with its provenance, limitations, and normalized per-array
summaries. A dataset requires the full provenance record in [RESEARCH.md](RESEARCH.md), a completed
[onboarding template](research/DATASET_ONBOARDING_TEMPLATE.md), a verified license and SHA-256
checksum, a privacy and lawful-basis review where human data is present, and a reviewer sign-off.
No raw dataset file, raw expression table, figure, or directly identifiable participant record is
bundled.

## 2. Non-negotiable rules

1. **Never mix categories.** Recorded, simulated, and research content must not share a storage
   namespace, a table, a chart, a report, or an unlabeled container.
2. **Never present simulated data as recorded or clinical data.** "Demo," a subtle caption, or a
   color alone is insufficient. The word "Simulated" must be attached to the content.
3. **Never present research as personal medical data.** Research is general context, not a result
   about a crew member.
4. **Never diagnose, predict medical events, recommend treatment, or replace a medical
   professional.** No feature may generate a diagnosis, prognosis, triage recommendation,
   fitness-for-duty determination, or emergency instruction.
5. **Never automatically upload health data.** No background sync, analytics beacon, error report,
   or third-party request may carry user-entered content.
6. **Never add a third-party asset without verified provenance and a compatible license.** This
   includes images, icons, fonts, video, audio, datasets, and code snippets.
7. **Never collect real crew health information** in the repository, issues, tests, screenshots,
   or documentation.
8. **Never imply clinical validation.** The product has not been validated for care, and passing
   tests is not validation.

## 3. Current data inventory

### Browser storage

| Store                        | Fields                                                                                                              | Class      | Purpose                      | Retention                                    | Uploaded |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------- | -------------------------------------------- | -------- |
| `astatine.preferences.v1`    | `callsign?: string`                                                                                                 | Preference | Optional local display name  | Until reset or browser data cleared          | No       |
| `astatine.preferences.v1`    | `motion: "system" \| "reduced"`                                                                                     | Preference | Motion preference            | Until reset or browser data cleared          | No       |
| IndexedDB `checkIns`         | Six 1–5 ratings, sleep hours, optional workload and daily-practice counts, observation time, provenance, timestamps | Recorded   | Crew-entered self-report     | Until deleted by the user or browser cleared | No       |
| IndexedDB `reportSnapshots`  | Frozen check-in copy, readiness factors, countermeasure plan, caveats, provenance                                   | Recorded   | Local review snapshot        | Until deleted by the user or browser cleared | No       |
| IndexedDB `telemetrySamples` | Scenario, channel, value, unit, signal quality, generator seed, provenance                                          | Simulated  | Labeled demonstration sample | Until deleted by the user or browser cleared | No       |

Details:

- The callsign is normalized (control characters replaced, maximum 32 characters) and rendered as
  text. It is optional and must not contain health information.
- The motion preference controls interface animation only.
- Preference values are stored as JSON; unknown or malformed values fall back to defaults.
- "Reset local preferences" removes the preference key. It does not touch health records.
- Settings provides export, validated import, and separate deletion for recorded data, simulated
  data, or all local health data. Deletion clears the actual records.
- IndexedDB stores are separate per class. Recorded views and report snapshots never read the
  simulated table. Research content is not stored in IndexedDB.
- The `/reports` review is composed at display time from recorded check-ins and is not stored.
  Saved snapshots remain the only persisted report artifact.
- The simulated recovery trend is generated deterministically at display time and is never written
  to IndexedDB or included in exports or reports.
- The crew overview is computed at display time from recorded check-ins. It stores no crew records,
  creates no roster, exposes no raw ratings or record ids, and has no free-text notes to expose.
- Storage is not encrypted. It is origin-scoped browser storage, not a secure medical vault.
- If browser storage is blocked or unavailable, the app shows a retryable database notice and
  record writes fail closed. No data is sent elsewhere as a fallback, and the app does not claim to
  preserve unsaved records.
- The application sets no cookies and uses no Cache Storage, session storage, or service worker.

### Network and hosting

- The application loads only static assets from its own origin: HTML, JavaScript, CSS, favicon, and
  local SVG.
- There are no runtime API calls, analytics, tag managers, error-reporting SDKs, remote fonts,
  remote images, CDNs, or advertising.
- Browser tests assert that no third-party request occurs.
- The static host may record standard HTTP request metadata (for example, IP address, user agent,
  requested path, and timestamp) under its own policy. Astatine does not control or receive that
  data in the application. Hosting logs must never be used to reconstruct health information.

### Repository content

- No secrets, `.env` files, credentials, or personal data.
- Test fixtures use synthetic identifiers and example domains only.
- One de-identified public dataset (OSD-942, CC0-1.0) is onboarded as research context with a
  validated provenance record and normalized per-array summaries; raw dataset files are not
  bundled. The countermeasure coach holds two repository-authored citation records sharing one NASA
  Human Research Program source, each with a bounded claim and a link. The repository contains no
  real crew health data.
- Documentation may link to public research sources; links are not data ingestion.

## 4. Handling rules by class

### Recorded content

Implemented controls for current recorded surfaces:

- A visible "browser-local" and "not medical care" statement at the point of entry and review.
- A typed, versioned IndexedDB schema separate from simulated and research content.
- Validation before every write and import; storage errors are surfaced without a partial write.
- Scoped deletion for recorded check-ins and derived snapshots in Settings.
- User-initiated JSON export and validated import; no background transmission.
- A fixed, published readiness rubric that shows weighted inputs, confidence, missing data, and
  caveats. The simulated recovery trend is excluded from the band by an explicit flag. It is not a
  clinical score and does not diagnose or predict.

Prohibited:

- Presenting recorded entries as measurements, diagnoses, or validated clinical observations.
- Silent synchronization or background export.
- Storing data in URLs, logs, or analytics.
- Sharing one storage key across categories.

### Simulated content

Implemented controls for generated telemetry:

- A persistent, textual **Simulated** label on the Vitals device views, organ monitor card, samples
  table, and record provenance. The recorded section of each Vitals view stays empty and states why
  rather than borrowing a simulated value.
- A display-time Vitals simulation for heart rate, oxygen saturation, and blood-pressure-style
  readings, generated from a fixed scenario and seed in the browser. It is never written to storage
  and never enters readiness, reports, or recorded views. Sleep, activity, hydration, and nutrition
  views show no simulated series.
- A deterministic seeded generator with a named scenario and version on every sample.
- A separate `telemetrySamples` table that recorded views and reports never read.
- A visible generation action and a deletion control in Settings.
- No clinical conclusion is drawn from simulated values, and the copy says they are not sensor
  measurements.
- The simulated recovery trend is labeled "Simulated" and "Not used in readiness," is generated
  deterministically from a named seed, and is never persisted.

Prohibited:

- A simulated record appearing on a recorded surface without a label.
- "Sample patient" content that could be mistaken for a real person.
- Using simulation to demonstrate a clinical claim, risk score, or outcome prediction.

### Research content

Implemented in the countermeasure coach, and required for any future research item:

- The provenance record defined in [RESEARCH.md](RESEARCH.md): title, publisher or authors, date,
  URL, access date, license or terms, and the specific claim supported. The shipped NASA Human
  Research Program record is documented in section 17 of that document.
- Citation at the point of use, not only in a distant bibliography.
- Preservation of the source's scope, population, and limitations.
- A visible "Research context" label and a non-personal, non-clinical framing.
- Review by someone competent to assess the source and the wording.
- A stated limitation that the citation is general program context and does not validate Astatine.
- "No verified research source is linked" copy when no source exists for an item. The Vitals views
  use this wording for heart rate, oxygen saturation, blood pressure, hydration, and nutrition, and
  reuse the verified sleep and exercise source only in those two views.
- Research shown beside a Vitals view stays in its own card and never changes a recorded or
  simulated value. It is population-level context, not a description of the selected crew member.
- Dataset records use the 12-field provenance contract, 13-item onboarding checklist, five literal
  verification flags, and runtime registry validation. A dataset is never displayed as a partial
  record, is never stored in IndexedDB, and is never described as representing the selected crew
  member or astronaut.

Prohibited:

- Personalizing research to a crew member's recorded data.
- Turning a population-level association into an individual prediction.
- Reproducing copyrighted figures, media, or long excerpts without a verified license.
- Citing an unverified summary, forum post, or inaccessible source as evidence.
- Ingesting health or participant-level data without a clear lawful basis and recorded privacy review.
- Claiming a dataset was used for model training without explicit evidence and model identifiers.
- Presenting research as medical advice or as an Astatine validation claim.

## 5. Category separation in the interface

These patterns are already implemented and must be preserved:

- The home page lists the three classes with plain-language definitions.
- The footer privacy notice opens a data-policy dialog that names the classes and limits.
- Check-in and Reports say "Recorded only"; readiness factors and suggestions are labeled as
  self-report; the readiness trend is labeled "Simulated" and "Not used in readiness"; the
  countermeasure coach labels its research context; Vitals separates recorded gaps, labeled
  simulation, and research context in distinct sections, and its organ views reuse procedural
  geometry rather than recorded or research data;
  Crew is labeled recorded-only, names simulated and research content as excluded, and states that
  it has one local profile, no roster, no team score, and no member-level attribution;
  the Research surface labels its data class and shows the onboarded OSD-942 provenance record; Mission labels its
  clock and telemetry as simulated and states that no flight data is received; the Mission health
  brief is labeled recorded-only and explicitly not clinical or operational.
- Report snapshots are derived only from recorded check-ins and exclude simulated telemetry. The
  Reports review labels recorded data, lists simulated and research content as excluded, and keeps
  private notes off by default; enabling the consent control states that no note content is stored
  or invented.
- Markdown, JSON, and print copies contain the same visible report, including its identity,
  timestamp, period, source labels, privacy notice, and disclaimer.
- Local export separates a `recorded` section from a `simulated` section, and import validates each
  record against its section.
- Data-category metadata lives in `src/lib/data-policy.ts` and is rendered from the same labels
  used by tests, rather than being retyped per page.

For future work:

- A page presents one primary class. If it needs more than one, split the surface into clearly
  labeled sections and keep storage separate.
- A shared visualization must not silently combine classes. If a comparison is essential, both
  series require labels, separate provenance, and an explicit explanation.
- Status must be conveyed by text and structure, not color alone.

## 6. Prohibited product uses

Astatine must not be used or described as:

- a diagnostic, prognostic, triage, or treatment tool;
- a medical record system or clinical decision-support system;
- a remote patient-monitoring or medical-surveillance system;
- a fitness-for-duty, mission-readiness, or emergency-response authority;
- a validated measurement device or a substitute for a clinician;
- a system for real crews without separate clinical, safety, privacy, and regulatory review.

These are not limitations to be removed by a future marketing change. They are product boundaries.

## 7. Feature review gate

A feature proposal must answer all of these before implementation:

- [ ] What is the single data class, and why can it not be confused with another?
- [ ] Exactly what is stored, where, and for how long?
- [ ] How is it deleted or reset?
- [ ] What does the interface say at the point of display?
- [ ] Does any code path transmit user-entered content? If yes, the feature is out of scope unless
      the policy and architecture are deliberately changed.
- [ ] Does the copy avoid diagnosis, prediction, treatment, and validation claims?
- [ ] Are simulated and research elements visibly labeled?
- [ ] Are provenance and license recorded for any external source or asset?
- [ ] Are unit, browser, 390 px, keyboard, and axe checks included?
- [ ] Is the relevant document updated?
- [ ] Who reviewed the data handling and the wording?

## 8. Retention and deletion

- Preferences persist until the user resets them or clears browser site data.
- Recorded check-ins and report snapshots persist until the user deletes recorded data, deletes all
  local health data, or clears browser site data.
- Simulated telemetry persists until the user deletes simulated data, deletes all local health
  data, or clears browser site data.
- Export creates a local JSON file outside the application's control. Deleting records in the app
  does not delete previously exported copies. Report downloads and print copies follow the same
  rule; the application does not upload them.
- There is no server-side retention because there is no server-side application data.
- The reset and deletion controls must remove data, not merely hide values.
- Import merges records with matching ids and validates every record before writing. A rejected
  import writes nothing.
- Hosting request logs are outside application control and are covered by the host's retention
  policy.

## 9. Third-party assets

A third-party asset is acceptable only when all of the following are recorded in the repository:

- the public source URL and creator or publisher;
- the license or written permission, with a copy or link;
- required attribution text;
- the access date;
- confirmation that the intended use (modification, commercial/open-source distribution, web
  delivery) is permitted.

No NASA or other organizational imagery, logo, font, or media is currently included. References to
public programs do not grant a license to their marks or media. The shipped NASA source record
stores only the URL, two paraphrased bounded claims, and limitations; no page content is bundled or
fetched at runtime. When provenance cannot be verified, do not add the asset.

## 10. Change control and incidents

- Policy changes require a pull request, maintainer review, and updates to tests or UI copy that
  enforce the changed behavior.
- If misleading content, category mixing, or an unexpected network transmission is discovered:
  remove or disable the affected surface, document the cause and scope, add a regression test, and
  do not reintroduce it without review.
- Do not post personal health information in an issue or pull request. Report sensitive details
  through a private channel if one is available; otherwise describe the problem without the data.
- A release note must call out any change to storage, data class, or network behavior.

## 11. Related documents

- [README.md](../README.md)
- [PRODUCT.md](PRODUCT.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [RESEARCH.md](RESEARCH.md)
- [ACCESSIBILITY.md](ACCESSIBILITY.md)
- [DEMO.md](DEMO.md)
- [JUDGES.md](JUDGES.md)
- [RELEASE.md](RELEASE.md)
