# Dataset onboarding template

Copy this file to `docs/research/<dataset-id>.md`, complete every field, and attach the evidence
links. Do not add the dataset to `RESEARCH_DATASETS` until every section is complete, every
verification flag can be set to `true` honestly, and a reviewer has signed off.

**No dataset is ingested by completing this template.** Completion makes a dataset eligible for
review; the registry entry is a separate, reviewed change.

## 1. Identification

| Field                                       | Value                                 |
| ------------------------------------------- | ------------------------------------- |
| Repository dataset ID                       | `<lowercase slug, repository-unique>` |
| Title (as published)                        |                                       |
| Version / release                           |                                       |
| Creator / rights holder (as published)      |                                       |
| Publisher / host                            |                                       |
| Official source URL (HTTPS)                 |                                       |
| Dataset landing page verified on (ISO date) |                                       |

## 2. License and terms

| Field                                        | Value                               |
| -------------------------------------------- | ----------------------------------- |
| License or terms name (exact)                |                                     |
| License or terms URL (HTTPS)                 |                                     |
| License page read on (ISO date)              |                                     |
| Redistribution permitted?                    | `<yes/no + quoted clause>`          |
| Adaptation permitted?                        | `<yes/no + quoted clause>`          |
| Attribution required?                        | `<yes/no + exact required wording>` |
| Copyrighted material excluded from bundling? | `<yes/no + note>`                   |

If any answer depends on a third-party summary rather than the license page itself, stop and
verify at the source.

## 3. Identifier

Complete exactly one option.

- [ ] DOI: `<value>` — `<https://doi.org/...>`
- [ ] Persistent identifier: `<value>` — `<HTTPS URL>`
- [ ] Accession: `<value>` — `<HTTPS URL>`
- [ ] Unavailable — reason: `<why the publisher assigns none; 1–300 characters>`

Do not invent, guess, or derive an identifier.

## 4. File integrity

| Field                                          | Value |
| ---------------------------------------------- | ----- |
| File name and version reviewed                 |       |
| Download source (HTTPS)                        |       |
| Official checksum manifest URL (if any)        |       |
| SHA-256 checksum (64 lowercase hex characters) |       |
| Checksum computed or compared on (ISO date)    |       |
| Controlled workspace holding the reviewed file |       |

Record the checksum only after downloading from the official source. If the manifest and the
computed checksum disagree, stop: do not onboard the dataset.

## 5. Intended use and limitations

**Intended use** (specific, bounded, non-clinical, 1–500 characters):

> `<What this dataset would help evaluate, and in what context.>`

**Limitations** (1–800 characters):

> `<Population, setting, design, missing context, version constraints, and what cannot be concluded.>`

**Explicitly out of scope:**

- [ ] Not used to diagnose, predict, or recommend care for any person.
- [ ] Not used to represent the selected crew member, astronaut, or user.
- [ ] Not merged with recorded check-ins or simulated telemetry.
- [ ] Not used for model training unless section 8 documents evidence.

## 6. Privacy review

| Field                                                   | Value                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Contains human participant data?                        | `<yes/no>`                                                                                 |
| Privacy status                                          | `open-public` / `de-identified-public` / `credentialed-access` / `restricted-not-approved` |
| Privacy review reference                                | `<document, ticket, or record identifier>`                                                 |
| Privacy review date (ISO)                               |                                                                                            |
| Lawful basis (required when human data is present)      |                                                                                            |
| De-identification or aggregation described by publisher |                                                                                            |
| Re-identification or linkage prohibited?                | `<yes/no + source>`                                                                        |
| Access conditions (credentials, DUA)                    |                                                                                            |

Rules:

- `open-public` is valid only when no identified human participant records exist in the release.
- Human data cannot be `open-public`; it needs a privacy review and a lawful basis.
- `credentialed-access` is not eligible for automatic ingestion and must not be re-hosted.
- `restricted-not-approved` blocks the dataset entirely.

## 7. Attribution requirements

Publisher-preferred citation (verbatim):

> `<citation>`

Required attribution statements (verbatim, one per line):

1. `<required credit>`
2. `<required license notice>`
3. `<required acknowledgement>`

Accessed date (ISO): `<date>`

Where the attribution must appear:

- [ ] Dataset card
- [ ] Any future research summary that uses the dataset
- [ ] Any derived table or figure, if permitted by the license

## 8. Model-training disclosure

Complete exactly one option.

- [ ] **Not used for model training.** (Default; this is the true statement for Astatine today.)
- [ ] **Used for model training.**
  - Evidence URL (HTTPS):
  - Documented on (ISO):
  - Model identifiers:
  - Link to the model card or training record:

A training claim without evidence and model identifiers is not allowed. Do not imply that a
dataset trained a model merely because it was evaluated or cited.

## 9. Source verification sign-off

All five must be `true`, with a named reviewer and date.

| Check                                          | Flag     | Evidence / note |
| ---------------------------------------------- | -------- | --------------- |
| Official source confirmed (not a mirror)       | `<true>` |                 |
| License and terms read and permit intended use | `<true>` |                 |
| Citation and version captured                  | `<true>` |                 |
| SHA-256 checksum verified                      | `<true>` |                 |
| Privacy status and lawful basis reviewed       | `<true>` |                 |

| Field                                     | Value |
| ----------------------------------------- | ----- |
| Verified by (name or role-level reviewer) |       |
| Verified on (ISO date)                    |       |

## 10. Approval and re-review

| Field                                   | Value                                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| Onboarding decision                     | `approved` / `returned` / `rejected`                                                        |
| Decision date (ISO)                     |                                                                                             |
| Decision rationale                      |                                                                                             |
| Registry change reference (PR or issue) |                                                                                             |
| Next re-review date (ISO)               |                                                                                             |
| Re-review triggers                      | New version; license change; canonical URL move; intended-use change; privacy-status change |

## 11. Registry entry

Only after approval, add a `DatasetProvenance` record to
`src/features/research/dataset-integrity.ts` and run:

```bash
npm run typecheck
npm test -- src/features/research/dataset-integrity.test.ts
```

Then confirm:

- [ ] `validateDatasetRegistry` accepts the record.
- [ ] The identifier is either real or `unavailable` with a reason.
- [ ] The privacy branch matches section 6.
- [ ] The training disclosure matches section 8.
- [ ] No third-party text, figure, or media was copied into the repository.
- [ ] The dataset is still not joined to recorded or simulated data.

## 12. Removal

If the source is retracted, the license changes, the canonical page disappears, or the use no
longer matches section 5:

1. Remove the registry entry.
2. Record why and when in the decision log.
3. Add a regression test or checklist update where possible.
4. Keep the historical onboarding record for audit; do not silently delete the evidence trail.
