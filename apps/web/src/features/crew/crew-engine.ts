import {
  READINESS_BAND_LABELS,
  READINESS_CONFIDENCE_LABELS,
  assessReadiness,
} from "@/features/readiness/readiness-engine";
import type {
  CheckInRecord,
  CrewAttentionItem,
  CrewDataGap,
  CrewMetric,
  CrewMetricId,
  CrewReadinessSnapshot,
} from "@/types/health";

const HOUR_MS = 3_600_000;

export const CREW_DISPLAY_NAME_FALLBACK = "Local crew profile";

export const CREW_ROSTER_NOTE =
  "This build stores one local profile and has no crew roster, accounts, synchronization, or member-level attribution. The overview describes recorded check-ins on this device, not multiple teammates.";

export const CREW_PRIVACY_NOTE =
  "Only pooled, non-sensitive aggregates are shown. No free-text notes are stored, and individual ratings, per-entry values, and private self-report details are not displayed.";

export const CREW_SCOPE_NOTE =
  "Every metric here is recorded. Simulated telemetry, the simulated recovery trend, and research context are excluded from all crew values.";

export const CREW_ALERT_RULES = [
  "A workload and fatigue review item appears only when at least two check-ins record both scales and both averages are 4.0 of 5 or higher.",
  "A trend label compares the earliest and latest recorded value in the window. A change smaller than 0.5 points is described as steady.",
  "Data gaps are coverage facts. They never trigger a medical interpretation, a notification, or an estimated value.",
  "No alert is sent to anyone, and nothing is monitored or evaluated in real time.",
] as const;

export const CREW_CAVEATS = [
  "This overview summarizes recorded self-report on one local browser profile. It is not a roster, an operational status board, or a medical record.",
  "It does not diagnose, predict medical events, monitor anyone, rank crew members, or determine fitness for duty.",
  "It creates no team score. Every value is a count, a descriptive statistic, or a published rubric band with its source.",
  "Missing data stays missing. Simulated telemetry, the simulated recovery trend, and research context never fill a crew metric.",
] as const;

export const CREW_METRIC_STATUS_LABELS = {
  available: "Available",
  partial: "Partial data",
  missing: "Missing data",
} as const;

export interface BuildCrewReadinessOptions {
  checkIns: readonly CheckInRecord[];
  displayName?: string;
  now?: Date;
  windowDays?: number;
}

function round(value: number, precision = 0): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function isFiniteNumberValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function dayKey(observedAt: string): string {
  return new Date(Date.parse(observedAt)).toISOString().slice(0, 10);
}

function countRecordedDays(records: readonly CheckInRecord[]): number {
  return new Set(records.map((record) => dayKey(record.observedAt))).size;
}

function usableWindowDays(value: number | undefined): 7 | 14 {
  return value === 14 ? 14 : 7;
}

function checkInCompletionMetric(
  records: readonly CheckInRecord[],
  days: 7 | 14,
  recordedDays: number,
): CrewMetric {
  return {
    id: "checkInCompletion",
    label: "Check-in completion",
    category: "recorded",
    sourceLabel: "Recorded · check-in dates",
    status: recordedDays < days ? "partial" : "available",
    headline: `${recordedDays} of ${days} days`,
    detail: `${records.length} recorded check-in${records.length === 1 ? "" : "s"} cover ${recordedDays} recorded day${recordedDays === 1 ? "" : "s"} in the window. A day counts when at least one check-in has an observation on that UTC date. This describes logging coverage, not recovery.`,
  };
}

function sleepVariationMetric(records: readonly CheckInRecord[]): CrewMetric {
  const values = records.map((record) => record.sleepHours).filter(isFiniteNumberValue);

  if (values.length < 3) {
    return {
      id: "sleepVariation",
      label: "Sleep regularity",
      category: "recorded",
      sourceLabel: "Recorded · derived from sleep durations",
      status: "missing",
      headline: "Needs at least three check-ins",
      detail: `${values.length} recorded sleep duration${values.length === 1 ? "" : "s"} in the window cannot describe variation. Sleep regularity is not estimated from fewer than three check-ins.`,
    };
  }

  const average = mean(values);
  const variance =
    values.reduce((total, value) => total + (value - average) ** 2, 0) / values.length;
  const deviation = round(Math.sqrt(variance), 2);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);

  return {
    id: "sleepVariation",
    label: "Sleep regularity",
    category: "recorded",
    sourceLabel: "Recorded · derived from sleep durations",
    status: "available",
    headline: `±${deviation} h variation`,
    detail: `Recorded sleep duration ranged from ${minimum} to ${maximum} h across ${values.length} check-ins, with an average of ${round(average, 2)} h. This describes recorded duration only, not sleep quality or a sleep assessment.`,
  };
}

function exerciseAdherenceMetric(
  records: readonly CheckInRecord[],
  days: 7 | 14,
): CrewMetric {
  const paired = records.flatMap((record) =>
    isFiniteNumberValue(record.exercisePlannedMinutes) &&
    isFiniteNumberValue(record.exerciseCompletedMinutes)
      ? [
          {
            planned: record.exercisePlannedMinutes,
            completed: record.exerciseCompletedMinutes,
          },
        ]
      : [],
  );

  if (paired.length === 0) {
    const hasAnyExercise = records.some(
      (record) =>
        isFiniteNumberValue(record.exercisePlannedMinutes) ||
        isFiniteNumberValue(record.exerciseCompletedMinutes),
    );
    return {
      id: "exerciseAdherence",
      label: "Exercise adherence",
      category: "recorded",
      sourceLabel: "Recorded · paired exercise entries",
      status: "missing",
      headline: "No paired exercise entries",
      detail: hasAnyExercise
        ? "Planned and completed exercise minutes were not recorded together, so adherence cannot be described. The values are not combined or estimated."
        : "No planned or completed exercise minutes were recorded in this window. Adherence is left missing rather than estimated.",
    };
  }

  const plannedTotal = paired.reduce((total, entry) => total + entry.planned, 0);
  const completedTotal = paired.reduce((total, entry) => total + entry.completed, 0);

  if (plannedTotal === 0) {
    return {
      id: "exerciseAdherence",
      label: "Exercise adherence",
      category: "recorded",
      sourceLabel: "Recorded · paired exercise entries",
      status: "partial",
      headline:
        completedTotal === 0
          ? "No planned minutes"
          : `${completedTotal} min completed · no plan`,
      detail:
        completedTotal === 0
          ? "Zero planned and zero completed minutes were recorded, so an adherence ratio would describe nothing. Recorded minutes are not converted into a score."
          : `${completedTotal} completed minutes were recorded without planned minutes, so adherence has no denominator. The completed time is shown as recorded and is not converted into a score.`,
    };
  }

  const percentage = round((completedTotal / plannedTotal) * 100);

  return {
    id: "exerciseAdherence",
    label: "Exercise adherence",
    category: "recorded",
    sourceLabel: "Recorded · paired exercise entries",
    status: paired.length < days ? "partial" : "available",
    headline: `${percentage}% of planned minutes`,
    detail: `${completedTotal} completed minutes are compared with ${plannedTotal} planned minutes across ${paired.length} paired day${paired.length === 1 ? "" : "s"}. This is a logging and adherence view, not an exercise prescription.`,
  };
}

function loggingMetric(
  id: "hydrationLogging" | "nutritionLogging",
  records: readonly CheckInRecord[],
  days: 7 | 14,
): CrewMetric {
  const isHydration = id === "hydrationLogging";
  const entries = records.flatMap((record) => {
    const value = isHydration ? record.hydrationEntries : record.nutritionEntries;
    return isFiniteNumberValue(value) ? [{ value, observedAt: record.observedAt }] : [];
  });

  if (entries.length === 0) {
    return {
      id,
      label: isHydration ? "Hydration logging" : "Nutrition logging",
      category: "recorded",
      sourceLabel: `Recorded · ${isHydration ? "fluid" : "nutrition"} entry counts`,
      status: "missing",
      headline: "No entries recorded",
      detail: `No ${isHydration ? "fluid" : "nutrition"} entry counts were recorded in this window. Logging is left missing and is not estimated.`,
    };
  }

  const loggedDays = new Set(entries.map((entry) => dayKey(entry.observedAt))).size;
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);

  return {
    id,
    label: isHydration ? "Hydration logging" : "Nutrition logging",
    category: "recorded",
    sourceLabel: `Recorded · ${isHydration ? "fluid" : "nutrition"} entry counts`,
    status: loggedDays < days ? "partial" : "available",
    headline: `${loggedDays} of ${days} days logged`,
    detail: `${total} ${isHydration ? "fluid" : "nutrition"} entr${total === 1 ? "y was" : "ies were"} recorded across ${loggedDays} day${loggedDays === 1 ? "" : "s"}. This describes logging frequency only, not ${isHydration ? "hydration status or intake" : "nutritional adequacy or intake"}.`,
  };
}

function trendSentence(label: "Fatigue" | "Workload", values: readonly number[]): string {
  const first = values[0];
  const latest = values[values.length - 1];

  if (values.length < 2 || first === undefined || latest === undefined) {
    return `A ${label.toLowerCase()} trend needs at least two recorded values and is not inferred.`;
  }

  const delta = round(latest - first, 2);
  if (Math.abs(delta) < 0.5) {
    return `${label} self-report was broadly steady between the earliest and latest recorded check-in (${round(first, 1)}/5 to ${round(latest, 1)}/5).`;
  }

  return `${label} self-report was ${delta > 0 ? "higher" : "lower"} at the latest recorded check-in than at the earliest (${round(first, 1)}/5 to ${round(latest, 1)}/5).`;
}

function workloadFatigueMetric(records: readonly CheckInRecord[]): CrewMetric {
  const fatigueValues = records.map((record) => record.fatigue);
  const workloadValues = records.flatMap((record) =>
    isFiniteNumberValue(record.workload) ? [record.workload] : [],
  );

  const fatigueAverage = round(mean(fatigueValues), 1);
  const workloadAverage =
    workloadValues.length > 0 ? round(mean(workloadValues), 1) : null;

  const detailParts = [
    `Fatigue averaged ${fatigueAverage}/5 across ${fatigueValues.length} check-in${fatigueValues.length === 1 ? "" : "s"}.`,
    workloadAverage === null
      ? "Workload was not recorded in this window and is not estimated."
      : `Workload averaged ${workloadAverage}/5 across ${workloadValues.length} check-in${workloadValues.length === 1 ? "" : "s"}.`,
    trendSentence("Fatigue", fatigueValues),
    trendSentence("Workload", workloadValues),
    "These are self-reported scales, not clinical severity ratings.",
  ];

  return {
    id: "workloadFatigue",
    label: "Workload and fatigue",
    category: "recorded",
    sourceLabel: "Recorded · self-report scales",
    status: workloadValues.length === records.length ? "available" : "partial",
    headline:
      workloadAverage === null
        ? `Fatigue ${fatigueAverage}/5 · workload not recorded`
        : `Fatigue ${fatigueAverage}/5 · workload ${workloadAverage}/5`,
    detail: detailParts.join(" "),
  };
}

function readinessMetric(
  records: readonly CheckInRecord[],
  now: Date,
  days: 7 | 14,
): CrewMetric {
  const assessment = assessReadiness({ checkIns: records, now, windowDays: days });

  if (!assessment) {
    return {
      id: "readinessBand",
      label: "Recovery readiness band",
      category: "recorded",
      sourceLabel: "Recorded · fixed readiness rubric",
      status: "missing",
      headline: "No readiness band",
      detail:
        "A readiness band needs a recorded check-in in this window. No band is estimated.",
    };
  }

  const bandLabel = READINESS_BAND_LABELS[assessment.band];

  return {
    id: "readinessBand",
    label: "Recovery readiness band",
    category: "recorded",
    sourceLabel: "Recorded · fixed readiness rubric",
    status: assessment.band === "insufficient" ? "partial" : "available",
    headline: bandLabel,
    detail: `The recorded-only rubric places this window in the ${bandLabel.toLowerCase()} band with ${READINESS_CONFIDENCE_LABELS[assessment.confidence.level].toLowerCase()} confidence and ${assessment.coverage}% of rubric inputs available across ${assessment.inputs.checkInsInWindow} check-in${assessment.inputs.checkInsInWindow === 1 ? "" : "s"}. Bands are not averaged across people and are not fitness-for-duty findings.`,
  };
}

function dataGap(
  id: string,
  label: string,
  detail: string,
  sourceLabel = "Recorded · coverage check",
): CrewDataGap {
  return { id, label, detail, category: "recorded", sourceLabel };
}

function buildDataGaps(options: {
  records: readonly CheckInRecord[];
  days: 7 | 14;
  recordedDays: number;
  latestAgeHours: number;
  metrics: readonly CrewMetric[];
  workloadValues: readonly number[];
}): CrewDataGap[] {
  const { records, days, recordedDays, latestAgeHours, metrics, workloadValues } =
    options;
  const gaps: CrewDataGap[] = [];
  const metric = (id: CrewMetricId) => metrics.find((entry) => entry.id === id);

  if (latestAgeHours > 48) {
    gaps.push(
      dataGap(
        "stale-context",
        "Latest check-in is older than 48 hours",
        `The latest recorded check-in in this window is ${latestAgeHours} h old. Crew values are not refreshed from any other source.`,
      ),
    );
  }

  if (recordedDays < days) {
    gaps.push(
      dataGap(
        "recording-coverage",
        `Recorded days cover ${recordedDays} of ${days}`,
        "Days without a check-in stay missing. No crew value is estimated or carried forward.",
      ),
    );
  }

  const sleep = metric("sleepVariation");
  if (sleep?.status === "missing") {
    gaps.push(dataGap("sleep-variation", sleep.headline, sleep.detail));
  }

  const exercise = metric("exerciseAdherence");
  if (exercise && exercise.status !== "available") {
    gaps.push(
      dataGap(
        "exercise",
        exercise.status === "missing"
          ? "Exercise adherence is not available"
          : "Exercise adherence covers part of the window",
        exercise.detail,
      ),
    );
  }

  for (const [id, label] of [
    ["hydrationLogging", "Hydration logging"],
    ["nutritionLogging", "Nutrition logging"],
  ] as const) {
    const entry = metric(id);
    if (entry && entry.status !== "available") {
      gaps.push(
        dataGap(
          id === "hydrationLogging" ? "hydration" : "nutrition",
          entry.status === "missing"
            ? `${label} is missing`
            : `${label} covers part of the window`,
          entry.detail,
        ),
      );
    }
  }

  if (workloadValues.length === 0) {
    gaps.push(
      dataGap(
        "workload",
        "Workload self-report is missing",
        "Workload was not recorded on any check-in in this window. It is not estimated, and fatigue is reported on its own.",
      ),
    );
  } else if (workloadValues.length < records.length) {
    gaps.push(
      dataGap(
        "workload",
        "Workload self-report is partial",
        `Workload was recorded on ${workloadValues.length} of ${records.length} check-ins. Missing workload values are not estimated.`,
      ),
    );
  }

  const readiness = metric("readinessBand");
  if (readiness?.status === "partial") {
    gaps.push(dataGap("readiness", readiness.headline, readiness.detail));
  }

  return gaps;
}

function buildAttentionItems(records: readonly CheckInRecord[]): CrewAttentionItem[] {
  const paired = records.flatMap((record) =>
    isFiniteNumberValue(record.workload)
      ? [{ fatigue: record.fatigue, workload: record.workload }]
      : [],
  );

  if (paired.length < 2) return [];

  const fatigueAverage = round(mean(paired.map((entry) => entry.fatigue)), 1);
  const workloadAverage = round(mean(paired.map((entry) => entry.workload)), 1);

  if (fatigueAverage < 4 || workloadAverage < 4) return [];

  return [
    {
      id: "workload-fatigue-review",
      title: "Workload and fatigue self-report is in the upper range",
      detail: `Fatigue averaged ${fatigueAverage}/5 and workload averaged ${workloadAverage}/5 across the same recorded check-ins. Where operations allow, consider reviewing optional demand and recording a follow-up check-in. This is a local review prompt, not a medical alert, urgency rating, or fitness-for-duty finding.`,
      basis: `${paired.length} check-ins recorded both workload and fatigue in the selected window.`,
      category: "recorded",
      sourceLabel: "Recorded · local rule",
    },
  ];
}

export function buildCrewReadinessSnapshot({
  checkIns,
  displayName = "",
  now = new Date(),
  windowDays = 7,
}: BuildCrewReadinessOptions): CrewReadinessSnapshot | null {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) return null;

  const days = usableWindowDays(windowDays);
  const windowHours = days * 24;

  const inWindow = checkIns
    .filter((record) => Number.isFinite(Date.parse(record.observedAt)))
    .filter((record) => {
      const observedMs = Date.parse(record.observedAt);
      return observedMs <= nowMs && nowMs - observedMs <= windowHours * HOUR_MS;
    })
    .sort((left, right) => Date.parse(left.observedAt) - Date.parse(right.observedAt));

  const latest = inWindow[inWindow.length - 1];
  if (!latest) return null;

  const recordedDays = countRecordedDays(inWindow);
  const latestAgeHours = Math.max(
    0,
    round((nowMs - Date.parse(latest.observedAt)) / HOUR_MS, 1),
  );
  const workloadValues = inWindow.flatMap((record) =>
    isFiniteNumberValue(record.workload) ? [record.workload] : [],
  );

  const metrics: CrewMetric[] = [
    checkInCompletionMetric(inWindow, days, recordedDays),
    sleepVariationMetric(inWindow),
    exerciseAdherenceMetric(inWindow, days),
    loggingMetric("hydrationLogging", inWindow, days),
    loggingMetric("nutritionLogging", inWindow, days),
    workloadFatigueMetric(inWindow),
    readinessMetric(inWindow, now, days),
  ];

  const member = {
    id: "local" as const,
    displayName: displayName.trim() || CREW_DISPLAY_NAME_FALLBACK,
    profileLabel: "Local profile · this browser only",
    category: "recorded" as const,
    windowDays: days,
    checkInCount: inWindow.length,
    recordedDays,
    coveragePercent: Math.round((recordedDays / days) * 100),
    latestObservedAt: latest.observedAt,
    latestAgeHours,
  };

  return {
    generatedAt: new Date(nowMs).toISOString(),
    windowDays: days,
    member,
    metrics,
    dataGaps: buildDataGaps({
      records: inWindow,
      days,
      recordedDays,
      latestAgeHours,
      metrics,
      workloadValues,
    }),
    attentionItems: buildAttentionItems(inWindow),
    alertRules: [...CREW_ALERT_RULES],
    caveats: [...CREW_CAVEATS],
    dataClasses: ["recorded"],
  };
}
