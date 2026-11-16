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
