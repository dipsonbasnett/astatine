# Research evaluation and release plan

This plan covers how Astatine selects, validates, reviews, and releases research context. It
applies to every future dataset and every future evidence insight. It does not describe a
trained model, because none exists.

Boundary in force:

- Astatine does not diagnose disease, predict medical events, replace medical professionals,
  receive live astronaut telemetry, claim NASA endorsement, present simulated data as recorded
  clinical data, present research data as personal data, or upload health data automatically.
- One de-identified public dataset (OSD-942, CC0-1.0) is onboarded with one approved insight.
  `INGESTION_REGISTRY` remains empty because no new ingestion request is queued.
- Research context never changes a recorded value, a readiness band, or a crew metric.
- Astatine is not described as trained on NASA data or on any other research corpus.

## 1. Dataset selection

A dataset is a candidate only when all of the following hold:

1. The publisher's official page is reachable and is the canonical source, not a mirror.
2. The license or terms permit the documented use and are readable at a stable URL.
3. The release has a persistent identifier or a written explanation of why none exists.
4. The release has a published or computable SHA-256 checksum.
5. The data supports a narrow claim relevant to at least one Astatine domain.
6. The release is open public or, for human data, carries a completed privacy review and a
   lawful basis.
7. The onboarding reviewer can name a specific, non-clinical intended use and explicit
   limitations.

A resource that fails any condition stays in the discovery landscape with its access model and
risks recorded. It never enters the registry.

The landscape in [RESEARCH_LANDSCAPE.md](RESEARCH_LANDSCAPE.md) records nine resources with
their access model, suitability, and risks. None of them is selected today.

## 2. Data quality

Quality review covers, at minimum:

- completeness per field and per participant, with missingness reported rather than filled;
- consent or data-use scope on the publisher's terms;
- collection setting (spaceflight, analog, ground) and its distance from a mission;
- measurement method and whether the published value is raw, derived, or summarized;
- version drift between the citation, the identifier, and the downloaded file;
- internal consistency of units, labels, and coded values;
- duplicate or overlapping releases that would double-count a population.

A quality finding is recorded as a limitation on every insight derived from the dataset. An
insight whose limitations would swallow its claim is rejected.

## 3. Unit and schema validation

- Every numeric measurement has a reviewed `UnitMapping`: source unit, target unit, factor,
  offset, and the reference that justifies the conversion.
- A measurement with a unit and no mapping blocks ingestion.
- Missing values follow a `MissingValueRule` per measurement: report as missing or exclude from
  a summary. Astatine never imputes, interpolates, or carries a value forward.
- Every record passes its type guard. A malformed nested record blocks the request at the
  schema gate rather than being partially salvaged.
- De-identification, privacy, extraction, review, and version records are validated with the
  same rigor as the data itself.

## 4. Population applicability

Every insight states:

- who was studied, in what setting, with sample size and inclusion notes;
- whether the population is human, non-human, mixed, or not applicable;
- whether the evidence applies to the selected crew member (`not-personal` or `unknown`);
- what the evidence cannot support ("this does not describe the selected crew member").

Applicability is a recorded field, not a writing style. A human insight cannot be marked as
describing the selected user, and a non-human dataset cannot ground a human crew claim. Analog
settings are labeled as analog; a bed-rest or isolation study is not treated as a mission.

## 5. Bias and limitations

Reviewers record:

- selection bias (who could join the study, and who was excluded);
- survivorship or healthy-worker effects in astronaut cohorts;
- small samples and repeated measures on the same participants;
- measurement bias from self-report or indirect instrumentation;
- transfer bias between analog and flight, or between species;
- publication and reporting bias where only positive results were released;
- temporal bias from a single mission era or program design.

Each limitation is displayed adjacent to the claim it limits. A shorter, narrower claim with
honest limitations is preferred to a broad claim with hidden caveats.

## 6. Privacy and lawful basis

- Human data requires a documented privacy decision, a lawful basis, and a de-identification
  review before the privacy gate passes.
- The de-identification review must explicitly check names and initials, overly specific dates,
  geographic detail, contact or account identifiers, free-text notes, rare role or mission
  combinations, and linked files or metadata.
- Open-public human data cannot be labeled as containing no review. Data that cannot be
  approved is marked restricted and excluded.
- Astatine stores derived insights, not the raw participant records, and links to the source
  rather than redistributing it when the license is link-only.

## 7. Human review

- Extraction is a documented manual or assisted-review step with a named extractor and date.
- A different named reviewer approves or rejects the extracted insights.
- The review happens after extraction and references a checklist.
- The reviewer checks the bounded claim, the population, the limitations, the applicability,
  the citation, the license, and the privacy facets.
- An extractor cannot approve their own work. Version and re-review dates are recorded.

## 8. Benchmarks

Benchmarks are transparent and versioned:

- a published rubric with named factors, weights, thresholds, and a band table;
- consistent inputs across the same window and the same data class;
- visible confidence and coverage, with missing inputs shown as missing;
- change notes when a rubric version changes.

The rubric is a product rule, not a clinical standard. Research context does not enter the
rubric, and a research claim does not change a band.

## 9. Accuracy

Quality is judged per insight, not per corpus:

- Does the claim match the reported observation?
- Is the direction correct (supports, mixed, unclear, describes)?
- Is the effect described without exaggeration?
- Is uncertainty stated where the source reports it?
- Does the citation resolve to the exact page or record used?

Accuracy review is repeated when the publisher releases a new version, the license changes, or
the intended use changes.

## 10. Calibration and uncertainty

- Confidence is assigned by a reviewer with a written basis (low, moderate, high).
- Uncertainty is restated in the observation: effect sizes, confidence intervals, or an explicit
  statement that none was reported.
- A single program overview with no result cannot receive more than low confidence.
- Confidence is displayed with its basis. It is never presented as a probability that the
  insight applies to the selected crew member.

## 11. Safety

- Research context is labeled and visually separated from recorded and simulated data.
- Research context never appears in a report as a recorded value and never fills a data gap.
- Every research block states that it is not personalized medical advice and does not describe
  the selected crew member.
- Escalation guidance stays tied to the recorded-data rubric and the mission medical support
  channel, never to a research claim.
- No publisher is presented as endorsing Astatine, and no citation implies clinical validation.

## 12. Release criteria

A release that includes research context requires all of the following:

- [ ] Every onboarded dataset passes the thirteen ingestion gates.
- [ ] Every displayed insight is approved, source-linked, and inside its re-review date.
- [ ] The evidence bundle validates with `validateShippedResearchData`.
- [ ] Required tests pass: format, lint, typecheck, unit, build, and end-to-end.
- [ ] The dataset registry, landscape, insight library, and ingestion registry validate.
- [ ] No dataset appears unless it was selected under this plan.
- [ ] No model-training claim appears unless a separate, approved training workflow exists and
      is documented here.

Current state: one reviewed insight from OSD-942 is displayed as non-personal context, and no
model exists. The surface is a research-context foundation, not a claim that any dataset was used
for training.

## 13. Model training boundary

A larger dataset does not automatically improve accuracy.

Model training requires a separate approved workflow.

Any future model must be evaluated, documented, and safely bounded.

That workflow is not implemented. Until it exists, the `modelTraining` field is a single
literal (`not-used` on insights, `not-approved` for landscape resources), the interface says no
model was trained on the research, and the evaluation plan above applies only to evidence
selection and display.
