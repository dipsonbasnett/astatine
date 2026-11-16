# Research data landscape

This document maps the public NASA and partner resources that could supply research context to
Astatine. It is a **landscape**, not a registry and not a licence to ingest.

Boundary in force:

- OSD-942 is the only onboarded dataset; its provenance and evidence record are in
  [RESEARCH.md](RESEARCH.md) section 18. This landscape does not itself grant ingestion.
- `RESEARCH_DATASETS` contains only OSD-942.
- No dataset has been used to train a model. Every landscape entry remains marked
  `futureModelTraining: "not-approved"`.
- A listing here is not an endorsement by NASA, and a link is not a citation of results.

The typed source of truth for this table is
[`src/features/research/provenance/landscape.ts`](../src/features/research/provenance/landscape.ts).
All pages were checked on **2026-11-16**; entries that could not be read in full are marked
**partially verified** below and must be re-checked before use.

## 1. Resources

### Purpose, data types, and access

| Resource                                                             | Kind             | Official URL                                                                 | Purpose                                                                                                                                           | Data types                                                                                                        | Access         |
| -------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------- |
| NASA Open Science Data Repository (OSDR)                             | Repository       | https://science.nasa.gov/biological-physical/data/                           | Public repository for spaceflight and analog biological and physical science data, including GeneLab and combined study records                   | Omics and assay data; study metadata and protocols; non-human and human biological study records                  | Open public    |
| Ames Life Sciences Data Archive (ALSDA)                              | Repository       | https://www.nasa.gov/ames/space-biosciences/ames-life-sciences-data-archive/ | Official repository for non-human science data from NASA's Space Biology Program, hosted within OSDR                                              | Non-human space biology study data; study metadata                                                                | Open public    |
| NASA Life Sciences Portal (NLSP) / Life Sciences Data Archive (LSDA) | Repository       | https://nlsp.nasa.gov/                                                       | Portal for requesting LSDA access; LSDA holds human, plant, and animal life-science studies from early flight programs, Shuttle, ISS, and analogs | De-identified human research data; analog study data such as bed rest; plant and animal data; study documentation | Request-based  |
| Human Research Open-Access Datasets (NLSP)                           | Repository       | https://www.nasa.gov/hrp/nlsp/                                               | Curated human research datasets published through NLSP, including bed-rest analog studies                                                         | De-identified human analog study data; questionnaires and functional measures                                     | Request-based  |
| NASA Human Research Program (HRP)                                    | Program          | https://www.nasa.gov/hrp/                                                    | Program overview of research to protect astronaut health and performance, with links to risks, data, and publications                             | Program overview pages; links to risks, data, and publications                                                    | Open public    |
| Human Research Roadmap (HRR)                                         | Planning tool    | https://humanresearchroadmap.nasa.gov/                                       | Overview of risks and knowledge gaps that HRP associates with human spaceflight, organized as the Integrated Research Plan                        | Risk and knowledge-gap descriptions; Integrated Research Plan structure                                           | Open public    |
| NASA Standard Measures                                               | Program          | https://www.nasa.gov/reference/standard-measures/                            | Standardized multidisciplinary measures of how isolation, confinement, weightlessness, and other hazards affect health and performance            | Questionnaires; cognitive and physical tests; biological samples; derived measures                                | Request-based  |
| NASA Open Data Portal                                                | Metadata catalog | https://data.nasa.gov/                                                       | Public metadata catalog describing NASA datasets and linking to the archives that host them                                                       | Dataset metadata records; links to hosting archives                                                               | Open public    |
| NASA International Space Apps Challenge                              | Event resource   | https://www.spaceappschallenge.org/                                          | Annual hackathon publishing challenge briefs and event resources, some pointing to external datasets                                              | Challenge briefs; event resources; links to external datasets                                                     | Event resource |

### Licence, privacy, citation, and ingestion suitability

| Resource                            | License / terms                                                                          | Privacy                                                              | Citation requirement                                                        | Ingestion suitability                                 | Model training |
| ----------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- | -------------- |
| OSDR                                | NASA SMD Science Information Policy; per-study citation and acknowledgement requirements | Per-study review; human and non-human studies mixed                  | Use the study's preferred citation and acknowledge the repository           | Repository-level review; OSD-942 onboarded separately | Not approved   |
| ALSDA                               | NASA SMD Science Information Policy via OSDR; per-study requirements                     | Not applicable; described as non-human                               | Cite the study record and acknowledge the archive                           | Not evidence; discovery or context only               | Not approved   |
| NLSP / LSDA                         | Not specified in the public catalog entry; per-request data-use terms                    | Request-based; de-identified human data only through a request       | Follow instructions issued with an approved request                         | Request-only; not eligible for automatic ingestion    | Not approved   |
| Human Research Open-Access Datasets | Not verified per dataset; access and terms described through NLSP                        | Request-based; per-dataset de-identification and lawful-basis review | Cite the dataset record and follow supplied acknowledgement terms           | Request-only                                          | Not approved   |
| HRP                                 | Public NASA program page; linked and quoted only                                         | Not applicable                                                       | Cite page title, NASA, URL, and accessed date; a link is not an endorsement | Not evidence; discovery or context only               | Not approved   |
| HRR                                 | Public NASA web content; used as a risk taxonomy only                                    | Not applicable                                                       | Cite the roadmap page and NASA with the accessed date                       | Not evidence; discovery or context only               | Not approved   |
| Standard Measures                   | Not specified for the data; access runs through LSDA and NLSP                            | Request-based; human measures                                        | Cite the program page and follow terms issued with data access              | Request-only                                          | Not approved   |
| NASA Open Data Portal               | Per catalog entry; many records state "License not specified"                            | Not applicable; metadata only                                        | Cite the catalog record and the hosting archive                             | Not evidence; discovery or context only               | Not approved   |
| Space Apps                          | Participant terms and event rules; linked resource licences vary                         | Not applicable                                                       | Event rules require citing sources used; each dataset keeps its own terms   | Not evidence; discovery or context only               | Not approved   |

### Domains, use, and risks

| Resource                            | Health domains                                                                                                                                                                     | Astatine use                                                                                           | Principal risks                                                                                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OSDR                                | Cardiovascular; exercise and countermeasures; bone and musculoskeletal; radiation                                                                                                  | Learn study and metadata structures; OSD-942 supplies one exercise-countermeasure insight              | Repository terms do not replace per-study review; omics is not crew health measurement; human studies need privacy review; OSD-942 is an analog, not spaceflight |
| ALSDA                               | None                                                                                                                                                                               | Study metadata conventions; understand the non-human evidence boundary                                 | Non-human data cannot ground a human crew-health statement; animal-to-astronaut transfer is not established by the archive                                       |
| NLSP / LSDA                         | Cardiovascular; exercise and countermeasures; bone and musculoskeletal; sleep, circadian, and fatigue; nutrition and hydration; behavioral health; radiation; medical capabilities | Identify analog and flight studies that could be requested; understand the human-data request boundary | Access requires approval and a data-use agreement; per-request terms; the guidelines page did not render; analogs are not long-duration missions                 |
| Human Research Open-Access Datasets | Cardiovascular; exercise and countermeasures; bone and musculoskeletal; nutrition and hydration; behavioral health                                                                 | Identify analog-study publication patterns; compare documentation quality without ingesting records    | Per-dataset terms unverified; bed rest is not spaceflight; "open-access" is not a redistribution licence                                                         |
| HRP                                 | Cardiovascular; exercise and countermeasures; bone and musculoskeletal; sleep, circadian, and fatigue; behavioral health; radiation; medical capabilities                          | Program-level context beside sleep and exercise coach items                                            | Program overview, not a study; no effect size; cannot evaluate a crew member; NASA does not endorse Astatine                                                     |
| HRR                                 | All nine domains, as risk vocabulary                                                                                                                                               | Align domain names with published risk vocabulary; name a domain with no dataset                       | Knowledge gaps are questions, not results; risk labels can be misread as diagnoses; body content did not load during verification                                |
| Standard Measures                   | Cardiovascular; exercise and countermeasures; bone and musculoskeletal; sleep, circadian, and fatigue; behavioral health                                                           | Understand measure families; compare local check-in concepts with published categories                 | Battery is protocol design, not a public dataset; measure names do not supply reference values; biological samples are not public                                |
| NASA Open Data Portal               | None                                                                                                                                                                               | Discover official dataset landing pages; record license gaps before proposing ingestion                | "License not specified" entries cannot be onboarded; metadata can be stale; a listing is not a verification                                                      |
| Space Apps                          | None                                                                                                                                                                               | Discovery pointer, reviewed like any other source                                                      | Event context is not curation; event rules do not license third-party datasets; legal page could not be read                                                     |

## 2. Domain coverage

Coverage means a documented research area exists. It does **not** mean Astatine holds usable
evidence, and it never means the research describes the selected crew member.

| Domain                                       | Landscape resources                                                                | What exists publicly                                                    | What Astatine holds                                                                                  |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Cardiovascular                               | OSDR, NLSP/LSDA, Human Open-Access Datasets, HRP, HRR, Standard Measures           | Biological studies, analog study records, program and risk descriptions | No dataset; local check-ins only                                                                     |
| Exercise and countermeasures                 | OSDR (OSD-942), NLSP/LSDA, Human Open-Access Datasets, HRP, HRR, Standard Measures | Analog study records, program descriptions, standardized measures       | OSD-942 normalized metadata and one reviewed insight; planned and completed minutes recorded locally |
| Bone and musculoskeletal                     | OSDR, NLSP/LSDA, Human Open-Access Datasets, HRP, HRR, Standard Measures           | Non-human biology, analog records, program descriptions                 | No dataset; no bone measure                                                                          |
| Sleep, circadian, and fatigue                | NLSP/LSDA, HRP, HRR, Standard Measures                                             | Program descriptions, analog records, measure families                  | Self-reported sleep and fatigue; no research dataset                                                 |
| Nutrition and hydration                      | NLSP/LSDA, Human Open-Access Datasets, HRR                                         | Analog records, risk vocabulary                                         | Self-reported entry counts; no intake dataset                                                        |
| Behavioral health and workload               | NLSP/LSDA, Human Open-Access Datasets, HRP, HRR, Standard Measures                 | Analog records, program descriptions, measures                          | Self-reported mood, stress, and workload; no research dataset                                        |
| Radiation and ALARA                          | OSDR, NLSP/LSDA, HRP, HRR                                                          | Biological studies and program descriptions                             | No exposure data                                                                                     |
| Environmental telemetry                      | HRR                                                                                | Risk vocabulary only                                                    | No environmental telemetry                                                                           |
| Medical capabilities and Earth communication | NLSP/LSDA, HRP, HRR                                                                | Program and risk descriptions                                           | No clinical capability                                                                               |

## 3. Verification status

Verified on 2026-11-16:

- OSDR landing page and terms page.
- ALSDA landing page.
- HRP program page.
- Standard Measures program page.
- NASA Open Data Portal landing page and the NLSP catalog entry.
- NASA SMD Science Information Policy and NASA Science Data Licenses.

Partially verified, and therefore not usable as evidence until re-checked:

| Resource                            | What is missing                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| NLSP / LSDA                         | The data-request guidelines page returned no readable content; request terms are unread.          |
| Human Research Open-Access Datasets | Individual dataset pages and their licence terms were not opened.                                 |
| Human Research Roadmap              | Purpose was confirmed from search results and a published description; body content did not load. |
| Space Apps                          | The legal page failed to load; event terms are unrecorded.                                        |
| NASA media guidelines               | Page fetched, but body text was not fully extracted; used only as a pointer.                      |

A partially verified resource stays outside `RESEARCH_DATASETS`. Verification is a precondition,
not a status label that can be inferred from a working link.

## 4. Policy references

| Reference                              | URL                                                                          | Use                                                                                                                                                                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NASA SMD Science Information Policy    | https://science.nasa.gov/researchers/science-data/science-information-policy | Open-access and reuse policy referenced by OSDR and ALSDA. It does not replace per-study terms.                                                                                                                       |
| NASA Science Data Licenses             | https://science.data.nasa.gov/about/license                                  | States that NASA-led mission data is CC0 unless marked with a restrictive notice, that other data carries no warranty, and that users should cite the original source. It must not be generalised to human LSDA data. |
| NASA Images and Media Usage Guidelines | https://www.nasa.gov/nasa-brand-center/images-and-media/                     | Governs non-data media on NASA pages. Astatine links to NASA pages and does not copy media.                                                                                                                           |

## 5. What this landscape does not establish

- It does not establish that any resource is suitable for model training.
- It does not establish that any study applies to a crew member, a mission profile, or a local
  check-in.
- It does not establish clinical validity, diagnostic value, or fitness-for-duty relevance.
- It does not transfer NASA's authority to Astatine, and NASA has not endorsed Astatine.
- It does not convert a request-based or credentialed resource into an open one.

## 6. Next steps

1. Re-verify every partially verified entry before citing it.
2. Choose at most one open candidate per domain and complete the dataset onboarding template.
3. Record a privacy review and lawful basis before any human data is accepted.
4. Keep model training behind a separate, documented, approved workflow.
5. Re-run the evaluation plan in [RESEARCH_EVALUATION.md](RESEARCH_EVALUATION.md) before any
   evidence reaches a product surface.

## 7. Related documents

- [RESEARCH.md](RESEARCH.md)
- [RESEARCH_EVALUATION.md](RESEARCH_EVALUATION.md)
- [DATASET_ONBOARDING_TEMPLATE.md](research/DATASET_ONBOARDING_TEMPLATE.md)
- [DATA_POLICY.md](DATA_POLICY.md)
