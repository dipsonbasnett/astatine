import type { ResearchInsight } from "@/features/research/evidence/types";
import {
  ONBOARDING_CHECKLIST_ID,
  type IngestionRequest,
} from "@/features/research/ingestion/types";
import type { CheckInRecord, DatasetProvenance, ResearchEntry } from "@/types/health";

export function makeCheckIn(overrides: Partial<CheckInRecord> = {}): CheckInRecord {
  return {
    id: "checkin-1",
    observedAt: "2026-11-16T08:00:00.000Z",
    sleepHours: 7.5,
    sleepQuality: 3,
    fatigue: 3,
    mood: 3,
    soreness: 2,
    stress: 2,
    hydration: 3,
    createdAt: "2026-11-16T08:00:00.000Z",
    updatedAt: "2026-11-16T08:00:00.000Z",
    source: {
      category: "recorded",
      origin: "crew-entry",
      label: "Crew-entered check-in",
    },
    ...overrides,
  };
}

export function makeDatasetProvenance(
  overrides: Partial<DatasetProvenance> = {},
): DatasetProvenance {
  return {
    category: "research",
    id: "dataset-example",
    title: "Example research dataset",
    creator: "Example Research Group",
    officialSourceUrl: "https://example.org/datasets/example",
    licenseName: "Creative Commons Attribution 4.0 International",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/legalcode",
    citation: "Example Research Group. Example research dataset, version 1.0.0 (2026).",
    identifier: {
      type: "doi",
      value: "10.0000/example",
      url: "https://doi.org/10.0000/example",
    },
    fileChecksum: {
      algorithm: "sha256",
      value: "a".repeat(64),
      manifestUrl: "https://example.org/datasets/example/SHA256SUMS.txt",
    },
    ingestedAt: "2026-11-16T08:00:00.000Z",
    intendedUse:
      "Evaluate the presentation of research context in tests. Not a clinical or crew-specific use.",
    limitations:
      "Synthetic fixture metadata only. It does not describe a real dataset, population, or measured outcome.",
    privacyStatus: "open-public",
    containsHumanData: false,
    privacyReview: {
      reviewedAt: "2026-11-16T08:00:00.000Z",
      reviewReference: "Repository test fixture; no participant data included.",
    },
    attributionRequirements: [
      "Credit the dataset creators and include the license notice.",
    ],
    modelTraining: { status: "not-used" },
    sourceVerification: {
      verifiedAt: "2026-11-16T08:00:00.000Z",
      verifiedBy: "Repository maintainer, role-level review",
      officialSource: true,
      licenseTerms: true,
      citation: true,
      checksum: true,
      privacy: true,
    },
    ...overrides,
  };
}

export function makeResearchEntry(overrides: Partial<ResearchEntry> = {}): ResearchEntry {
  return {
    id: "research-example",
    title: "Example human spaceflight reference",
    publisher: "Example Space Agency",
    url: "https://example.org/reference",
    accessedAt: "2026-11-01T00:00:00.000Z",
    kind: "program",
    summary:
      "An attributed example entry used to exercise the research context engine in tests.",
    topics: ["sleep", "countermeasures"],
    source: {
      category: "research",
      origin: "external",
      label: "External research context",
      publisher: "Example Space Agency",
      url: "https://example.org/reference",
      accessedAt: "2026-11-01T00:00:00.000Z",
      license: "Public domain",
    },
    ...overrides,
  };
}

export function makeResearchInsight(
  overrides: Partial<ResearchInsight> = {},
): ResearchInsight {
  return {
    id: "insight-example",
    title: "Example research insight",
    domain: "sleep-circadian-fatigue",
    dataClass: "research",
    summary:
      "A synthetic fixture describing how an external program frames a research area. It reports no result and describes no person.",
    sources: [
      {
        id: "source-example",
        category: "research",
        origin: "external",
        publisher: "Example Space Agency",
        title: "Example program overview",
        url: "https://example.org/program",
        accessedAt: "2026-11-16T00:00:00.000Z",
        sourceType: "program",
      },
    ],
    study: {
      id: "study-example",
      title: "Example program overview",
      design: "program-overview",
      conductedBy: "Example Space Agency",
      publicationYear: null,
      population: {
        description: "Program-level description with no participant sample.",
        species: "human",
        setting: "not-applicable",
        sampleSize: null,
        sampleSizeNote: "No sample is reported by a program overview.",
        inclusionNotes: "No inclusion criteria are reported.",
      },
      citation: {
        text: "Example Space Agency. Example program overview (accessed 2026-11-16).",
        identifier: {
          type: "unavailable",
          reason: "The fixture represents a program page with no persistent identifier.",
        },
      },
      limitations: ["Test fixture only; it reports no study result."],
    },
    measurements: [
      {
        id: "measurement-example",
        label: "Research emphasis",
        domain: "sleep-circadian-fatigue",
        unit: null,
        collectionMethod: "Public program description.",
        directionMeaning: "Not applicable; no measurement is reported.",
        normalization: "None.",
        missingValuePolicy: "Not applicable.",
      },
    ],
    statements: [
      {
        id: "statement-example",
        claim:
          "The source describes sleep and circadian adaptation as an area of human spaceflight research.",
        direction: "describes",
        observations: [
          {
            id: "observation-example",
            measurementId: "measurement-example",
            statement: "The program page names the research area.",
            valueType: "qualitative",
            effectSummary: null,
            unit: null,
            uncertainty: "No effect size or clinical threshold is reported.",
          },
        ],
        confidence: "low",
        confidenceBasis:
          "A single program overview with no reported study result or effect size.",
        limitations: ["Program overview only; no result is reported."],
        applicability: {
          appliesToSelectedUser: "not-personal",
          population: "No participant sample.",
          setting: "Program level.",
          statement:
            "This describes a research area and does not describe the selected crew member.",
        },
      },
    ],
    confidence: "low",
    confidenceBasis:
      "A single program overview with no reported study result or effect size.",
    limitations: [
      "Test fixture only.",
      "No effect size, clinical threshold, or personal applicability is claimed.",
    ],
    applicability: {
      appliesToSelectedUser: "not-personal",
      population: "No participant sample.",
      setting: "Program level.",
      statement:
        "This describes a research area and does not describe the selected crew member.",
    },
    license: {
      name: "Public NASA-style program page; linked only",
      url: "https://example.org/program",
      redistribution: "link-only",
      attribution: "Credit the publisher and link to the page.",
      note: "Link only; no text or media is bundled in this fixture.",
    },
    privacy: {
      status: "not-applicable",
      containsHumanData: false,
      deidentified: null,
      lawfulBasis: null,
      note: "A program page with no participant records.",
    },
    provenance: {
      datasetId: null,
      sourceVerifiedAt: "2026-11-16T00:00:00.000Z",
      verifiedBy: "Repository maintainer, role-level review",
      checksumVerified: false,
      reviewer: "Repository maintainer, role-level review",
      reviewedAt: "2026-11-16T00:00:00.000Z",
      version: "1.0.0",
      supersedes: null,
      reReviewDueAt: "2027-05-16T00:00:00.000Z",
    },
    modelTraining: "not-used",
    reviewStatus: "approved",
    lastReviewedAt: "2026-11-16T00:00:00.000Z",
    nextReviewDueAt: "2027-05-16T00:00:00.000Z",
    ...overrides,
  };
}

export function makeIngestionRequest(
  overrides: Partial<IngestionRequest> = {},
): IngestionRequest {
  return {
    id: "ingestion-example",
    datasetId: "dataset-example",
    onboarding: {
      completed: true,
      checklistId: ONBOARDING_CHECKLIST_ID,
      reference: "docs/research/onboarding-example.md",
      completedAt: "2026-11-16T08:00:00.000Z",
    },
    normalization: {
      required: false,
      mappings: [],
      note: "The fixture insight reports no numeric unit.",
    },
    missingValues: {
      rules: [
        {
          measurementId: "measurement-example",
          policy: "report-missing",
          note: "The fixture reports no numeric values.",
        },
      ],
      note: "No value is imputed.",
    },
    deidentification: null,
    privacy: {
      decision: "not-required",
      lawfulBasis: null,
      reviewReference: "No participant data in this fixture.",
      decidedBy: "Repository reviewer",
      decidedAt: "2026-11-16T08:00:00.000Z",
    },
    extraction: {
      insightIds: ["insight-example"],
      method: "manual",
      extractedBy: "Fixture extractor",
      extractedAt: "2026-11-16T09:00:00.000Z",
    },
    review: {
      decision: "approved",
      reviewer: "Fixture reviewer",
      reviewedAt: "2026-11-16T10:00:00.000Z",
      notes: "Checked the bounded claim against the cited program page.",
      checklistReference: "research-review-checklist-v1",
    },
    version: {
      version: "1.0.0",
      supersedes: null,
      changeNote: "Initial fixture version.",
      reReviewDueAt: "2027-05-16T00:00:00.000Z",
    },
    createdAt: "2026-11-16T08:00:00.000Z",
    notes: "Complete fixture request for pipeline tests.",
    ...overrides,
  };
}
