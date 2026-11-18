import { isDatasetProvenance } from "@/lib/validation";
import type {
  DatasetPrivacyStatus,
  DatasetProvenance,
  ValidationIssue,
  ValidationResult,
} from "@/types/health";

import { OSD_942_DATASET } from "./datasets/osd-942/provenance";

export const DATASET_SEPARATION_NOTE =
  "Research datasets are external, attributed context. They are never merged with recorded check-ins or simulated telemetry, and they never represent the selected crew member or astronaut.";

export const DATASET_ONBOARDING_CHECKLIST = [
  "Open the publisher's official dataset page and confirm it is the canonical source, not a mirror.",
  "Read the exact license or terms page and record its name and URL.",
  "Confirm redistribution, adaptation, and attribution terms permit the intended use.",
  "Record the creator or rights holder exactly as published.",
  "Copy the publisher's preferred citation and version information.",
  "Record a DOI or persistent identifier, or document why none is available.",
  "Download from the official source and verify the SHA-256 checksum against an official manifest.",
  "Record the ingestion date and the controlled workspace that holds the reviewed file.",
  "Write a specific, non-clinical intended use and explicit limitations.",
  "Record privacy status; for human data, record a lawful basis and a privacy review.",
  "Write actionable attribution requirements that reproduce the required credit.",
  "Record model-training use as not used unless explicit evidence and model identifiers exist.",
  "Complete every source-verification check before adding the dataset to the registry.",
] as const;

export const SOURCE_VERIFICATION_STEPS = [
  {
    id: "official-source",
    label: "Official source",
    description:
      "Open the publisher's dataset landing page, confirm the version, and reject mirrors or unattributed copies.",
  },
  {
    id: "license-terms",
    label: "License and terms",
    description:
      "Read the license or access terms at the source, record the license name and URL, and confirm the intended use is permitted.",
  },
  {
    id: "citation",
    label: "Citation",
    description:
      "Capture the publisher's preferred citation, version, creators, and persistent identifier.",
  },
  {
    id: "checksum",
    label: "File checksum",
    description:
      "Download from the official source and compare the SHA-256 checksum with an official manifest or compute it from the reviewed file.",
  },
  {
    id: "privacy",
    label: "Privacy",
    description:
      "Confirm whether the dataset contains human data, record privacy status, and complete a lawful-basis and de-identification review where required.",
  },
] as const;

export const PRIVACY_STATUS_LABELS: Record<DatasetPrivacyStatus, string> = {
  "open-public": "Open public",
  "de-identified-public": "De-identified public",
  "credentialed-access": "Credentialed access",
  "restricted-not-approved": "Restricted, not approved",
};

export const PRIVACY_STATUS_DESCRIPTIONS: Record<DatasetPrivacyStatus, string> = {
  "open-public": "No human participant records were identified in the reviewed release.",
  "de-identified-public":
    "Public human data with a recorded de-identification review and lawful basis.",
  "credentialed-access":
    "Access requires credentials, a data-use agreement, or both; it is not eligible for automatic ingestion.",
  "restricted-not-approved": "Not approved for onboarding or display.",
};

// One dataset has completed the onboarding template and passed validation.
export const RESEARCH_DATASETS: readonly DatasetProvenance[] = [OSD_942_DATASET];

export function validateDatasetRegistry(
  input: unknown,
): ValidationResult<readonly DatasetProvenance[]> {
  if (!Array.isArray(input)) {
    return {
      ok: false,
      issues: [{ field: "datasets", message: "A dataset registry list is required." }],
    };
  }

  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const sourceUrls = new Set<string>();

  input.forEach((dataset: unknown, index: number) => {
    if (!isDatasetProvenance(dataset)) {
      issues.push({
        field: `datasets.${index}`,
        message:
          "Dataset provenance is incomplete, unverified, or missing a required integrity field.",
      });
      return;
    }

    if (dataset.privacyStatus === "restricted-not-approved") {
      issues.push({
        field: `datasets.${index}.privacyStatus`,
        message: "Dataset is not approved for onboarding.",
      });
    }
    if (ids.has(dataset.id)) {
      issues.push({
        field: `datasets.${index}.id`,
        message: "Dataset ids must be unique.",
      });
    }
    if (sourceUrls.has(dataset.officialSourceUrl)) {
      issues.push({
        field: `datasets.${index}.officialSourceUrl`,
        message: "Dataset source urls must be unique.",
      });
    }

    ids.add(dataset.id);
    sourceUrls.add(dataset.officialSourceUrl);
  });

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: input as DatasetProvenance[] };
}

export function datasetIdentifierLabel(dataset: DatasetProvenance): string {
  const identifier = dataset.identifier;
  if (identifier.type === "unavailable") {
    return `No DOI or persistent identifier: ${identifier.reason}`;
  }

  const typeLabel =
    identifier.type === "doi"
      ? "DOI"
      : identifier.type === "persistent"
        ? "Persistent identifier"
        : "Accession";

  return `${typeLabel}: ${identifier.value}`;
}

export function datasetAttributionLines(dataset: DatasetProvenance): string[] {
  return [
    dataset.citation,
    `License: ${dataset.licenseName}. ${dataset.licenseUrl}`,
    ...dataset.attributionRequirements,
  ];
}

export function datasetTrainingDisclosure(dataset: DatasetProvenance): string {
  if (dataset.modelTraining.status === "not-used") {
    return "Not used for model training.";
  }

  return `Used for model training by ${dataset.modelTraining.modelIds.join(", ")}. Evidence: ${dataset.modelTraining.evidenceUrl}. Documented ${dataset.modelTraining.documentedAt.slice(0, 10)}.`;
}

export function datasetVerificationLine(dataset: DatasetProvenance): string {
  return `Verified ${dataset.sourceVerification.verifiedAt.slice(0, 10)} by ${dataset.sourceVerification.verifiedBy}.`;
}
