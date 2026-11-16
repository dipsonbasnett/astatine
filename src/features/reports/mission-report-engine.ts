import { formatDate } from "@/lib/format";
import type {
  CheckInRecord,
  CountermeasureStatus,
  ReadinessBand,
  ReadinessFactorStatus,
} from "@/types/health";

import { MAX_FOCUS_ITEMS, buildMissionHealthBrief } from "@/features/brief/brief-engine";
import {
  buildCountermeasureCoach,
  buildCountermeasurePlan,
} from "@/features/countermeasures/countermeasure-engine";
import {
  READINESS_BAND_LABELS,
  READINESS_CONFIDENCE_LABELS,
  READINESS_ESCALATION,
  assessReadiness,
} from "@/features/readiness/readiness-engine";
import { buildVitalsSnapshot } from "@/features/vitals/vitals-engine";

export const REPORT_TITLE = "Astatine recorded mission-health review";
export const REPORT_FORMAT = "astatine.mission-report";
export const REPORT_VERSION = 1;
export const REPORT_WINDOW_OPTIONS = [7, 14] as const;

export type ReportWindowDays = (typeof REPORT_WINDOW_OPTIONS)[number];

export const REPORT_PRIVACY_NOTICE =
  "This report is composed and kept in this browser only. Astatine did not upload it. Downloading, printing, or saving a PDF creates a copy outside the application's control.";

export const REPORT_DISCLAIMER =
  "This is a non-clinical summary of recorded self-report. It is not a medical record, clinical assessment, diagnosis, prognosis, treatment recommendation, or fitness-for-duty determination. Astatine does not predict medical events and does not replace a medical professional or mission medical support channel.";

export const REPORT_SCOPE_NOTE =
  "Recorded data only. Every included value was entered by the crew or derived from those entries by the published rubric. Simulated demonstration and research context are excluded.";

export const REPORT_VITALS_NOTE =
  "Only recorded self-report trends are shown. Simulated demonstrations, synthetic monitor readings, and research context are excluded from this report.";

export const REPORT_PRIVATE_NOTES_NOTE =
  "Astatine stores no free-text notes in this build. Private-note inclusion stays off by default and never adds note content that does not exist.";

export const REPORT_LIMITS = [
  "Recorded only: this report contains crew-entered self-report and values derived from it by the published readiness rubric.",
  "Simulated demonstration and research context are excluded. No synthetic telemetry, simulated trend, synthetic vital, or external research claim is used.",
  "This is not a medical record, clinical assessment, diagnosis, prognosis, treatment recommendation, or fitness-for-duty determination.",
  "Astatine does not predict medical events and does not replace a medical professional or mission medical support channel.",
  "Astatine has no sensor input in this build. No value in this report is measured, and no device or wearable is connected.",
  "The readiness band is a fixed product rubric, not a validated clinical instrument.",
  "A downloaded, printed, or PDF copy leaves local storage. Astatine cannot delete copies outside the application.",
] as const;

export const REPORT_READINESS_STATUS_LABELS: Record<ReadinessFactorStatus, string> = {
  supports: "Supports",
  mixed: "Mixed",
  limits: "Limits",
  missing: "Missing",
};

export interface ReportSourceSummary {
  category: "recorded" | "simulated" | "research";
  label: string;
  status: "included" | "excluded";
  note: string;
}

export interface ReportValueLine {
  id: string;
  label: string;
  value: string;
  note?: string;
}

export interface ReportReadinessFactor {
  id: string;
  label: string;
  valueLabel: string;
  score: number | null;
  weight: number;
  affectsBand: boolean;
  status: ReadinessFactorStatus;
  statusLabel: string;
  sourceLabel: string;
  explanation: string;
  missingReason?: string;
}

export interface ReportReadiness {
  band: ReadinessBand;
  bandLabel: string;
  score: number | null;
  coverage: number;
  confidenceLabel: string;
  explanation: string;
  factors: ReportReadinessFactor[];
  missingData: string[];
}

export interface ReportAdherenceItem {
  id: string;
  title: string;
  status: CountermeasureStatus;
  statusLabel: string;
  currentStatus: string;
  suggestion: string;
  caution: string;
  missingData: string | null;
  sourceLabel: string;
}

export interface ReportFocusItem {
  id: string;
  title: string;
  rationale: string;
  caution: string;
  priority: "primary" | "supporting";
}

export interface ReportBrief {
  headline: string;
  checkInCount: number;
  latestObservedAt: string;
  observations: ReportValueLine[];
  missingData: string[];
  limits: string[];
}

export interface ReportVitalTrend {
  id: string;
  label: string;
  latestValue: number;
  latestObservedAt: string;
  unit: string;
  decimals: number;
  trendLabel: string;
  trendDetail: string;
  coverageText: string;
  sourceLabel: string;
  note: string;
}

export interface ReportPrivateNotes {
  included: boolean;
  items: string[];
  note: string;
}

export interface MissionReport {
  format: typeof REPORT_FORMAT;
  version: typeof REPORT_VERSION;
  id: string;
  title: string;
  generatedAt: string;
  windowDays: ReportWindowDays;
  periodStart: string;
  periodEnd: string;
  checkInCount: number;
  dataClasses: readonly ["recorded"];
  excludedDataClasses: readonly ["simulated", "research"];
  sourceSummary: ReportSourceSummary[];
  executiveSummary: string;
  readiness: ReportReadiness;
  adherence: {
    summary: string;
    basis: string;
    items: ReportAdherenceItem[];
    focus: ReportFocusItem[];
    focusNote: string;
  };
  brief: ReportBrief;
  vitals: {
    trends: ReportVitalTrend[];
    note: string;
  };
  dataGaps: string[];
  escalation: string[];
  limits: string[];
  privacyNotice: string;
  disclaimer: string;
  privateNotes: ReportPrivateNotes;
}

export interface BuildMissionReportOptions {
  checkIns: readonly CheckInRecord[];
  generatedAt: string;
  windowDays?: number;
  includePrivateNotes?: boolean;
}

const LIFESTYLE_VITAL_IDS = new Set([
  "sleepRecovery",
  "activity",
  "hydration",
  "nutrition",
]);
const DEVICE_VITAL_IDS = new Set(["heartRate", "spo2", "bloodPressure"]);

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values));
}

export function reportIdFor(generatedAt: string, windowDays: ReportWindowDays): string {
  const parsed = Date.parse(generatedAt);
  if (!Number.isFinite(parsed)) {
    throw new RangeError("Report generation time must be a valid timestamp.");
  }
  const stamp = new Date(parsed)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  return `AST-RPT-${stamp}-${windowDays}D`;
}

export function formatReportPeriod(
  windowDays: ReportWindowDays,
  periodStart: string,
  periodEnd: string,
): string {
  return `Last ${windowDays} days · ${formatDate(periodStart)} to ${formatDate(periodEnd)}`;
}

function reportWindow(value: number | undefined): ReportWindowDays {
  return value === 14 ? 14 : 7;
}

export function buildMissionReport({
  checkIns,
  generatedAt,
  windowDays,
  includePrivateNotes = false,
}: BuildMissionReportOptions): MissionReport | null {
  const generatedMs = Date.parse(generatedAt);
  if (!Number.isFinite(generatedMs)) {
    throw new RangeError("Report generation time must be a valid timestamp.");
  }

  const days = reportWindow(windowDays);
  const now = new Date(generatedMs);
  const assessment = assessReadiness({ checkIns, now, windowDays: days });
  if (!assessment) return null;

  const countermeasures = buildCountermeasurePlan(assessment);
  const coach = buildCountermeasureCoach(assessment);
  const brief = buildMissionHealthBrief({
    checkIns,
    generatedAt,
    windowDays: days,
  });
  if (!brief) return null;

  const vitals = buildVitalsSnapshot({ checkIns, now, windowDays: days });
  if (!vitals) {
    throw new RangeError("Report generation time must be a valid timestamp.");
  }

  const trends: ReportVitalTrend[] = vitals.views
    .filter((view) => LIFESTYLE_VITAL_IDS.has(view.id) && view.recorded.latest !== null)
    .map((view) => {
      const latest = view.recorded.latest;
      if (!latest) {
        throw new Error("A recorded vital trend was missing its latest value.");
      }
      return {
        id: view.id,
        label: view.label,
        latestValue: latest.value,
        latestObservedAt: latest.observedAt,
        unit: view.unit,
        decimals: view.decimals,
        trendLabel: view.recorded.trendLabel,
        trendDetail: view.recorded.trendDetail,
        coverageText: view.recorded.coverageText,
        sourceLabel: "Recorded · check-in self-report",
        note: view.recorded.note,
      };
    });

  const dataGaps = unique([
    ...assessment.missingData,
    ...brief.missingData,
    ...vitals.views
      .filter((view) => LIFESTYLE_VITAL_IDS.has(view.id))
      .flatMap((view) => view.recorded.missing),
    ...(trends.length === 0
      ? [
          "No recorded sleep, exercise, hydration, or nutrition trend can be described for this period.",
        ]
      : []),
    ...(vitals.views.every(
      (view) => !DEVICE_VITAL_IDS.has(view.id) || !view.recorded.available,
    )
      ? [
          "Heart rate, oxygen saturation, and blood-pressure-style values are not recorded by this build and no simulated values are included.",
        ]
      : []),
    "No free-text private notes are stored in this build.",
  ]);

  const limits = unique([
    ...REPORT_LIMITS,
    ...assessment.caveats,
    ...countermeasures.caveats,
    ...brief.limits,
  ]);

  const privateNotes: ReportPrivateNotes = {
    included: includePrivateNotes,
    items: [],
    note: includePrivateNotes
      ? "Private notes were included by explicit consent. This build stores no free-text notes, so there is no note content for the selected period."
      : REPORT_PRIVATE_NOTES_NOTE,
  };

  const bandLabel = READINESS_BAND_LABELS[assessment.band];
  const scoreText =
    assessment.averageScore === null
      ? "with no weighted score because the recorded inputs are insufficient"
      : `with a weighted recorded score of ${assessment.averageScore} of 100`;
  const count = assessment.inputs.checkInsInWindow;

  return {
    format: REPORT_FORMAT,
    version: REPORT_VERSION,
    id: reportIdFor(generatedAt, days),
    title: REPORT_TITLE,
    generatedAt,
    windowDays: days,
    periodStart: new Date(generatedMs - days * 24 * 3_600_000).toISOString(),
    periodEnd: generatedAt,
    checkInCount: count,
    dataClasses: ["recorded"],
    excludedDataClasses: ["simulated", "research"],
    sourceSummary: [
      {
        category: "recorded",
        label: "Recorded",
        status: "included",
        note: "Crew-entered check-ins and values derived by the published readiness rubric.",
      },
      {
        category: "simulated",
        label: "Simulated demonstration",
        status: "excluded",
        note: "No synthetic telemetry, simulated recovery trend, or synthetic vital is included.",
      },
      {
        category: "research",
        label: "Research context",
        status: "excluded",
        note: "No external research context, citation, or population claim is included.",
      },
    ],
    executiveSummary: `${count} recorded check-in${count === 1 ? "" : "s"} are included in this ${days}-day review. The fixed rubric places the window in the ${bandLabel.toLowerCase()} band ${scoreText}. ${assessment.coverage}% of rubric inputs have recorded data, and ${dataGaps.length} data gap${dataGaps.length === 1 ? "" : "s"} remain visible. All included content is recorded self-report; simulated demonstration and research context are excluded.`,
    readiness: {
      band: assessment.band,
      bandLabel,
      score: assessment.averageScore,
      coverage: assessment.coverage,
      confidenceLabel: READINESS_CONFIDENCE_LABELS[assessment.confidence.level],
      explanation: assessment.explanation,
      factors: assessment.factors.map((factor) => ({
        id: factor.id,
        label: factor.label,
        valueLabel: factor.valueLabel,
        score: factor.score,
        weight: factor.weight,
        affectsBand: factor.affectsBand,
        status: factor.status,
        statusLabel: REPORT_READINESS_STATUS_LABELS[factor.status],
        sourceLabel: factor.sourceLabel,
        explanation: factor.explanation,
        ...(factor.missingReason ? { missingReason: factor.missingReason } : {}),
      })),
      missingData: [...assessment.missingData],
    },
    adherence: {
      summary: coach.summary,
      basis: countermeasures.basis,
      items: coach.items.map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        statusLabel: item.statusLabel,
        currentStatus: item.currentStatus,
        suggestion: item.suggestion,
        caution: item.caution,
        missingData: item.missingData,
        sourceLabel: "Recorded · fixed rubric",
      })),
      focus: countermeasures.suggestions.slice(0, MAX_FOCUS_ITEMS).map((item) => ({
        id: item.id,
        title: item.title,
        rationale: item.rationale,
        caution: item.caution,
        priority: item.priority,
      })),
      focusNote:
        "Routine suggestions from the fixed readiness rubric. Not treatment and not an instruction to change operational duties.",
    },
    brief: {
      headline: brief.headline,
      checkInCount: brief.checkInCount,
      latestObservedAt: brief.latestObservedAt,
      observations: brief.observations.map((line) => ({
        id: line.id,
        label: line.label,
        value: line.value,
      })),
      missingData: [...brief.missingData],
      limits: [...brief.limits],
    },
    vitals: {
      trends,
      note: REPORT_VITALS_NOTE,
    },
    dataGaps,
    escalation: [...READINESS_ESCALATION],
    limits,
    privacyNotice: REPORT_PRIVACY_NOTICE,
    disclaimer: REPORT_DISCLAIMER,
    privateNotes,
  };
}
