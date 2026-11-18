import type { CoachDomain, CoachResearchContext } from "@/types/health";

export const COACH_RESEARCH_ACCESSED_AT = "2026-11-16";

const NASA_HRP_URL = "https://www.nasa.gov/hrp/";

const HRP_LIMITATIONS =
  "Program overview only. It does not evaluate this crew member, provide individualized guidance, or constitute a clinical standard. Astatine links to it as context and does not copy its content into the app.";

const RESEARCH: Partial<Record<CoachDomain, CoachResearchContext>> = {
  sleep: {
    id: "nasa-hrp-sleep",
    title: "NASA Human Research Program",
    publisher: "NASA",
    url: NASA_HRP_URL,
    accessedAt: COACH_RESEARCH_ACCESSED_AT,
    claim:
      "NASA's Human Research Program describes sleep and circadian adaptation as areas of human spaceflight research.",
    limitations: HRP_LIMITATIONS,
  },
  exercise: {
    id: "nasa-hrp-exercise",
    title: "NASA Human Research Program",
    publisher: "NASA",
    url: NASA_HRP_URL,
    accessedAt: COACH_RESEARCH_ACCESSED_AT,
    claim:
      "NASA's Human Research Program describes exercise and physical performance as areas of human spaceflight research.",
    limitations: HRP_LIMITATIONS,
  },
};

export const COACH_RESEARCH_NOTE =
  "Research context appears only where a verified public NASA program page is linked. These links are general program overviews, not clinical guidance, and they do not evaluate this crew or this app's rubric.";

export function researchForCoachDomain(domain: CoachDomain): CoachResearchContext | null {
  return RESEARCH[domain] ?? null;
}
