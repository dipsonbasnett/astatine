import type { MissionPhaseDefinition, MissionPlan } from "@/types/health";

export const SIMULATED_MISSION_ID = "astatine-demo-mission";
export const SIMULATED_MISSION_NAME = "Astatine demonstration mission";

export const SIMULATED_MISSION_PHASES: readonly MissionPhaseDefinition[] = [
  {
    id: "systems-check",
    label: "Systems check",
    durationMinutes: 45,
    summary: "Simulated crew review of mission systems before the first science block.",
  },
  {
    id: "science-block",
    label: "Science block",
    durationMinutes: 90,
    summary: "Simulated instrument session. The monitor shows synthetic values only.",
  },
  {
    id: "meal-rest",
    label: "Meal and rest",
    durationMinutes: 60,
    summary: "Simulated scheduled break with no operational tasking.",
  },
  {
    id: "maintenance",
    label: "Maintenance",
    durationMinutes: 75,
    summary:
      "Simulated maintenance window with a slightly higher synthetic activity level.",
  },
  {
    id: "crew-conference",
    label: "Crew conference",
    durationMinutes: 30,
    summary: "Simulated end-of-day crew sync and handover notes.",
  },
];

export const MISSION_MONITOR_SCENARIO_BY_PHASE: Readonly<Record<string, string>> = {
  "systems-check": "steady-orbit",
  "science-block": "steady-orbit",
  "meal-rest": "rest-window",
  maintenance: "light-activity",
  "crew-conference": "steady-orbit",
};

export function createSimulatedMission(startAt: Date): MissionPlan {
  return {
    id: SIMULATED_MISSION_ID,
    name: SIMULATED_MISSION_NAME,
    startAt: startAt.toISOString(),
    label: "simulated",
    phases: SIMULATED_MISSION_PHASES.map((phase) => ({ ...phase })),
  };
}
