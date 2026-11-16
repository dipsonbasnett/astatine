import type { DatasetProvenance } from "@/types/health";

export const OSD_942_DATASET_ID = "osd-942";

export const OSD_942_METADATA_ARTIFACT = {
  name: "OSD-942_metadata_OSD-942-ISA.zip",
  bytes: 53295,
  sha256: "cc9aafaf869247d50ad8a53aaf161eae3b6686f041403cd275250f0f22a90247",
  note: "The publisher does not list an upstream SHA-256 for this package. The value was computed from the file downloaded from the official OSDR endpoint on 2026-11-16.",
} as const;

export const OSD_942_DATASET: DatasetProvenance = {
  category: "research",
  id: OSD_942_DATASET_ID,
  title:
    "OSD-942: Exercise Training Attenuates the Muscle Mitochondria Genomic Response to Bed Rest",
  creator: "NASA Open Science Data Repository (OSDR) / GeneLab",
  officialSourceUrl: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-942",
  licenseName: "Creative Commons CC0 1.0 Universal (CC0-1.0)",
  licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/legalcode",
  citation:
    "Cotter JA, Plaza-Florido A, Adams GR, Haddad F, Scott JM, Everett M, Ploutz-Snyder L, Radom-Aizik S. Exercise Training Attenuates the Muscle Mitochondria Genomic Response to Bed Rest. Med Sci Sports Exerc. 2024;56(9):1615-1622. doi:10.1249/MSS.0000000000003457. Dataset: NASA OSDR OSD-942 (GLDS-770), version 2, doi:10.26030/2ngb-7470.",
  identifier: {
    type: "doi",
    value: "10.26030/2ngb-7470",
    url: "https://doi.org/10.26030/2ngb-7470",
  },
  fileChecksum: {
    algorithm: "sha256",
    value: OSD_942_METADATA_ARTIFACT.sha256,
  },
  ingestedAt: "2026-11-16T00:00:00.000Z",
  intendedUse:
    "Provide population-level research context about exercise countermeasures during long-duration bed rest on the Recovery readiness and Mission health brief surfaces. It does not personalize readiness, diagnose, treat, or predict outcomes for any user.",
  limitations:
    "Single 70-day, 6-degree head-down bed-rest analog with 22 healthy young men (7 control, 7 traditional exercise, 8 flywheel exercise). Transcriptomic microarray only, with no protein or histology. The sample is small and men-only, bed rest does not reproduce spaceflight, and exercise attenuated rather than eliminated the molecular response. Gene-level thresholds were fold change > 1.2 and P < 0.05 without a reported multiple-testing correction.",
  privacyStatus: "de-identified-public",
  containsHumanData: true,
  privacyReview: {
    reviewedAt: "2026-11-16T00:00:00.000Z",
    reviewReference:
      "OSD-942 version 2 public release. The ISA metadata lists sample accessions, age, sex, tissue, factors, and timepoints but no names, contact details, or other direct identifiers. The publication reports IRB approval at NASA Johnson Space Center and the University of Texas Medical Branch, plus written informed consent.",
    lawfulBasis:
      "NASA OSDR public release of de-identified human research data under CC0-1.0, with study IRB approval and written informed consent reported by the authors.",
  },
  attributionRequirements: [
    "Credit the study authors and NASA OSDR/GeneLab when referencing the dataset or findings.",
    "Cite the publication (doi:10.1249/MSS.0000000000003457) and the dataset (doi:10.26030/2ngb-7470).",
    "Do not state or imply NASA endorsement, clinical validation, or model training.",
  ],
  modelTraining: { status: "not-used" },
  sourceVerification: {
    verifiedAt: "2026-11-16T00:00:00.000Z",
    verifiedBy: "Repository maintainer, role-level review",
    officialSource: true,
    licenseTerms: true,
    citation: true,
    checksum: true,
    privacy: true,
  },
};
