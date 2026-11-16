export const DATA_CATEGORIES = [
  {
    id: "recorded",
    label: "Recorded",
    summary:
      "Entered by a crew member and kept in this browser by default. Never uploaded automatically.",
  },
  {
    id: "simulated",
    label: "Simulated",
    summary:
      "Clearly labeled demonstration content. Never mixed with recorded data or presented as personal data.",
  },
  {
    id: "research",
    label: "Research",
    summary:
      "Open, cited context with verified provenance. Never presented as a crew member's personal data.",
  },
] as const;

export type DataCategory = (typeof DATA_CATEGORIES)[number]["id"];

const DATA_CATEGORY_LABELS: Record<DataCategory, string> = {
  recorded: "Recorded",
  simulated: "Simulated",
  research: "Research",
};

export function dataCategoryLabel(category: DataCategory): string {
  return DATA_CATEGORY_LABELS[category];
}
