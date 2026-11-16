export const OSD_942_REPORTED_RESULTS = {
  genesAltered: 2113,
  interactionGenes: 511,
  downregulatedInBedRestOnly: 489,
  upregulatedInBedRestOnly: 92,
  microRnasAltered: 35,
  microRnasLinkedToMitochondrialGenes: 12,
  geneEntitiesTested: 18854,
  geneEntitiesOnArray: 58341,
  microRnaEntitiesTested: 345,
  microRnaEntitiesOnArray: 2570,
  thresholds: {
    foldChange: 1.2,
    pValue: 0.05,
    enrichmentFdr: 0.05,
  },
  enrichment: {
    mitochondrionGenes: 78,
    oxidativePhosphorylationGenes: 17,
    electronTransportGenes: 15,
    respiratoryChainGenes: 11,
  },
  citation:
    "Cotter JA, Plaza-Florido A, Adams GR, Haddad F, Scott JM, Everett M, Ploutz-Snyder L, Radom-Aizik S. Exercise Training Attenuates the Muscle Mitochondria Genomic Response to Bed Rest. Med Sci Sports Exerc. 2024;56(9):1615-1622. doi:10.1249/MSS.0000000000003457.",
  note: "Values are transcribed from the peer-reviewed publication and its Table 1. They are not recomputed from the processed arrays in Astatine.",
} as const;
