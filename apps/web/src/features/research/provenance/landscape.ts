import {
  isHttpsUrl,
  isIsoTimestamp,
  isNonEmptyString,
  isPlainObject,
} from "@/lib/validation";
import type { ValidationIssue, ValidationResult } from "@/types/health";

export type ResearchDomainId =
  | "cardiovascular"
  | "exercise-countermeasures"
  | "bone-musculoskeletal"
  | "sleep-circadian-fatigue"
  | "nutrition-hydration"
  | "behavioral-health"
  | "radiation"
  | "environmental-telemetry"
  | "medical-capabilities";

export type ResearchAccessModel =
  "open-public" | "request-based" | "credentialed" | "event-resource";

export type LandscapeKind =
  "repository" | "program" | "planning-tool" | "catalog" | "event";

export type LandscapeIngestionSuitability =
  "eligible-after-review" | "repository-level-review" | "request-only" | "not-evidence";

export type LandscapePrivacyStatus =
  "open-public" | "per-study" | "request-based" | "credentialed" | "not-applicable";

export type LandscapeVerificationStatus = "verified" | "partially-verified";

export interface ResearchLandscapeEntry {
  id: string;
  name: string;
  publisher: string;
  kind: LandscapeKind;
  officialUrl: string;
  purpose: string;
  dataTypes: readonly string[];
  accessModel: ResearchAccessModel;
  licenseName: string;
  licenseUrl: string | null;
  licenseNote: string;
  privacyStatus: LandscapePrivacyStatus;
  privacyNote: string;
  citationRequirement: string;
  ingestionSuitability: LandscapeIngestionSuitability;
  modelTraining: "not-approved";
  useCases: readonly string[];
  risks: readonly string[];
  domains: readonly ResearchDomainId[];
  verifiedAt: string;
  verificationStatus: LandscapeVerificationStatus;
  verificationNote: string;
}

export interface LandscapePolicyReference {
  id: string;
  name: string;
  url: string;
  note: string;
  verificationStatus: LandscapeVerificationStatus;
}

export const RESEARCH_DOMAIN_IDS: readonly ResearchDomainId[] = [
  "cardiovascular",
  "exercise-countermeasures",
  "bone-musculoskeletal",
  "sleep-circadian-fatigue",
  "nutrition-hydration",
  "behavioral-health",
  "radiation",
  "environmental-telemetry",
  "medical-capabilities",
];

export const RESEARCH_DOMAIN_LABELS: Record<ResearchDomainId, string> = {
  cardiovascular: "Cardiovascular",
  "exercise-countermeasures": "Exercise and countermeasures",
  "bone-musculoskeletal": "Bone and musculoskeletal",
  "sleep-circadian-fatigue": "Sleep, circadian rhythm, and fatigue",
  "nutrition-hydration": "Nutrition and hydration",
  "behavioral-health": "Behavioral health, workload, and teamwork",
  radiation: "Radiation and ALARA",
  "environmental-telemetry": "Environmental telemetry",
  "medical-capabilities": "Medical capabilities and Earth communication",
};

export const LANDSCAPE_KIND_LABELS: Record<LandscapeKind, string> = {
  repository: "Repository",
  program: "Program",
  "planning-tool": "Planning tool",
  catalog: "Metadata catalog",
  event: "Event resource",
};

export const ACCESS_MODEL_LABELS: Record<ResearchAccessModel, string> = {
  "open-public": "Open public",
  "request-based": "Request-based",
  credentialed: "Credentialed",
  "event-resource": "Event resource",
};

export const INGESTION_SUITABILITY_LABELS: Record<LandscapeIngestionSuitability, string> =
  {
    "eligible-after-review": "Eligible after full onboarding review",
    "repository-level-review": "Repository-level review required",
    "request-only": "Request-only; not eligible for automatic ingestion",
    "not-evidence": "Not evidence; discovery or context only",
  };

export const LANDSCAPE_PRIVACY_LABELS: Record<LandscapePrivacyStatus, string> = {
  "open-public": "Open public",
  "per-study": "Per-study review",
  "request-based": "Request-based",
  credentialed: "Credentialed access",
  "not-applicable": "Not applicable",
};

export const LANDSCAPE_VERIFIED_AT = "2026-11-16";

export const LANDSCAPE_SEPARATION_NOTE =
  "The landscape is a map of external resources. No resource listed here has been downloaded, checksum-verified, onboarded, or used to train a model.";

export const LANDSCAPE_DOMAIN_NOTES: Record<ResearchDomainId, string> = {
  cardiovascular:
    "Open pointers exist (OSDR, LSDA/NLSP, HRP, HRR), but no verified open crew cardiovascular dataset is held by Astatine.",
  "exercise-countermeasures":
    "Planned and completed activity is recorded locally; LSDA, Standard Measures, HRP, and HRR describe research context only.",
  "bone-musculoskeletal":
    "OSDR, LSDA, Standard Measures, HRP, and HRR describe research areas; none supplies a crew measurement today.",
  "sleep-circadian-fatigue":
    "Sleep entries are self-report. Program and study descriptions exist, but no open NASA sleep dataset has been onboarded.",
  "nutrition-hydration":
    "Entry counts are recorded locally. LSDA and HRP provide context; no intake dataset is used.",
  "behavioral-health":
    "Self-report stress, mood, and workload stay local. HRP, HRR, and Standard Measures describe the research area only.",
  radiation:
    "OSDR, LSDA, HRP, and HRR describe radiation research. Astatine holds no radiation exposure data.",
  "environmental-telemetry":
    "Only the HRR risk vocabulary covers this domain. Astatine ingests no environmental telemetry.",
  "medical-capabilities":
    "LSDA, HRP, and HRR describe medical operations research. Astatine provides no clinical capability.",
};

function text(maxLength = 500): (value: unknown) => boolean {
  return (value: unknown) => isNonEmptyString(value, maxLength);
}

function stringList(maxLength = 300): (value: unknown) => boolean {
  return (value: unknown) =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => isNonEmptyString(item, maxLength));
}

const ACCESS_MODELS: readonly ResearchAccessModel[] = [
  "open-public",
  "request-based",
  "credentialed",
  "event-resource",
];

const KINDS: readonly LandscapeKind[] = [
  "repository",
  "program",
  "planning-tool",
  "catalog",
  "event",
];

const SUITABILITY: readonly LandscapeIngestionSuitability[] = [
  "eligible-after-review",
  "repository-level-review",
  "request-only",
  "not-evidence",
];

const PRIVACY_STATUSES: readonly LandscapePrivacyStatus[] = [
  "open-public",
  "per-study",
  "request-based",
  "credentialed",
  "not-applicable",
];

export function isResearchLandscapeEntry(
  value: unknown,
): value is ResearchLandscapeEntry {
  if (!isPlainObject(value)) return false;
  if (!isNonEmptyString(value.id, 128)) return false;
  if (!isNonEmptyString(value.name, 200)) return false;
  if (!isNonEmptyString(value.publisher, 160)) return false;
  if (!KINDS.includes(value.kind as LandscapeKind)) return false;
  if (!isHttpsUrl(value.officialUrl)) return false;
  if (!text(600)(value.purpose)) return false;
  if (!stringList(200)(value.dataTypes)) return false;
  if (!ACCESS_MODELS.includes(value.accessModel as ResearchAccessModel)) return false;
  if (!isNonEmptyString(value.licenseName, 300)) return false;
  if (value.licenseUrl !== null && !isHttpsUrl(value.licenseUrl)) return false;
  if (!text(800)(value.licenseNote)) return false;
  if (!PRIVACY_STATUSES.includes(value.privacyStatus as LandscapePrivacyStatus)) {
    return false;
  }
  if (!text(800)(value.privacyNote)) return false;
  if (!text(600)(value.citationRequirement)) return false;
  if (
    !SUITABILITY.includes(value.ingestionSuitability as LandscapeIngestionSuitability)
  ) {
    return false;
  }
  if (value.modelTraining !== "not-approved") return false;
  if (!stringList(400)(value.useCases)) return false;
  if (!stringList(400)(value.risks)) return false;
  if (
    !Array.isArray(value.domains) ||
    !value.domains.every((domain) => RESEARCH_DOMAIN_IDS.includes(domain))
  ) {
    return false;
  }
  if (!isIsoTimestamp(value.verifiedAt)) return false;
  if (
    value.verificationStatus !== "verified" &&
    value.verificationStatus !== "partially-verified"
  ) {
    return false;
  }

  return text(800)(value.verificationNote);
}

export function validateResearchLandscape(
  input: unknown,
): ValidationResult<readonly ResearchLandscapeEntry[]> {
  if (!Array.isArray(input)) {
    return {
      ok: false,
      issues: [{ field: "landscape", message: "A research landscape list is required." }],
    };
  }

  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const urls = new Set<string>();

  input.forEach((entry: unknown, index: number) => {
    if (!isResearchLandscapeEntry(entry)) {
      issues.push({
        field: `landscape.${index}`,
        message:
          "Landscape entry is missing a required field, uses an unverified value, or is not marked as unavailable for model training.",
      });
      return;
    }

    if (ids.has(entry.id)) {
      issues.push({
        field: `landscape.${index}.id`,
        message: "Landscape ids must be unique.",
      });
    }
    if (urls.has(entry.officialUrl)) {
      issues.push({
        field: `landscape.${index}.officialUrl`,
        message: "Landscape official urls must be unique.",
      });
    }
    if (
      entry.licenseUrl === null &&
      !/not specified|not verified|per-request|per dataset|varies/i.test(
        entry.licenseName,
      )
    ) {
      issues.push({
        field: `landscape.${index}.licenseUrl`,
        message:
          "A missing license url must be paired with an explicit 'not specified' or per-request license name.",
      });
    }

    ids.add(entry.id);
    urls.add(entry.officialUrl);
  });

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: input as readonly ResearchLandscapeEntry[] };
}

const NASA_SMD_POLICY =
  "https://science.nasa.gov/researchers/science-data/science-information-policy";
const NASA_MEDIA_GUIDELINES = "https://www.nasa.gov/nasa-brand-center/images-and-media/";
const OSDR_LICENSE =
  "NASA SMD Science Information Policy; per-study citation and acknowledgement requirements apply";

export const RESEARCH_LANDSCAPE: readonly ResearchLandscapeEntry[] = [
  {
    id: "nasa-osdr",
    name: "NASA Open Science Data Repository (OSDR)",
    publisher: "NASA",
    kind: "repository",
    officialUrl: "https://science.nasa.gov/biological-physical/data/",
    purpose:
      "Public repository for spaceflight and analog biological and physical science data, including GeneLab and combined study records.",
    dataTypes: [
      "Omics and assay data",
      "Study metadata and protocols",
      "Non-human and human biological study records",
    ],
    accessModel: "open-public",
    licenseName: OSDR_LICENSE,
    licenseUrl: NASA_SMD_POLICY,
    licenseNote:
      "OSDR terms state that public content may be viewed and downloaded for research use. Redistribution follows the NASA SMD Science Information Policy, and each study keeps its own citation and acknowledgement requirements.",
    privacyStatus: "per-study",
    privacyNote:
      "OSDR holds both human and non-human studies. A human dataset needs a per-study privacy and lawful-basis review before any use.",
    citationRequirement:
      "Use the preferred citation from the study's OSDR record and acknowledge the repository, as its terms request.",
    ingestionSuitability: "repository-level-review",
    modelTraining: "not-approved",
    useCases: [
      "Learn study and metadata structures for a future extraction pipeline",
      "Map spaceflight-relevant research areas to Astatine domains",
      "OSD-942 supplies one reviewed exercise-countermeasure insight",
    ],
    risks: [
      "Repository-level terms do not replace per-study review",
      "Omics or assay data is not a crew health measurement",
      "A human study still needs a privacy review",
      "OSD-942 is a ground bed-rest analog, not spaceflight",
    ],
    domains: [
      "cardiovascular",
      "exercise-countermeasures",
      "bone-musculoskeletal",
      "radiation",
    ],
    verifiedAt: LANDSCAPE_VERIFIED_AT,
    verificationStatus: "verified",
    verificationNote:
      "Repository landing page and the OSDR terms and conditions page were read on the access date.",
  },
  {
    id: "nasa-alsda",
    name: "Ames Life Sciences Data Archive (ALSDA)",
    publisher: "NASA",
    kind: "repository",
    officialUrl:
      "https://www.nasa.gov/ames/space-biosciences/ames-life-sciences-data-archive/",
    purpose:
      "Official repository for non-human science data generated by NASA's Space Biology Program, hosted within OSDR.",
    dataTypes: ["Non-human space biology study data", "Study metadata"],
    accessModel: "open-public",
    licenseName:
      "NASA SMD Science Information Policy via OSDR; per-study requirements apply",
    licenseUrl: NASA_SMD_POLICY,
    licenseNote:
      "Access and redistribution follow the OSDR terms. Individual studies may add citation or acknowledgement requirements.",
    privacyStatus: "not-applicable",
    privacyNote:
      "The archive is described as non-human science data, so it carries no crew personal data.",
    citationRequirement:
      "Cite the study record and acknowledge the archive and repository.",
    ingestionSuitability: "not-evidence",
    modelTraining: "not-approved",
    useCases: [
      "Study metadata conventions used by NASA life-science archives",
      "Understand non-human evidence boundaries before any transfer claim",
    ],
    risks: [
      "Non-human data cannot ground a human crew-health statement",
      "A transfer from animal to astronaut health is not established by the archive",
    ],
    domains: [],
    verifiedAt: LANDSCAPE_VERIFIED_AT,
    verificationStatus: "verified",
    verificationNote:
      "Archive landing page was read on the access date and describes non-human data hosted in OSDR.",
  },
  {
    id: "nasa-nlsp-lsda",
    name: "NASA Life Sciences Portal (NLSP) and Life Sciences Data Archive (LSDA)",
    publisher: "NASA",
    kind: "repository",
    officialUrl: "https://nlsp.nasa.gov/",
    purpose:
      "Portal for requesting access to LSDA, which holds human, plant, and animal life-science studies from early flight programs, the Space Shuttle, the ISS, and analog campaigns.",
    dataTypes: [
      "De-identified human research data",
      "Analog study data such as bed rest",
      "Plant and animal study data",
      "Study documentation",
    ],
    accessModel: "request-based",
    licenseName:
      "Not specified in the public catalog entry; per-request data-use terms apply",
    licenseUrl: null,
    licenseNote:
      "The NASA Open Data Portal catalog entry for NLSP records 'License not specified'. Terms must be read and recorded for each approved request.",
    privacyStatus: "request-based",
    privacyNote:
      "Human data is de-identified and released through a request process. Public bulk download is not assumed.",
    citationRequirement:
      "Follow the citation and acknowledgement instructions issued with an approved data request.",
    ingestionSuitability: "request-only",
    modelTraining: "not-approved",
    useCases: [
      "Identify analog and flight studies that could be requested later",
      "Understand the human-data request boundary before any onboarding attempt",
    ],
    risks: [
      "Access requires approval and a data-use agreement",
      "Per-request terms are not captured in a public license",
      "A data-request guidelines page did not render content on the access date",
      "Analog studies are not the same setting as a long-duration mission",
    ],
    domains: [
      "cardiovascular",
      "exercise-countermeasures",
      "bone-musculoskeletal",
      "sleep-circadian-fatigue",
      "nutrition-hydration",
      "behavioral-health",
      "radiation",
      "medical-capabilities",
    ],
    verifiedAt: LANDSCAPE_VERIFIED_AT,
    verificationStatus: "partially-verified",
    verificationNote:
      "Portal landing page and the data.nasa.gov catalog entry were read. The data-request guidelines page returned no readable content, so request terms remain unread at the source.",
  },
  {
    id: "nasa-human-open-access-datasets",
    name: "Human Research Open-Access Datasets (NLSP)",
    publisher: "NASA",
    kind: "repository",
    officialUrl: "https://www.nasa.gov/hrp/nlsp/",
    purpose:
      "Curated human research datasets published through NLSP, including bed-rest analog studies, offered for research use.",
    dataTypes: [
      "De-identified human analog study data",
      "Questionnaires and functional measures",
    ],
    accessModel: "request-based",
    licenseName: "Not verified per dataset; access and terms are described through NLSP",
    licenseUrl: null,
    licenseNote:
      "The 'open-access' label describes research availability, not a blanket content license. Each dataset needs its own terms review.",
    privacyStatus: "request-based",
    privacyNote:
      "Human participant records require a per-dataset de-identification and lawful-basis review before any use.",
    citationRequirement:
      "Cite the dataset record and follow the acknowledgement terms supplied with access.",
    ingestionSuitability: "request-only",
    modelTraining: "not-approved",
    useCases: [
      "Identify analog-study publication patterns for future evaluation",
      "Compare study documentation quality without ingesting records",
    ],
    risks: [
      "Per-dataset terms were not verified on the access date",
      "Bed-rest analogs do not represent spaceflight conditions",
      "An 'open-access' label is not a redistribution license",
    ],
    domains: [
      "cardiovascular",
      "exercise-countermeasures",
      "bone-musculoskeletal",
      "nutrition-hydration",
      "behavioral-health",
    ],
    verifiedAt: LANDSCAPE_VERIFIED_AT,
    verificationStatus: "partially-verified",
    verificationNote:
      "The NLSP program page lists the collection. Individual dataset pages and terms were not opened, so every dataset remains unverified.",
  },
  {
    id: "nasa-hrp",
    name: "NASA Human Research Program (HRP)",
    publisher: "NASA",
    kind: "program",
    officialUrl: "https://www.nasa.gov/hrp/",
    purpose:
      "Program overview describing how NASA uses research to protect astronaut health and performance, with links to risks, data, and publications.",
    dataTypes: ["Program overview pages", "Links to risks, data, and publications"],
    accessModel: "open-public",
    licenseName: "Public NASA program page; linked and quoted only",
    licenseUrl: NASA_MEDIA_GUIDELINES,
    licenseNote:
      "This is a public program page, not a dataset. Astatine links to it and does not copy text, figures, or media into the product.",
    privacyStatus: "not-applicable",
    privacyNote: "The page describes a program and does not publish participant records.",
    citationRequirement:
      "Cite the page title, NASA, URL, and accessed date. A link is not an endorsement.",
    ingestionSuitability: "not-evidence",
    modelTraining: "not-approved",
    useCases: [
      "Program-level context shown next to sleep and exercise coach items",
      "A source for bounded claims that do not report results",
    ],
    risks: [
      "A program overview is not a study and reports no effect size",
      "It cannot evaluate a crew member or the local rubric",
      "NASA does not endorse Astatine",
    ],
    domains: [
      "cardiovascular",
      "exercise-countermeasures",
      "bone-musculoskeletal",
      "sleep-circadian-fatigue",
      "behavioral-health",
      "radiation",
      "medical-capabilities",
    ],
    verifiedAt: LANDSCAPE_VERIFIED_AT,
    verificationStatus: "verified",
    verificationNote:
      "Program page was read on the access date. It was modified on 2026-10-14 according to the page metadata.",
  },
  {
    id: "nasa-hrr",
    name: "Human Research Roadmap (HRR)",
    publisher: "NASA",
    kind: "planning-tool",
    officialUrl: "https://humanresearchroadmap.nasa.gov/",
    purpose:
      "Overview of the risks and knowledge gaps that HRP associates with human spaceflight, organized as the Integrated Research Plan.",
    dataTypes: [
      "Risk and knowledge-gap descriptions",
      "Integrated Research Plan structure",
    ],
    accessModel: "open-public",
    licenseName: "Public NASA web content; used as a risk taxonomy only",
    licenseUrl: NASA_MEDIA_GUIDELINES,
    licenseNote:
      "A planning and risk-taxonomy resource, not a data release. Astatine would use its vocabulary, not its content as evidence.",
    privacyStatus: "not-applicable",
    privacyNote: "No participant-level records are published on the roadmap.",
    citationRequirement:
      "Cite the roadmap page and NASA, with the accessed date; do not present a risk label as a finding.",
    ingestionSuitability: "not-evidence",
    modelTraining: "not-approved",
    useCases: [
      "Align Astatine health domains with published risk vocabulary",
      "Name a domain where no dataset exists",
    ],
    risks: [
      "Knowledge gaps are questions, not results",
      "Risk labels can be misread as diagnoses",
      "The page did not load body content during verification",
    ],
    domains: [...RESEARCH_DOMAIN_IDS],
    verifiedAt: LANDSCAPE_VERIFIED_AT,
    verificationStatus: "partially-verified",
    verificationNote:
      "Purpose was confirmed from search results and the page's published description; a direct fetch did not return body content.",
  },
  {
    id: "nasa-standard-measures",
    name: "NASA Standard Measures",
    publisher: "NASA",
    kind: "program",
    officialUrl: "https://www.nasa.gov/reference/standard-measures/",
    purpose:
      "A standardized multidisciplinary set of measures studying how isolation, confinement, weightlessness, and other space hazards affect human health and performance.",
    dataTypes: [
      "Questionnaires",
      "Cognitive and physical tests",
      "Biological samples",
      "Derived measures",
    ],
    accessModel: "request-based",
    licenseName: "Not specified for the data; access runs through LSDA and NLSP",
    licenseUrl: null,
    licenseNote:
      "The program page describes the measures, not an open file. Data access is described through LSDA and NLSP, so request terms apply.",
    privacyStatus: "request-based",
    privacyNote:
      "Crew measures are human data and require a request, de-identification review, and lawful basis.",
    citationRequirement:
      "Cite the Standard Measures program page and follow the terms issued with any approved data access.",
    ingestionSuitability: "request-only",
    modelTraining: "not-approved",
    useCases: [
      "Understand which measure families exist across domains",
      "Compare local check-in concepts with published measure categories",
    ],
    risks: [
      "The battery is a protocol design, not a public dataset",
      "Measure names do not supply reference values",
      "Biological sample data is not available for public ingestion",
    ],
    domains: [
      "cardiovascular",
      "exercise-countermeasures",
      "bone-musculoskeletal",
      "sleep-circadian-fatigue",
      "behavioral-health",
    ],
    verifiedAt: LANDSCAPE_VERIFIED_AT,
    verificationStatus: "verified",
    verificationNote:
      "Program page was read on the access date. Access route was cross-checked against a 2025 peer-reviewed program description.",
  },
  {
    id: "nasa-open-data-portal",
    name: "NASA Open Data Portal",
    publisher: "NASA",
    kind: "catalog",
    officialUrl: "https://data.nasa.gov/",
    purpose:
      "Public metadata catalog that describes NASA datasets and links to the archives that host them.",
    dataTypes: ["Dataset metadata records", "Links to hosting archives"],
    accessModel: "open-public",
    licenseName: "Per catalog entry; many records state 'License not specified'",
    licenseUrl: null,
    licenseNote:
      "The catalog is a discovery layer, not a license grant. Each linked dataset needs its own license and privacy review.",
    privacyStatus: "not-applicable",
    privacyNote:
      "The portal publishes metadata. Linked datasets may contain human data and are reviewed separately.",
    citationRequirement:
      "Cite the catalog record and the hosting archive; do not treat the catalog entry as the data source.",
    ingestionSuitability: "not-evidence",
    modelTraining: "not-approved",
    useCases: [
      "Discover official dataset landing pages",
      "Record where a license is missing before proposing ingestion",
    ],
    risks: [
      "'License not specified' entries cannot be onboarded",
      "Metadata can be stale or point to a moved archive",
      "A catalog listing is not a verification",
    ],
    domains: [],
    verifiedAt: LANDSCAPE_VERIFIED_AT,
    verificationStatus: "verified",
    verificationNote:
      "Portal landing page was read on the access date; the NLSP catalog entry was used to confirm the license gap.",
  },
  {
    id: "nasa-space-apps",
    name: "NASA International Space Apps Challenge",
    publisher: "NASA",
    kind: "event",
    officialUrl: "https://www.spaceappschallenge.org/",
    purpose:
      "Annual hackathon that publishes challenge briefs and event resources, some of which point to external datasets.",
    dataTypes: ["Challenge briefs", "Event resources", "Links to external datasets"],
    accessModel: "event-resource",
    licenseName:
      "Participant terms and event rules; linked resource licenses vary and are not verified",
    licenseUrl: null,
    licenseNote:
      "The event legal page did not return content during verification. Nothing from the event is used as evidence.",
    privacyStatus: "not-applicable",
    privacyNote: "The event is not a health-data repository.",
    citationRequirement:
      "Event rules require citing sources used; each linked dataset keeps its own citation terms.",
    ingestionSuitability: "not-evidence",
    modelTraining: "not-approved",
    useCases: [
      "Discovery pointer for challenge resources, reviewed like any other source",
    ],
    risks: [
      "A 48-hour event context is not a curation or review process",
      "Event rules do not license third-party datasets",
      "The legal page could not be read on the access date",
    ],
    domains: [],
    verifiedAt: LANDSCAPE_VERIFIED_AT,
    verificationStatus: "partially-verified",
    verificationNote:
      "Event landing page was confirmed from search results. The legal page failed to load, so terms are not recorded.",
  },
];

export const LANDSCAPE_POLICY_REFERENCES: readonly LandscapePolicyReference[] = [
  {
    id: "nasa-smd-science-information-policy",
    name: "NASA SMD Science Information Policy",
    url: NASA_SMD_POLICY,
    note: "Open-access and reuse policy referenced by OSDR and ALSDA. It does not replace per-study terms.",
    verificationStatus: "verified",
  },
  {
    id: "nasa-science-data-licenses",
    name: "NASA Science Data Licenses",
    url: "https://science.data.nasa.gov/about/license",
    note: "States that NASA-led mission data is CC0 unless marked with a restrictive notice, that other data carries no warranty, and that users should cite the original source. It must not be generalized to human LSDA data.",
    verificationStatus: "verified",
  },
  {
    id: "nasa-media-guidelines",
    name: "NASA Images and Media Usage Guidelines",
    url: NASA_MEDIA_GUIDELINES,
    note: "Governs non-data media on NASA pages. Astatine links to NASA pages and does not copy media.",
    verificationStatus: "partially-verified",
  },
];

export function landscapeEntryById(id: string): ResearchLandscapeEntry | undefined {
  return RESEARCH_LANDSCAPE.find((entry) => entry.id === id);
}

export function landscapeEntriesForDomain(
  domain: ResearchDomainId,
  entries: readonly ResearchLandscapeEntry[] = RESEARCH_LANDSCAPE,
): ResearchLandscapeEntry[] {
  return entries.filter((entry) => entry.domains.includes(domain));
}
