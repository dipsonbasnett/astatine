# Research

**Status:** Source standard and dataset integrity workflow established; no dataset onboarded · **Last reviewed:** 2026-11-16

Astatine's **Research** class is open, properly attributed public context. It is not personal
medical data, not clinical guidance, and not evidence that Astatine is clinically valid. This
document defines how research sources and datasets are selected, recorded, verified, licensed,
reviewed, and displayed.

The application links one verified NASA Human Research Program page from the sleep and exercise
countermeasure items. Research text is repository-authored, no network request is made at runtime,
and cited context never changes a readiness score or report snapshot.

The `/research` route now presents the integrity gate itself: a dataset registry that is
intentionally empty, the onboarding checklist, the source verification workflow, and the
research-context UI patterns. No dataset has been ingested, downloaded, or bundled. Candidate
sources in section 16 are orientation for future evaluation only.

Repository implementation: `src/features/research/dataset-integrity.ts` (schema guards and
registry validation), `src/features/research/*` (registry, provenance card, checklist, workflow,
and context notice), `docs/research/DATASET_ONBOARDING_TEMPLATE.md` (one record per dataset).

## 1. Purpose

A future Research surface may explain mission-health concepts, measurements, and published
findings. That surface is only trustworthy if a reader can see:

- what the source is and who published it;
- when it was published and accessed;
- exactly which statement it supports;
- what the source does **not** establish;
- why the material is research context rather than a personal result.

This standard exists to prevent a citation from becoming decoration around an unsupported claim.

## 2. Source hierarchy

Prefer sources in this order:

1. **Primary and official**
   - peer-reviewed original research with a DOI or stable publisher page;
   - government or agency technical reports and official program pages;
   - official open-data repositories with clear terms and provenance.
2. **Authoritative secondary**
   - systematic reviews, consensus statements, and institutional syntheses that cite their
     sources;
   - label these as secondary and do not present them as primary observations.
3. **Discovery only**
   - reputable science journalism may help locate a primary source, but it is not cited as the
     evidence itself.

Do not use as evidence:

- forums, social posts, unattributed summaries, or SEO content farms;
- sources that cannot be opened or verified;
- retracted work, expressions of concern, or papers with unresolved integrity questions;
- leaked, private, or participant-level data without explicit authorization and ethics review;
- marketing material presented as independent research.

A link in this repository is not an endorsement, and it does not transfer the source's authority to
Astatine.

## 3. Required provenance record

Every future research item must carry a record like this before it appears in the UI:

| Field               | Requirement                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| Stable ID           | Repository-unique slug; never reused for a different claim             |
| Title               | Title as published                                                     |
| Authors / publisher | Named authors when available; otherwise the publishing organization    |
| Publication date    | As stated by the source; do not infer                                  |
| URL / identifier    | Canonical public URL, DOI, or report number                            |
| Accessed date       | ISO date when the reviewer verified the source                         |
| License / terms     | License or terms governing reuse and display                           |
| Claim supported     | The exact, limited statement this source supports                      |
| Limitations         | Population, setting, design, uncertainty, and what cannot be concluded |
| Reviewer            | Person or role that checked source, claim, license, and wording        |
| Review date         | ISO date; re-review when the source or claim changes                   |
| Status              | Active, superseded, or removed, with a reason                          |

A source without a clear license may still be linked as context, but its text, figures, and media
must not be copied into the application.

## 4. Claim discipline

- Preserve the source's scope. State the population, conditions, and study design that produced
  the finding.
- Distinguish observation, association, and causation. Do not strengthen a correlational finding
  into a cause.
- Do not convert a group-level result into a prediction about an individual crew member.
- State uncertainty and conflicting evidence when they are material.
- Do not add clinical recommendations, dosages, thresholds, or triage advice.
- Do not imply that a cited source validates Astatine or its interface.
- Avoid "studies show" without a specific citation and a bounded claim.
- Paraphrase; quote only briefly and within the source's terms.
- Date-stamp volatile pages and re-check them before release.

Example of an acceptable framing:

> Research context: In the cited study population and setting, the authors report an association
> between the stated exposure and outcome. This is group-level context, not a prediction about an
> individual, and it does not establish a clinical recommendation.

Example of an unacceptable framing:

> The research proves that crews with this value are at high risk and should follow this protocol.

## 5. Licensing and third-party media

- Record the license or terms for every source.
- Do not reproduce figures, photographs, video, audio, or long excerpts without a license that
  clearly permits this use.
- Do not assume that public accessibility equals permission to redistribute.
- Do not use organizational logos or marks to imply affiliation.
- Cite and link rather than copy when rights are unclear.
- Verify licenses again if content is bundled into the app rather than linked.

## 6. Privacy

- Research content is general context and must never be personalized with a crew member's recorded
  data.
- Do not download or embed participant-level datasets. If aggregate data is ever used, it must have
  clear terms, an ethics basis, and a de-identification review.
- Do not attempt re-identification or combine datasets to infer an individual.
- Do not include personal information about researchers beyond normal citation practice.
- Do not send search terms, identifiers, or local preferences to a research service.
- The current app loads no research feed, API, or embedded third-party content. The only linked
  source opens by explicit user action in a new tab.

## 7. Interface requirements for research content

The countermeasure coach currently carries the only research context in the product, and it
follows these rules. A future dedicated Research surface must follow them too.

- A visible **Research context** label on the surface and on each item, conveyed in text rather
  than color alone.
- Citation details adjacent to the claim, not hidden in a distant bibliography.
- A clear distinction between source language and Astatine's explanatory language.
- A limitations field displayed with the claim, not omitted for visual simplicity.
- No recorded data on the same visual unit; if both classes must appear on one page, separate
  sections and storage.
- No recommendation, risk score, or personalized conclusion.
- Outbound links open by explicit user action. Do not auto-embed third-party pages or send query
  parameters containing user data.
- An accessible link name that identifies the destination and, when it opens a new tab, announces
  that behavior.

## 8. Review workflow

1. **Propose.** The author records the full provenance table and the exact claim.
2. **Verify.** A reviewer opens the source, confirms the claim, checks the license, and looks for
   retractions or material updates.
3. **Check wording.** The reviewer confirms no diagnosis, prognosis, treatment, or validation claim
   has been introduced and that limitations are visible.
4. **Check separation.** The reviewer confirms the item is labeled Research and cannot be read as
   personal data.
5. **Record.** The review date and reviewer role are stored with the item.
6. **Re-review.** Sources are checked at least annually, after a material source change, and before
   any release that changes the claim.
7. **Remove.** If a source is retracted, inaccessible, or misrepresented, remove the item, document
   why, and add a regression check where possible.

## 9. Dataset provenance schema

A dataset is not research content that can be dropped into the app. It is a record with a fixed,
mandatory contract. The TypeScript contract lives in `src/types/health.ts`
(`DatasetProvenance`) and is enforced by `isDatasetProvenance` in `src/lib/validation.ts`; the
registry re-validates every entry at runtime in `validateDatasetRegistry`.

| #   | Field                        | Requirement                                                                                |
| --- | ---------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Official source URL          | HTTPS canonical publisher page, not a mirror or aggregator                                 |
| 2   | License name                 | Exact license or terms name as published                                                   |
| 3   | License URL                  | HTTPS page where the license or terms were read                                            |
| 4   | Creator / rights holder      | Named creator or rights holder exactly as published                                        |
| 5   | Citation                     | Publisher-preferred citation, including version                                            |
| 6   | DOI or persistent identifier | DOI, persistent identifier, or accession; otherwise `unavailable` with a documented reason |
| 7   | File checksum                | SHA-256 hex value, plus an official manifest URL when one exists                           |
| 8   | Ingestion date               | ISO date the reviewed file entered the controlled workspace                                |
| 9   | Intended use                 | Specific, bounded, non-clinical evaluation purpose                                         |
| 10  | Limitations                  | Population, setting, design, missing context, and what cannot be concluded                 |
| 11  | Privacy status               | `open-public`, `de-identified-public`, `credentialed-access`, or `restricted-not-approved` |
| 12  | Attribution requirements     | One or more actionable credit statements that reproduce the required wording               |

Supporting structures make the record honest by construction:

- **Identifier union.** `{ type: "doi" | "persistent" | "accession", value, url }` or
  `{ type: "unavailable", reason }`. A missing identifier must be explained, not omitted.
- **Checksum.** Algorithm is fixed to `sha256`; the value must match `/^[a-f0-9]{64}$/`.
- **Privacy review.** `reviewedAt`, `reviewReference`, and an optional `lawfulBasis`.
- **Source verification.** Five literal-true flags (`officialSource`, `licenseTerms`, `citation`,
  `checksum`, `privacy`) plus `verifiedAt` and `verifiedBy`. A record with `false` anywhere does
  not type-check as verified and is rejected at runtime.
- **Model training.** `{ status: "not-used" }` by default. `{ status: "used" }` requires an
  HTTPS `evidenceUrl`, `documentedAt`, and at least one `modelId`. There is no third state.
- **Human-data rule.** If `containsHumanData` is true, `privacyStatus` cannot be `open-public`
  and `privacyReview.lawfulBasis` is mandatory.
- **Registry rules.** Reject `restricted-not-approved`, duplicate `id`, duplicate
  `officialSourceUrl`, malformed URLs, and any incomplete record.

A dataset record that does not satisfy every rule is not displayed, even partially. The registry
is a static, validated repository module — never IndexedDB and never merged with recorded data.

## 10. Dataset onboarding checklist

The same 13 items are shown on the `/research` route and stored in
`DATASET_ONBOARDING_CHECKLIST`. Each item must be documented in the onboarding template before a
record is added to `RESEARCH_DATASETS`.

1. Open the publisher's official dataset page and confirm it is the canonical source, not a mirror.
2. Read the exact license or terms page and record its name and URL.
3. Confirm redistribution, adaptation, and attribution terms permit the intended use.
4. Record the creator or rights holder exactly as published.
5. Copy the publisher's preferred citation and version information.
6. Record a DOI or persistent identifier, or document why none is available.
7. Download from the official source and verify the SHA-256 checksum against an official manifest.
8. Record the ingestion date and the controlled workspace that holds the reviewed file.
9. Write a specific, non-clinical intended use and explicit limitations.
10. Record privacy status; for human data, record a lawful basis and a privacy review.
11. Write actionable attribution requirements that reproduce the required credit.
12. Record model-training use as not used unless explicit evidence and model identifiers exist.
13. Complete every source-verification check before adding the dataset to the registry.

The review is not complete when the checklist is merely filled in. It is complete when a reviewer
has opened each source, reproduced the checksum, and confirmed the wording.

## 11. License and attribution validation

Validation is a read of the actual license or terms page, not an inference from "public" or
"open data".

**Accept only when:**

- the license or terms page opens at an HTTPS URL and is recorded by name and URL;
- the terms permit the intended use, including any redistribution, adaptation, or display;
- attribution requirements are reproducible as written;
- the preferred citation and version are captured;
- the dataset is downloadable from the official source and the checksum can be verified;
- the record can state "not used for model training" truthfully, or has documented evidence
  and model identifiers that make "used" true.

**Reject or pause when:**

- the license is absent, contradictory, or only discoverable through a third-party summary;
- public accessibility is being treated as permission to redistribute;
- copyrighted material would be bundled without clear permission;
- the required credit cannot be reproduced faithfully;
- the source is a mirror with no canonical publisher page;
- a dataset's terms prohibit the planned use, even if the file is technically downloadable;
- anyone wants to describe Astatine or a model as trained on the data without evidence.

The safe default is to link and cite, never copy. A dataset whose rights are unclear is not
onboarded. A source whose license permits linking but not copying is not bundled.

## 12. Source verification workflow

Five checks are recorded as literal `true` flags with a verification date and a named reviewer.
The `/research` route displays the same five steps.

| Step            | What the reviewer does                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Official source | Open the publisher's landing page, confirm the version, and reject mirrors or unattributed copies.                                               |
| License/terms   | Read the license or access terms at the source, record name and URL, and confirm the intended use is permitted.                                  |
| Citation        | Capture the publisher's preferred citation, version, creators, and persistent identifier.                                                        |
| File checksum   | Download from the official source and compare SHA-256 with the official manifest, or compute it from the reviewed file.                          |
| Privacy         | Determine whether the dataset contains human data, record privacy status, and complete lawful-basis and de-identification review where required. |

Registry validation repeats at runtime. A record is rejected when any flag is not true, when the
privacy status is `restricted-not-approved`, when identifiers or source URLs collide, when a human
dataset is marked `open-public` or lacks a lawful basis, or when a training claim lacks evidence.
Re-verification is required when the publisher releases a new version, changes its license, moves
the canonical page, or when the intended use changes.

## 13. Dataset privacy and lawful basis

- `open-public` means the reviewed release contains no identified human participant records. It
  is not a synonym for "downloadable".
- `de-identified-public` requires a recorded de-identification review and a lawful basis.
- `credentialed-access` requires credentials, a data-use agreement, or both. It is not eligible
  for automatic ingestion and must not be re-hosted.
- `restricted-not-approved` is rejected by the registry and is never displayed.
- Health or participant-level data is never ingested without a clear lawful basis and a completed
  privacy review recorded in `privacyReview`.
- No dataset is joined with recorded check-ins, simulated telemetry, or local identifiers.
- No re-identification, linkage, or inference about an individual is attempted.
- No dataset is described as representing the selected crew member, astronaut, or user.

## 14. Research-context UI patterns

The `/research` route demonstrates these patterns; any future research surface must keep them.

1. **Label the data class.** Every research block carries a visible research source badge and
   never borrows the recorded-data styling used for personal check-ins.
2. **Attribution before interpretation.** Citation, creator, publisher, license, identifier, and
   access date appear before or alongside any summary.
3. **Limitations stay adjacent.** Limitations sit next to intended use so a claim cannot be read
   without its caveat.
4. **Never personalize.** Copy uses phrasing such as "studies of similar crews" and never says a
   finding describes the selected crew member or astronaut.
5. **Disclose provenance and review.** Verification date, reviewer, checksum, and ingestion date
   are visible. A missing field blocks display rather than producing a partial record.
6. **Make external destinations explicit.** Outbound links name their destination, open by
   explicit user action in a new tab, and announce the new-tab behavior to assistive technology.
7. **No inline personal data.** Research views do not fetch, merge, or interleave recorded
   check-ins or simulated telemetry.

The dataset card also states in its own footer that it is research context, is not medical advice,
does not describe the selected crew member, and is never mixed with recorded or simulated data.

## 15. Citation and attribution requirements

Every dataset record and every research reference must be reproducible in this order:

1. Creator or rights holder
2. Title and version
3. Publisher
4. DOI or persistent identifier, or a documented reason none exists
5. Official source URL
6. Accessed date
7. License name and license URL
8. Required attribution statement

Rules:

- Reproduce required attribution and citation text without paraphrase; do not restyle it into
  marketing copy.
- Keep the citation adjacent to the claim or dataset view where the material appears.
- Record the accessed date, because the page may change after review.
- Record the SHA-256 checksum and, where available, the official manifest URL.
- If no DOI or persistent identifier exists, display the recorded reason rather than inventing an
  identifier or silently omitting the field.
- State model-training status explicitly: "Not used for model training." or the documented
  evidence URL, date, and model identifiers.
- A link is not an endorsement, and a citation does not transfer the publisher's authority to
  Astatine.
- Bundling content requires a license that clearly permits it; otherwise cite and link only.

## 16. Candidate public datasets for future evaluation

These are **candidates only**. They were verified at the official pages below on **2026-11-16**.
None has been downloaded, checksum-verified, privacy-reviewed in this repository, or added to
`RESEARCH_DATASETS`. Every one would still need the onboarding template, a SHA-256 verification,
and an independent review.

| Dataset                                          | Official source                                                                                 | License / terms                                                                                                                                                                         | Identifier / access                                               | Privacy status at review                        | Plausible evaluation use                                                |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| NASA Open Science Data Repository (OSDR)         | https://science.nasa.gov/biological-physical/data/ (repository: https://osdr.nasa.gov/bio/repo) | NASA open-access policy and NASA SMD Science Information Policy; per-study citation and acknowledgement requested; no copyrighted material without permission                           | Per-study accession (for example GLDS-249); no single dataset DOI | `open-public` per study, pending review         | Understand spaceflight-relevant study structures and metadata patterns  |
| PhysioNet Sleep-EDF Expanded v1.0.0              | https://physionet.org/content/sleep-edfx/1.0.0/                                                 | Open Data Commons Attribution License v1.0 (https://physionet.org/content/sleep-edfx/view-license/1.0.0/)                                                                               | DOI 10.13026/C2X676; SHA256SUMS manifest                          | `de-identified-public` (human PSG data)         | Evaluate sleep-staging and signal-quality context, not crew prediction  |
| UCI Human Activity Recognition Using Smartphones | https://archive.ics.uci.edu/dataset/240/human+activity+recognition+using+smartphones            | CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/legalcode)                                                                                                                       | DOI 10.24432/C54S4K                                               | `de-identified-public` (30 volunteers)          | Benchmark activity-classification metadata and feature descriptions     |
| CDC NHANES                                       | https://wwwn.cdc.gov/nchs/nhanes/                                                               | NCHS Data User Agreement (https://www.cdc.gov/nchs/policy/data-user-agreement.html): statistical reporting and analysis only; no re-identification or linkage; no explicit open license | Per-cycle files; no dataset DOI                                   | `de-identified-public` with lawful-basis review | Compare population-level measurement concepts and documentation quality |
| PhysioNet MIMIC-IV                               | https://physionet.org/content/mimiciv/                                                          | PhysioNet Credentialed Health Data License; data-use agreement required                                                                                                                 | Project DOI per version                                           | `credentialed-access`                           | Not eligible for automatic ingestion or display                         |
| NSRR Sleep Heart Health Study (SHHS)             | https://sleepdata.org/datasets/shhs                                                             | Data-access request and data-use agreement; de-identified signals and clinical elements                                                                                                 | Study-specific access                                             | `credentialed-access` pending review            | Not eligible until access and privacy terms are re-verified             |

Caveats:

- OSDR is a repository of many studies. Each study has its own title, authors, citation, accession,
  and sometimes additional terms; the repository-level policy is not a substitute for per-study
  review.
- Sleep-EDF and UCI HAR are genuinely open, but both contain de-identified human records. They
  still require a recorded lawful basis, attribution text, and a privacy review.
- NHANES is publicly downloadable but governed by a data user agreement rather than an open
  content license. Its permitted use is statistical reporting and analysis; the absence of an
  explicit open license must be recorded, not glossed over.
- MIMIC-IV and NSRR SHHS are credentialed. They are listed to mark the boundary, not as ingestion
  targets.
- No candidate should be described as used for model training. Astatine has no trained model, and
  the default disclosure is "Not used for model training."

## 17. Shipped research context

The countermeasure coach displays two research records that share one source: a sleep claim on the
sleep item and an exercise claim on the exercise item. They are repository-authored context,
excluded from readiness scoring, coach status, and report snapshots.

Shared source record:

| Field               | Record                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title               | NASA Human Research Program                                                                                                                                                                                   |
| Authors / publisher | NASA                                                                                                                                                                                                          |
| Publication date    | Not stated on the page; program page rather than a dated publication                                                                                                                                          |
| URL / identifier    | https://www.nasa.gov/hrp/                                                                                                                                                                                     |
| Accessed date       | 2026-11-16                                                                                                                                                                                                    |
| License / terms     | Public NASA program page; linked only. No text, figures, or media copied into the application.                                                                                                                |
| Limitations         | Program overview only. It does not evaluate this crew member, provide individualized guidance, or constitute a clinical standard, and it does not report an effect size or support a clinical recommendation. |
| Reviewer            | Repository maintainer, role-level review                                                                                                                                                                      |
| Review date         | 2026-11-16                                                                                                                                                                                                    |
| Status              | Active                                                                                                                                                                                                        |

Bounded claims per item:

| Stable ID           | Coach item                    | Claim supported                                                                                                   |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `nasa-hrp-sleep`    | Sleep duration and regularity | NASA's Human Research Program describes sleep and circadian adaptation as areas of human spaceflight research.    |
| `nasa-hrp-exercise` | Exercise adherence            | NASA's Human Research Program describes exercise and physical performance as areas of human spaceflight research. |

The displayed copy states that research context appears only where a verified public NASA program
page is linked, that the links are general program overviews rather than clinical guidance, and that
they do not evaluate the crew or the rubric. Every other coach item renders "No verified research
source is linked for this item" rather than an unsourced claim.

## 18. Current references

These official pages were verified on **2026-11-16**. Only the Human Research Program page is
linked from the application, as described in section 17. No text, data, or media from either page is
bundled in the application, and no claim about crew health is drawn from the open-data page.

| Source                                                                            | Publisher    | URL                                                | Accessed   | Use in this repository                                 |
| --------------------------------------------------------------------------------- | ------------ | -------------------------------------------------- | ---------- | ------------------------------------------------------ |
| Human Research Program                                                            | NASA         | https://www.nasa.gov/hrp/                          | 2026-11-16 | Linked as research context in the countermeasure coach |
| Biological and Physical Sciences Data (Open Science Data Repository landing page) | NASA Science | https://science.nasa.gov/biological-physical/data/ | 2026-11-16 | Orientation to open data; no datasets downloaded       |

Note: on the access date, `https://osdr.nasa.gov/` redirected to the NASA Science data page listed
above. External pages can change or move; re-verify before citing them in the product.

## 19. Rejection examples

Reject or return a research item when:

- the link cannot be opened or the citation cannot be matched to a source;
- the page is a summary that does not identify the underlying study;
- the claim is broader than the source's population, setting, or design;
- the item implies a diagnosis, prediction, treatment, or emergency instruction;
- the license does not permit the proposed reproduction;
- the item mixes research with a crew member's recorded data;
- the reviewer cannot establish provenance or detect a retraction.

## 20. Open decisions

- Which research topics are useful enough to justify a surface, and who reviews them?
- Should research items be static, repository-authored content, or is a reviewed content pipeline
  needed? Any pipeline must preserve the no-network boundary at runtime.
- What level of explanatory writing is appropriate before a scientific reviewer is required?
- How should superseded findings remain visible, if at all?

## 21. Related documents

- [DATASET_ONBOARDING_TEMPLATE.md](research/DATASET_ONBOARDING_TEMPLATE.md)
- [DATA_POLICY.md](DATA_POLICY.md)
- [PRODUCT.md](PRODUCT.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [RELEASE.md](RELEASE.md)
