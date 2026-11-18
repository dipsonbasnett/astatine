import { checkInField } from "@/features/checkin/checkin-engine";
import { buildCountermeasurePlan } from "@/features/countermeasures/countermeasure-engine";
import {
  READINESS_BAND_LABELS,
  assessReadiness,
} from "@/features/readiness/readiness-engine";
import type {
  CheckInRecord,
  CheckInScaleField,
  CountermeasurePlan,
  ReadinessAssessment,
} from "@/types/health";

export const BRIEF_TITLE = "Astatine mission health brief";
export const BRIEF_WINDOW_DAYS = 7;

export const BRIEF_SCOPE_NOTE =
  "Composed at display time from recorded self-report in this browser. Nothing is stored, uploaded, or sent. Simulated telemetry and research context are excluded.";

export const BRIEF_LIMITS = [
  "This is a self-report briefing, not a medical record, clinical assessment, or fitness-for-duty determination.",
  "Astatine does not diagnose, predict medical events, or recommend treatment.",
  "The brief describes recorded check-ins only. It says nothing about the mission, the crew, or operational status.",
  "Astatine has no sensor input in this build, so no value here is measured.",
] as const;

const OBSERVATION_FIELDS: readonly CheckInScaleField[] = [
  "sleepQuality",
  "fatigue",
  "mood",
  "soreness",
  "stress",
  "hydration",
];

export const MAX_FOCUS_ITEMS = 3;

export interface BriefLine {
  id: string;
  label: string;
  value: string;
  note?: string;
  weight?: number;
}

export interface MissionHealthBrief {
  generatedAt: string;
  windowDays: number;
  checkInCount: number;
  latestObservedAt: string;
  headline: string;
  readiness: ReadinessAssessment;
  countermeasures: CountermeasurePlan;
  scoredFactors: BriefLine[];
  contextFactors: BriefLine[];
  observations: BriefLine[];
  missingData: string[];
  limits: readonly string[];
  dataClasses: readonly ["recorded"];
}

export interface BuildBriefOptions {
  checkIns: readonly CheckInRecord[];
  generatedAt: string;
  windowDays?: number;
}

function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
}

function formatWeight(weight: number | undefined): string {
  if (!weight) return "";
  return ` · weight ${Math.round(weight * 100)}%`;
}

function scaleLabel(field: CheckInScaleField, value: number): string {
  return (
    checkInField(field)?.options.find((option) => option.value === value)?.label ??
    `${value} of 5`
  );
}

function factorLine(factor: ReadinessAssessment["factors"][number]): BriefLine {
  return {
    id: factor.id,
    label: factor.label,
    value: factor.score === null ? "Not enough data" : `${factor.score}/100`,
    note: factor.valueLabel,
    weight: factor.weight,
  };
}

function observationLines(record: CheckInRecord | undefined): BriefLine[] {
  if (!record) return [];

  return [
    {
      id: "sleepHours",
      label: "Sleep duration",
      value: `${formatHours(record.sleepHours)} h`,
    },
    ...OBSERVATION_FIELDS.map((field) => ({
      id: field,
      label: checkInField(field)?.label ?? field,
      value: scaleLabel(field, record[field]),
    })),
  ];
}

export function buildMissionHealthBrief({
  checkIns,
  generatedAt,
  windowDays = BRIEF_WINDOW_DAYS,
}: BuildBriefOptions): MissionHealthBrief | null {
  if (!Number.isFinite(Date.parse(generatedAt))) {
    throw new RangeError("Brief generation time must be a valid timestamp.");
  }

  const days = windowDays === 14 ? 14 : 7;
  const readiness = assessReadiness({
    checkIns,
    now: new Date(generatedAt),
    windowDays: days,
  });
  if (!readiness) return null;

  const countermeasures = buildCountermeasurePlan(readiness);
  const latest = checkIns.find((record) => record.id === readiness.inputs.checkInId);
  const bandLabel = READINESS_BAND_LABELS[readiness.band];
  const count = readiness.inputs.checkInsInWindow;

  return {
    generatedAt,
    windowDays: days,
    checkInCount: count,
    latestObservedAt: readiness.inputs.observedAt,
    headline: `${count} recorded check-in${count === 1 ? "" : "s"} in the last ${days} days. The fixed rubric places this window in the ${bandLabel.toLowerCase()} band for recorded recovery readiness.`,
    readiness,
    countermeasures,
    scoredFactors: readiness.factors
      .filter((factor) => factor.affectsBand)
      .map(factorLine),
    contextFactors: readiness.factors
      .filter((factor) => !factor.affectsBand)
      .map(factorLine),
    observations: observationLines(latest),
    missingData: [...readiness.missingData],
    limits: [...BRIEF_LIMITS],
    dataClasses: ["recorded"],
  };
}

export function briefToPlainText(brief: MissionHealthBrief): string {
  const lines: string[] = [
    BRIEF_TITLE,
    `Generated ${brief.generatedAt}`,
    `Window: last ${brief.windowDays} days · ${brief.checkInCount} recorded check-in${brief.checkInCount === 1 ? "" : "s"}`,
    BRIEF_SCOPE_NOTE,
    "",
    `Band: ${READINESS_BAND_LABELS[brief.readiness.band]}`,
    brief.headline,
    brief.readiness.explanation,
    "",
    "Scored factors",
    ...brief.scoredFactors.map((line) =>
      line.note
        ? `- ${line.label}: ${line.value} (${line.note})${formatWeight(line.weight)}`
        : `- ${line.label}: ${line.value}${formatWeight(line.weight)}`,
    ),
    "",
    "Context factors",
    ...brief.contextFactors.map((line) =>
      line.note
        ? `- ${line.label}: ${line.value} (${line.note})`
        : `- ${line.label}: ${line.value}`,
    ),
    "",
    `Latest self-report (${brief.latestObservedAt})`,
    ...brief.observations.map((line) => `- ${line.label}: ${line.value}`),
    "",
    "Suggested focus",
    ...brief.countermeasures.suggestions
      .slice(0, MAX_FOCUS_ITEMS)
      .map((suggestion) => `- ${suggestion.title}: ${suggestion.rationale}`),
    "",
    "Missing data",
    ...(brief.missingData.length > 0
      ? brief.missingData.map((entry) => `- ${entry}`)
      : ["- No gaps were recorded for this window."]),
    "",
    "What this brief is not",
    ...brief.limits.map((limit) => `- ${limit}`),
  ];

  return lines.join("\n");
}
