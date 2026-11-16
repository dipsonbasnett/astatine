import type { ResearchInsight } from "../../evidence/types";
import { OSD_942_DATASET_ID } from "./provenance";
import { OSD_942_REPORTED_RESULTS as RESULTS } from "./reported-results";

export const OSD_942_INSIGHT_ID = "osd-942-exercise-mitochondria-bed-rest";

const DATASET_URL = "https://osdr.nasa.gov/bio/repo/data/studies/OSD-942";
const PUBLICATION_URL = "https://doi.org/10.1249/MSS.0000000000003457";
const ACCESSED_AT = "2026-11-16T00:00:00.000Z";
const REVIEWED_AT = "2026-11-16T00:00:00.000Z";
const NEXT_REVIEW = "2027-05-16T00:00:00.000Z";

const STUDY_LIMITATIONS = [
  "Small randomized groups of 7, 7, and 8 participants.",
  "Men only, with a mean age of about 32 years; findings are not representative of women or older adults.",
  "Transcriptomic microarrays only; no protein, histology, or functional mitochondrial assays were completed.",
  "A 70-day, 6-degree head-down tilt bed-rest analog may not reproduce spaceflight conditions.",
  "Gene-level differences used P < 0.05 without a reported multiple-testing correction.",
] as const;

const APPLICABILITY = {
  appliesToSelectedUser: "not-personal",
  population:
    "22 healthy young men in a 70-day, 6-degree head-down tilt bed-rest analog.",
  setting:
    "Ground-based bed-rest analog, not spaceflight and not a personal measurement.",
  statement:
    "Describes a population-level response to bed rest with and without supervised exercise. It does not predict any Astatine user's response to exercise, bed rest, or spaceflight.",
} as const;

export const OSD_942_INSIGHT: ResearchInsight = {
  id: OSD_942_INSIGHT_ID,
  title:
    "Exercise training attenuated mitochondrial gene downregulation during long-duration bed rest",
  domain: "exercise-countermeasures",
  dataClass: "research",
  summary:
    "In a 70-day, 6-degree head-down tilt bed-rest analog, 22 healthy young men were randomized to bed rest only (n=7), bed rest plus traditional aerobic and resistance training (n=7), or bed rest plus flywheel training (n=8). Vastus lateralis microarray analysis on day 64 identified 2,113 annotated genes altered in at least one group (fold change > 1.2, P < 0.05). Exercise attenuated the bed-rest effect in 511 genes, largely preventing the predominant downregulation seen in the bed-rest-only group, with no significant difference between exercise modalities. Thirty-five microRNAs changed with bed rest without a between-group difference, and exercise did not fully prevent all molecular changes.",
  sources: [
    {
      id: "osd-942-source-dataset",
      category: "research",
      origin: "external",
      publisher: "NASA Open Science Data Repository (OSDR)",
      title:
        "OSD-942: Exercise Training Attenuates the Muscle Mitochondria Genomic Response to Bed Rest",
      url: DATASET_URL,
      accessedAt: ACCESSED_AT,
      sourceType: "dataset",
    },
    {
      id: "osd-942-source-publication",
      category: "research",
      origin: "external",
      publisher: "Medicine & Science in Sports & Exercise",
      title:
        "Exercise Training Attenuates the Muscle Mitochondria Genomic Response to Bed Rest",
      url: PUBLICATION_URL,
      accessedAt: ACCESSED_AT,
      sourceType: "publication",
    },
  ],
  study: {
    id: "osd-942-study",
    title:
      "Exercise Training Attenuates the Muscle Mitochondria Genomic Response to Bed Rest",
    design: "experiment",
    conductedBy:
      "NASA Human Research Program with the University of Texas Medical Branch and the University of California, Irvine",
    publicationYear: 2024,
    population: {
      description:
        "22 healthy young men (mean age 32.3 +/- 6.2 years) who completed a 70-day bed-rest intervention and had vastus lateralis biopsies for genomic analysis.",
      species: "human",
      setting: "analog",
      sampleSize: 22,
      sampleSizeNote:
        "22 of 26 participants who completed the intervention contributed 44 samples: pre-bed-rest and day 64.",
      inclusionNotes:
        "Healthy young men randomized to bed rest only, bed rest with traditional exercise, or bed rest with flywheel exercise. Women were not included.",
    },
    citation: {
      text: RESULTS.citation,
      identifier: {
        type: "doi",
        value: "10.1249/MSS.0000000000003457",
        url: PUBLICATION_URL,
      },
    },
    limitations: STUDY_LIMITATIONS,
  },
  measurements: [
    {
      id: "osd-942-measurement-gene-expression",
      label: "Vastus lateralis gene expression (microarray)",
      domain: "exercise-countermeasures",
      unit: "log2 intensity",
      collectionMethod:
        "Agilent GPL21185 microarray of vastus lateralis biopsies collected one day before and on day 64 of bed rest, analyzed with GeneSpring GX 14.9.1.",
      directionMeaning:
        "Higher log2 intensity indicates greater transcript abundance. Reported fold changes compare day 64 with the pre-bed-rest value within each group.",
      normalization:
        "The publication quantile-normalized raw data. Astatine's structural check applied log2, quantile normalization across all 44 arrays, and median centering without re-running the authors' differential-expression model.",
      missingValuePolicy:
        "Only detected entities passing the authors' 20th-percentile filter in at least one of six conditions were analyzed. Astatine found no non-positive signal and imputed no value.",
    },
    {
      id: "osd-942-measurement-microrna-expression",
      label: "Vastus lateralis microRNA expression (microarray)",
      domain: "exercise-countermeasures",
      unit: "log2 intensity",
      collectionMethod:
        "MicroRNA microarray of the same vastus lateralis biopsies, analyzed with GeneSpring GX 14.9.1.",
      directionMeaning:
        "Higher log2 intensity indicates greater microRNA abundance. Reported fold changes compare day 64 with the pre-bed-rest value.",
      normalization:
        "The publication quantile-normalized raw data. Astatine records the reported microRNA results and did not recompute them.",
      missingValuePolicy:
        "Entities flagged as detected in at least one of six conditions were analyzed. No value was imputed.",
    },
  ],
  statements: [
    {
      id: "osd-942-statement-exercise-attenuates",
      claim:
        "In a 70-day head-down tilt bed-rest analog, supervised aerobic and resistance training attenuated the bed-rest-associated downregulation of muscle genes, including mitochondrial-related pathways, in healthy young men.",
      direction: "supports",
      observations: [
        {
          id: "osd-942-observation-gene-interaction",
          measurementId: "osd-942-measurement-gene-expression",
          statement:
            "Bed rest altered 2,113 annotated genes in at least one group, and an interaction analysis identified 511 annotated genes whose bed-rest response differed with exercise.",
          valueType: "quantitative",
          effectSummary: `In the bed-rest-only group, ${RESULTS.downregulatedInBedRestOnly} of these genes were downregulated and ${RESULTS.upregulatedInBedRestOnly} were upregulated; exercise attenuated this pattern.`,
          unit: "annotated genes",
          uncertainty:
            "Fold change > 1.2 and P < 0.05 without a reported multiple-testing correction for the gene lists; small groups and array-based transcript estimates.",
        },
        {
          id: "osd-942-observation-mirna",
          measurementId: "osd-942-measurement-microrna-expression",
          statement: `Bed rest altered ${RESULTS.microRnasAltered} microRNAs, with no difference between the three groups; ${RESULTS.microRnasLinkedToMitochondrialGenes} are known to regulate mitochondrial-related genes that changed after bed rest.`,
          valueType: "quantitative",
          effectSummary:
            "A microRNA response was present but was not modified differently by the two exercise programs.",
          unit: "microRNAs",
          uncertainty:
            "Exploratory array analysis with small groups and no independent replication.",
        },
      ],
      confidence: "moderate",
      confidenceBasis:
        "One direct randomized bed-rest analog with clear methods and reported thresholds, but small groups, men only, transcriptome only, and no independent replication.",
      limitations: [
        "Exercise attenuated the response but did not completely prevent all molecular changes.",
        "No significant difference was reported between traditional and flywheel exercise.",
        "Gene-level thresholds used P < 0.05 without a reported multiple-testing correction.",
      ],
      applicability: APPLICABILITY,
    },
    {
      id: "osd-942-statement-mitochondrial-pathways",
      claim:
        "Enrichment analysis associated the bed-rest gene response with mitochondrial categories, including oxidative phosphorylation and the respiratory chain.",
      direction: "supports",
      observations: [
        {
          id: "osd-942-observation-enrichment",
          measurementId: "osd-942-measurement-gene-expression",
          statement: `Among the enriched terms, ${RESULTS.enrichment.mitochondrionGenes} genes mapped to mitochondrion, ${RESULTS.enrichment.oxidativePhosphorylationGenes} to oxidative phosphorylation, ${RESULTS.enrichment.electronTransportGenes} to electron transport, and ${RESULTS.enrichment.respiratoryChainGenes} to the respiratory chain.`,
          valueType: "quantitative",
          effectSummary:
            "Enrichment used an EASE score below 0.05 and a Benjamini FDR below 0.05.",
          unit: "annotated genes",
          uncertainty:
            "Functional annotation depends on database membership and on the selected gene list; it does not establish a mechanism or a clinical outcome.",
        },
      ],
      confidence: "moderate",
      confidenceBasis:
        "A direct study with pre-specified enrichment thresholds, but the enrichment is secondary to the gene-level analysis and has not been independently replicated.",
      limitations: [
        "Pathway enrichment is descriptive and does not establish causation.",
        "No protein or functional mitochondrial assay was performed.",
      ],
      applicability: APPLICABILITY,
    },
  ],
  confidence: "moderate",
  confidenceBasis:
    "One direct randomized bed-rest analog with clear methods, limited by small groups, men only, transcriptome-only measurement, and no replication.",
  limitations: [
    "Small randomized groups of 7, 7, and 8 healthy young men.",
    "Transcriptomic microarrays only; no protein, histology, or functional assays.",
    "A 70-day bed-rest analog may not reproduce spaceflight.",
    "Exercise attenuated but did not fully counteract the molecular response.",
    "This is not personal readiness, diagnostic, treatment, or prognostic evidence.",
  ],
  applicability: APPLICABILITY,
  license: {
    name: "Creative Commons CC0 1.0 Universal (dataset release)",
    url: "https://creativecommons.org/publicdomain/zero/1.0/legalcode",
    redistribution: "bundle-allowed",
    attribution:
      "Credit Cotter et al. (2024), NASA OSDR, and GeneLab; cite doi:10.1249/MSS.0000000000003457 and doi:10.26030/2ngb-7470.",
    note: "The dataset release is CC0-1.0. Astatine stores normalized metadata summaries and its own wording, not the article text, figures, or raw expression files.",
  },
  privacy: {
    status: "de-identified-public",
    containsHumanData: true,
    deidentified: true,
    lawfulBasis:
      "NASA OSDR public release of de-identified human research data under CC0-1.0, with study IRB approval and written informed consent reported by the authors.",
    note: "The ISA metadata and processed files contain sample accessions, age, sex, tissue, group, and timepoints, with no names or contact details. The publication reports IRB approval at NASA Johnson Space Center and the University of Texas Medical Branch.",
  },
  provenance: {
    datasetId: OSD_942_DATASET_ID,
    sourceVerifiedAt: ACCESSED_AT,
    verifiedBy: "Repository maintainer, role-level review",
    checksumVerified: true,
    reviewer: "Repository owner, approval of prepared record",
    reviewedAt: REVIEWED_AT,
    version: "1.0.0",
    supersedes: null,
    reReviewDueAt: NEXT_REVIEW,
  },
  modelTraining: "not-used",
  reviewStatus: "approved",
  lastReviewedAt: REVIEWED_AT,
  nextReviewDueAt: NEXT_REVIEW,
};
