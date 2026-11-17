import { researchForCoachDomain } from "@/features/countermeasures/research-library";
import { checkInField } from "@/features/checkin/checkin-engine";
import type {
  CheckInRecord,
  CheckInScaleField,
  CoachDomain,
  ScaleValue,
  VitalLink,
  VitalPoint,
  VitalRecordedSeries,
  VitalReferenceContext,
  VitalResearchContext,
  VitalSimulatedSeries,
  VitalTrendDirection,
  VitalView,
  VitalViewId,
  VitalsSnapshot,
} from "@/types/health";

import {
  VITALS_SIMULATION_NOTE,
  buildSimulatedVitals,
  type SimulatedVitalsSnapshot,
} from "./vitals-simulation";

export const VITALS_LIMITS = [
  "Vitals does not diagnose, predict medical events, or replace a medical professional or your mission medical support channel.",
  "No sensors, wearables, or devices are connected, and nothing is captured automatically. Recorded entries are self-report.",
  "Simulated content is synthetic, and research context is population-level; neither is recorded data or describes the selected crew member.",
];

export const VITALS_RESEARCH_NOTE =
  "Research context is external, population-level context. It does not describe the selected crew member, does not change any recorded value, and is not an endorsement of Astatine by the publisher.";

export const VITALS_NO_RESEARCH_NOTE =
  "No verified research source is linked for this view. Astatine omits context rather than citing something it cannot support.";

type WindowDays = 7 | 14;

const VIEW_ORDER: readonly VitalViewId[] = [
  "heartRate",
  "spo2",
  "bloodPressure",
  "sleepRecovery",
  "activity",
  "hydration",
  "nutrition",
];

interface TrendOptions {
  threshold: number;
  unit: string;
  decimals: number;
  noun: string;
  prefix: "Recorded" | "Synthetic";
}

interface TrendResult {
  trend: VitalTrendDirection;
  trendLabel: string;
  trendDetail: string;
}

function formatNumber(value: number, decimals: number): string {
  return value
    .toFixed(decimals)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

function computeTrend(points: readonly VitalPoint[], options: TrendOptions): TrendResult {
  if (points.length < 2) {
    return {
      trend: "insufficient",
      trendLabel: "Not enough data",
      trendDetail: `At least two ${options.noun} in this window are needed to describe a direction; ${points.length} ${points.length === 1 ? "is" : "are"} available.`,
    };
  }

  const first = points[0];
  const latest = points[points.length - 1];
  if (!first || !latest) {
    return {
      trend: "insufficient",
      trendLabel: "Not enough data",
      trendDetail: "A direction cannot be described from the available values.",
    };
  }

  const delta = latest.value - first.value;
  const trend: VitalTrendDirection =
    delta >= options.threshold
      ? "rising"
      : delta <= -options.threshold
        ? "falling"
        : "steady";
  const label =
    trend === "rising" ? "Rising" : trend === "falling" ? "Falling" : "Steady";
  const range = `${formatNumber(first.value, options.decimals)} to ${formatNumber(
    latest.value,
    options.decimals,
  )} ${options.unit}`;

  return {
    trend,
    trendLabel: label,
    trendDetail:
      trend === "steady"
        ? `${options.prefix} values stayed within the steady band (${range}) across ${points.length} ${options.noun}. Direction is descriptive only.`
        : `${options.prefix} values moved from ${range} across ${points.length} ${options.noun}. Direction is descriptive only.`,
  };
}

function uniqueDayCount(points: readonly VitalPoint[]): number {
  return new Set(points.map((point) => point.observedAt.slice(0, 10))).size;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function scaleLabel(field: CheckInScaleField, value: ScaleValue): string {
  const definition = checkInField(field);
  return (
    definition?.options.find((option) => option.value === value)?.label ?? `${value}/5`
  );
}

function researchFor(id: VitalViewId): VitalResearchContext | null {
  const domain: Partial<Record<VitalViewId, CoachDomain>> = {
    sleepRecovery: "sleep",
    activity: "exercise",
    hydration: "hydration",
    nutrition: "nutrition",
  };
  const selected = domain[id];
  if (!selected) return null;

  const entry = researchForCoachDomain(selected);
  if (!entry) return null;

  return {
    id: entry.id,
    title: entry.title,
    publisher: entry.publisher,
    url: entry.url,
    accessedAt: entry.accessedAt,
    claim: entry.claim,
    limitations: entry.limitations,
  };
}

function noRangeReference(measure: string, detail: string): VitalReferenceContext {
  return {
    status: "not-shown",
    title: "No reference range shown",
    detail: `Astatine has no verified public source for a personal ${measure} target, so it does not draw a range. ${detail}`,
  };
}

const DEVICE_LINKS: readonly VitalLink[] = [
  { label: "Check-in", to: "/check-in" },
  { label: "Readiness", to: "/readiness" },
  { label: "Mission monitor", to: "/mission" },
  { label: "Research", to: "/research" },
];

const LIFESTYLE_LINKS: readonly VitalLink[] = [
  { label: "Check-in", to: "/check-in" },
  { label: "Readiness", to: "/readiness" },
  { label: "Brief", to: "/brief" },
  { label: "Research", to: "/research" },
];

interface DeviceViewDefinition {
  label: string;
  unit: string;
  decimals: number;
  summary: string;
  reason: string;
  reference: VitalReferenceContext;
}

const DEVICE_VIEWS: Readonly<
  Record<"heartRate" | "spo2" | "bloodPressure", DeviceViewDefinition>
> = {
  heartRate: {
    label: "Heart rate",
    unit: "bpm",
    decimals: 0,
    summary:
      "Heart rate is not recorded in Astatine. A clearly labeled synthetic demonstration appears in a separate section so the simulated boundary stays visible.",
    reason: "Heart rate",
    reference: noRangeReference(
      "heart-rate",
      "A demonstration value is synthetic and does not describe you.",
    ),
  },
  spo2: {
    label: "SpO2",
    unit: "%",
    decimals: 1,
    summary:
      "Oxygen saturation is not recorded in Astatine. A clearly labeled synthetic demonstration appears in a separate section; it is not a pulse-oximeter reading.",
    reason: "Oxygen saturation",
    reference: noRangeReference(
      "oxygen-saturation",
      "A demonstration value is synthetic and does not describe you.",
    ),
  },
  bloodPressure: {
    label: "Blood pressure style",
    unit: "mmHg",
    decimals: 0,
    summary:
      "Blood-pressure-style readings are not recorded in Astatine. A labeled synthetic pair is shown separately; it is not a blood-pressure measurement.",
    reason: "Blood pressure",
    reference: noRangeReference(
      "blood-pressure",
      "A demonstration pair is synthetic and does not describe you.",
    ),
  },
};

function emptyRecordedSeries(
  measure: string,
  days: number,
  checkInsInWindow: number,
): VitalRecordedSeries {
  return {
    category: "recorded",
    available: false,
    points: [],
    latest: null,
    trend: "insufficient",
    trendLabel: "Not recorded",
    trendDetail: `No recorded ${measure.toLowerCase()} exists in Astatine, so a direction cannot be described.`,
    coverageText: `0 of ${days} days have recorded ${measure.toLowerCase()}.`,
    missing: [
      `${measure} is not part of the check-in form, and Astatine does not ingest devices or wearables.`,
      ...(checkInsInWindow > 0
        ? [
            `${checkInsInWindow} recorded check-in${checkInsInWindow === 1 ? "" : "s"} in this window do not include ${measure.toLowerCase()}.`,
          ]
        : []),
    ],
    context: [],
    note: "Recorded data only. No value is estimated or filled from simulation.",
  };
}

interface RecordedSeriesOptions {
  points: VitalPoint[];
  inWindow: readonly CheckInRecord[];
  days: number;
  threshold: number;
  unit: string;
  decimals: number;
  emptyReason: string;
  extras: string[];
  context: string[];
  note: string;
}

function buildRecordedSeries(options: RecordedSeriesOptions): VitalRecordedSeries {
  const { points, inWindow, days } = options;
  const coveredDays = uniqueDayCount(points);
  const missing: string[] = [];

  if (inWindow.length === 0) {
    missing.push(
      `No check-ins were recorded in the ${days}-day window, so nothing is available.`,
    );
  } else {
    if (points.length === 0) {
      missing.push(options.emptyReason);
    } else if (points.length === 1) {
      missing.push("Only one check-in is available, so a direction cannot be described.");
    }
    missing.push(...options.extras);
    if (points.length > 0 && coveredDays < days) {
      missing.push(
        `Recorded coverage is ${coveredDays} of ${days} days; gaps are not filled.`,
      );
    }
  }

  const trend = computeTrend(points, {
    threshold: options.threshold,
    unit: options.unit,
    decimals: options.decimals,
    noun: "check-ins",
    prefix: "Recorded",
  });

  return {
    category: "recorded",
    available: points.length > 0,
    points,
    latest: points[points.length - 1] ?? null,
    ...trend,
    coverageText:
      points.length === 0
        ? `No recorded observations in the ${days}-day window.`
        : `Recorded on ${coveredDays} of ${days} days in this window.`,
    missing,
    context: options.context,
    note: options.note,
  };
}

function buildSleepView(inWindow: readonly CheckInRecord[], days: number): VitalView {
  const points = inWindow.map((record): VitalPoint => ({
    observedAt: record.observedAt,
    value: record.sleepHours,
  }));
  const latest = inWindow[inWindow.length - 1];
  const context = latest
    ? [
        `Sleep quality ${scaleLabel("sleepQuality", latest.sleepQuality)} (${latest.sleepQuality}/5)`,
        `Fatigue ${scaleLabel("fatigue", latest.fatigue)} (${latest.fatigue}/5)`,
      ]
    : [];

  return {
    id: "sleepRecovery",
    label: "Sleep and recovery",
    unit: "h",
    decimals: 1,
    summary:
      "Self-reported sleep duration with the latest sleep-quality and fatigue context. Astatine does not track sleep, detect sleep stages, or assess a sleep disorder.",
    recorded: buildRecordedSeries({
      points,
      inWindow,
      days,
      threshold: 0.25,
      unit: "h",
      decimals: 1,
      emptyReason: "Sleep duration was not recorded on any check-in in this window.",
      extras: [],
      context,
      note: "Sleep duration is self-reported, not measured. The 7–9 h readiness benchmark is a product rubric, not a clinical target.",
    }),
    simulated: null,
    reference: {
      status: "rubric-benchmark",
      title: "Rubric benchmark, not a clinical range",
      detail:
        "Astatine's readiness rubric scores sleep duration against a general 7–9 h benchmark. It is a product rule, not a clinical reference range, and it does not assess sleep quality or diagnose a sleep disorder.",
    },
    research: researchFor("sleepRecovery"),
    researchNote: researchFor("sleepRecovery")
      ? VITALS_RESEARCH_NOTE
      : VITALS_NO_RESEARCH_NOTE,
    dataClasses: ["recorded", "research"],
    links: LIFESTYLE_LINKS,
  };
}

function buildActivityView(inWindow: readonly CheckInRecord[], days: number): VitalView {
  const points = inWindow.flatMap((record): VitalPoint[] =>
    isFiniteNumber(record.exerciseCompletedMinutes)
      ? [{ observedAt: record.observedAt, value: record.exerciseCompletedMinutes }]
      : [],
  );
  const plannedTotal = inWindow.reduce(
    (total, record) =>
      total +
      (isFiniteNumber(record.exercisePlannedMinutes) ? record.exercisePlannedMinutes : 0),
    0,
  );
  const completedTotal = inWindow.reduce(
    (total, record) =>
      total +
      (isFiniteNumber(record.exerciseCompletedMinutes)
        ? record.exerciseCompletedMinutes
        : 0),
    0,
  );
  const plannedOnly = inWindow.filter(
    (record) =>
      isFiniteNumber(record.exercisePlannedMinutes) &&
      !isFiniteNumber(record.exerciseCompletedMinutes),
  ).length;
  const completedOnly = inWindow.filter(
    (record) =>
      !isFiniteNumber(record.exercisePlannedMinutes) &&
      isFiniteNumber(record.exerciseCompletedMinutes),
  ).length;
  const extras: string[] = [];
  if (plannedOnly > 0) {
    extras.push(
      `${plannedOnly} check-in${plannedOnly === 1 ? "" : "s"} recorded a plan without completed minutes.`,
    );
  }
  if (completedOnly > 0) {
    extras.push(
      `${completedOnly} check-in${completedOnly === 1 ? "" : "s"} recorded completed minutes without a plan.`,
    );
  }

  return {
    id: "activity",
    label: "Exercise and activity",
    unit: "min",
    decimals: 0,
    summary:
      "Self-reported exercise minutes from check-ins, shown as completed minutes over time. Astatine is not an activity tracker and does not estimate energy expenditure.",
    recorded: buildRecordedSeries({
      points,
      inWindow,
      days,
      threshold: 5,
      unit: "min",
      decimals: 0,
      emptyReason:
        "Completed exercise minutes were not recorded on any check-in in this window.",
      extras,
      context:
        inWindow.length > 0
          ? [
              `Planned ${plannedTotal} min · completed ${completedTotal} min across ${inWindow.length} check-in${inWindow.length === 1 ? "" : "s"}`,
            ]
          : [],
      note: "Completed minutes are self-reported. Astatine does not prescribe exercise or assess fitness.",
    }),
    simulated: null,
    reference: noRangeReference(
      "activity",
      "Logging context is shown without a target because Astatine has no verified individualized activity standard for this surface.",
    ),
    research: researchFor("activity"),
    researchNote: researchFor("activity")
      ? VITALS_RESEARCH_NOTE
      : VITALS_NO_RESEARCH_NOTE,
    dataClasses: ["recorded", "research"],
    links: LIFESTYLE_LINKS,
  };
}

function buildHydrationView(inWindow: readonly CheckInRecord[], days: number): VitalView {
  const points = inWindow.map((record): VitalPoint => ({
    observedAt: record.observedAt,
    value: record.hydration,
  }));
  const withEntries = inWindow.filter((record) =>
    isFiniteNumber(record.hydrationEntries),
  );
  const totalEntries = withEntries.reduce(
    (total, record) => total + (record.hydrationEntries ?? 0),
    0,
  );
  const extras: string[] = [];
  if (inWindow.length > 0) {
    if (withEntries.length === 0) {
      extras.push(
        "Fluid entry counts were not recorded on any check-in; the self-rating is shown instead.",
      );
    } else if (withEntries.length < inWindow.length) {
      extras.push(
        `Fluid entry counts were recorded on ${withEntries.length} of ${inWindow.length} check-ins.`,
      );
    }
  }

  return {
    id: "hydration",
    label: "Hydration",
    unit: "of 5",
    decimals: 0,
    summary:
      "Self-reported hydration rating over time, with optional fluid log counts as context. Astatine does not measure fluid intake or hydration status.",
    recorded: buildRecordedSeries({
      points,
      inWindow,
      days,
      threshold: 0.3,
      unit: "of 5",
      decimals: 0,
      emptyReason: "No hydration self-rating was recorded in this window.",
      extras,
      context:
        inWindow.length > 0
          ? [
              `Fluid entries logged on ${withEntries.length} of ${inWindow.length} check-in${inWindow.length === 1 ? "" : "s"} · ${totalEntries} total`,
            ]
          : [],
      note: "The rating is self-reported. Entry counts record logging frequency, not fluid volume or hydration status.",
    }),
    simulated: null,
    reference: noRangeReference(
      "hydration",
      "Entry counts are logging context only and are not a measure of intake or status.",
    ),
    research: researchFor("hydration"),
    researchNote: researchFor("hydration")
      ? VITALS_RESEARCH_NOTE
      : VITALS_NO_RESEARCH_NOTE,
    dataClasses: ["recorded", "research"],
    links: LIFESTYLE_LINKS,
  };
}

function buildNutritionView(inWindow: readonly CheckInRecord[], days: number): VitalView {
  const points = inWindow.flatMap((record): VitalPoint[] =>
    isFiniteNumber(record.nutritionEntries)
      ? [{ observedAt: record.observedAt, value: record.nutritionEntries }]
      : [],
  );
  const withEntries = points.length;
  const totalEntries = points.reduce((total, point) => total + point.value, 0);
  const extras: string[] = [];
  if (inWindow.length > 0) {
    if (withEntries === 0) {
      extras.push(
        "Nutrition entry counts were not recorded on any check-in in this window.",
      );
    } else if (withEntries < inWindow.length) {
      extras.push(
        `Nutrition entry counts were recorded on ${withEntries} of ${inWindow.length} check-ins.`,
      );
    }
  }

  return {
    id: "nutrition",
    label: "Nutrition",
    unit: "entries",
    decimals: 0,
    summary:
      "Self-reported meal and snack log counts over time. Astatine does not assess intake, diet quality, or nutritional status.",
    recorded: buildRecordedSeries({
      points,
      inWindow,
      days,
      threshold: 0.5,
      unit: "entries",
      decimals: 0,
      emptyReason:
        "Nutrition entry counts were not recorded on any check-in in this window.",
      extras,
      context:
        inWindow.length > 0
          ? [
              `${totalEntries} logged entr${totalEntries === 1 ? "y" : "ies"} across ${withEntries} check-in${withEntries === 1 ? "" : "s"}`,
            ]
          : [],
      note: "Entry counts record logging frequency only. Astatine does not assess nutrition or intake.",
    }),
    simulated: null,
    reference: noRangeReference(
      "nutrition",
      "Entry counts are logging context only and are not a measure of intake or nutritional adequacy.",
    ),
    research: researchFor("nutrition"),
    researchNote: researchFor("nutrition")
      ? VITALS_RESEARCH_NOTE
      : VITALS_NO_RESEARCH_NOTE,
    dataClasses: ["recorded", "research"],
    links: LIFESTYLE_LINKS,
  };
}

const SIMULATED_VIEW_SETTINGS: Readonly<
  Record<
    "heartRate" | "spo2" | "bloodPressure",
    { threshold: number; series: keyof SimulatedVitalsSnapshot["series"] }
  >
> = {
  heartRate: { threshold: 2, series: "heartRate" },
  spo2: { threshold: 0.5, series: "spo2" },
  bloodPressure: { threshold: 2, series: "bloodPressure" },
};

function buildSimulatedSeries(
  id: "heartRate" | "spo2" | "bloodPressure",
  simulation: SimulatedVitalsSnapshot,
): VitalSimulatedSeries | null {
  const settings = SIMULATED_VIEW_SETTINGS[id];
  const definition = DEVICE_VIEWS[id];
  const points = simulation.series[settings.series];
  const latest = points[points.length - 1];
  if (!latest) return null;

  const trend = computeTrend(points, {
    threshold: settings.threshold,
    unit: definition.unit,
    decimals: definition.decimals,
    noun: "samples",
    prefix: "Synthetic",
  });

  return {
    category: "simulated",
    points,
    latest,
    ...trend,
    note: VITALS_SIMULATION_NOTE,
    scenarioId: simulation.scenarioId,
    scenarioLabel: simulation.scenarioLabel,
    generator: simulation.generator,
    generatorVersion: simulation.generatorVersion,
    seed: simulation.seed,
  };
}

function buildDeviceView(
  id: "heartRate" | "spo2" | "bloodPressure",
  inWindow: readonly CheckInRecord[],
  days: number,
  simulation: SimulatedVitalsSnapshot,
): VitalView {
  const definition = DEVICE_VIEWS[id];

  return {
    id,
    label: definition.label,
    unit: definition.unit,
    decimals: definition.decimals,
    summary: definition.summary,
    recorded: emptyRecordedSeries(definition.reason, days, inWindow.length),
    simulated: buildSimulatedSeries(id, simulation),
    reference: definition.reference,
    research: researchFor(id),
    researchNote: researchFor(id) ? VITALS_RESEARCH_NOTE : VITALS_NO_RESEARCH_NOTE,
    dataClasses: ["recorded", "simulated", "research"],
    links: DEVICE_LINKS,
  };
}

function buildView(
  id: VitalViewId,
  inWindow: readonly CheckInRecord[],
  days: number,
  simulation: SimulatedVitalsSnapshot,
): VitalView {
  switch (id) {
    case "heartRate":
    case "spo2":
    case "bloodPressure":
      return buildDeviceView(id, inWindow, days, simulation);
    case "sleepRecovery":
      return buildSleepView(inWindow, days);
    case "activity":
      return buildActivityView(inWindow, days);
    case "hydration":
      return buildHydrationView(inWindow, days);
    case "nutrition":
      return buildNutritionView(inWindow, days);
  }
}

export interface BuildVitalsOptions {
  checkIns: readonly CheckInRecord[];
  now?: Date;
  windowDays?: number;
}

export function buildVitalsSnapshot({
  checkIns,
  now = new Date(),
  windowDays = 7,
}: BuildVitalsOptions): VitalsSnapshot | null {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) return null;

  const days: WindowDays = windowDays === 14 ? 14 : 7;
  const windowMs = days * 24 * 3_600_000;

  const inWindow = checkIns
    .filter((record) => Number.isFinite(Date.parse(record.observedAt)))
    .filter((record) => {
      const observedMs = Date.parse(record.observedAt);
      return observedMs <= nowMs && nowMs - observedMs <= windowMs;
    })
    .sort((left, right) => Date.parse(left.observedAt) - Date.parse(right.observedAt));

  const simulation = buildSimulatedVitals(now);

  return {
    generatedAt: new Date(nowMs).toISOString(),
    windowDays: days,
    checkInsInWindow: inWindow.length,
    checkInsTotal: checkIns.length,
    views: VIEW_ORDER.map((id) => buildView(id, inWindow, days, simulation)),
  };
}

export function findVitalView(
  snapshot: VitalsSnapshot,
  id: VitalViewId,
): VitalView | undefined {
  return snapshot.views.find((view) => view.id === id);
}
