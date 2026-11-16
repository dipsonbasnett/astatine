import type {
  CheckInRecord,
  ConfidenceLevel,
  ReadinessAction,
  ReadinessAssessment,
  ReadinessBand,
  ReadinessConfidence,
  ReadinessFactor,
  ReadinessFactorId,
  ReadinessFactorStatus,
  ReadinessInputs,
} from "@/types/health";

export const READINESS_FORMULA =
  "Recorded-only rubric. Sleep duration (25%), sleep regularity (15%), exercise adherence (20%), and workload/fatigue self-report (40%) are scored 0–100 and combined by weight. Check-in, hydration, and nutrition logging are shown as context and confidence inputs, not recovery scores. The band is Ready at 75+ with every scored factor at 55+, Monitor at 50+, and Rest and recover below that or when any scored factor is under 35. Missing factors are never replaced with invented values.";

export const READINESS_CAVEATS = [
  "Monitoring support, not diagnosis. This view does not assess medical conditions, fitness for duty, or flight safety.",
  "Astatine does not predict medical events, diagnose sleep or recovery problems, or treat hydration and nutrition entries as measures of intake or status.",
  "Every factor is computed from a fixed, published rubric. There is no AI model, no opaque score, and no hidden weighting.",
  "A simulated trend may be shown as illustration. It is never stored, never merged with recorded data, and never changes the recorded band.",
];

export const READINESS_ESCALATION = [
  "If you notice new, persistent, or worsening symptoms, or a safety concern, contact your mission medical support channel or flight surgeon through your mission's normal process.",
  "For an emergency, follow your mission's emergency procedures. Astatine does not monitor in real time and cannot detect medical events.",
  "Astatine cannot judge urgency, recommend treatment, or determine whether you are fit for duty.",
];

export const READINESS_BAND_LABELS: Record<ReadinessBand, string> = {
  ready: "Ready",
  monitor: "Monitor",
  rest: "Rest and recover",
  insufficient: "Insufficient data",
};

export const READINESS_BAND_DESCRIPTIONS: Record<ReadinessBand, string> = {
  ready:
    "Recorded inputs are broadly steady in this window. Keep routines steady and continue logging. This is not a fitness-for-duty determination.",
  monitor:
    "Some recorded inputs are mixed. A small adjustment and a follow-up check-in may help clarify the picture.",
  rest: "At least one recorded input is low in this window. Consider reducing optional demand and protecting recovery routines where operations allow.",
  insufficient:
    "There is not enough recorded context in this window to describe recovery readiness.",
};

export const READINESS_CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  high: "High",
  moderate: "Moderate",
  low: "Low",
};

interface FactorMeta {
  label: string;
  weight: number;
  affectsBand: boolean;
}

const FACTOR_META: Record<ReadinessFactorId, FactorMeta> = {
  checkInAdherence: { label: "Check-in adherence", weight: 0, affectsBand: false },
  sleepDuration: { label: "Sleep duration", weight: 0.25, affectsBand: true },
  sleepRegularity: { label: "Sleep regularity", weight: 0.15, affectsBand: true },
  exerciseAdherence: { label: "Exercise adherence", weight: 0.2, affectsBand: true },
  hydrationLogging: { label: "Hydration logging", weight: 0, affectsBand: false },
  nutritionLogging: { label: "Nutrition logging", weight: 0, affectsBand: false },
  workloadFatigue: { label: "Workload and fatigue", weight: 0.4, affectsBand: true },
};

const FACTOR_ORDER: readonly ReadinessFactorId[] = [
  "checkInAdherence",
  "sleepDuration",
  "sleepRegularity",
  "exerciseAdherence",
  "workloadFatigue",
  "hydrationLogging",
  "nutritionLogging",
];

const ACTION_TEMPLATES: Record<ReadinessFactorId, { title: string; detail: string }> = {
  checkInAdherence: {
    title: "Record a check-in at a consistent time",
    detail:
      "A short daily check-in keeps the window current. This suggestion is about logging coverage, not recovery.",
  },
  sleepDuration: {
    title: "Protect a consistent sleep window",
    detail:
      "Where operations allow, aim for a steady sleep-wake window and note changes. This is a routine suggestion, not a sleep prescription.",
  },
  sleepRegularity: {
    title: "Keep sleep timing consistent",
    detail:
      "Recorded sleep timing varied across the window. Where duty schedules allow, hold the sleep and wake times steady.",
  },
  exerciseAdherence: {
    title: "Compare planned and completed movement",
    detail:
      "If movement was planned but not completed, note why and reduce the plan to something repeatable. This is not an exercise prescription.",
  },
  hydrationLogging: {
    title: "Log fluid intake at consistent points",
    detail:
      "Logging fluids more often makes the record easier to interpret. These entries are not a measure of hydration status.",
  },
  nutritionLogging: {
    title: "Log meals and snacks as they happen",
    detail:
      "More frequent logging improves the record. Astatine does not assess nutritional adequacy or intake.",
  },
  workloadFatigue: {
    title: "Plan a lower-demand block",
    detail:
      "If workload and fatigue are both high, consider a lighter optional block and a follow-up check-in. Do not change operational duties on this basis alone.",
  },
};

function clamp(value: number, minimum = 0, maximum = 100): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function usableWindowDays(windowDays: number): number {
  return windowDays === 14 ? 14 : 7;
}

export function readinessStatusForScore(score: number | null): ReadinessFactorStatus {
  if (score === null) return "missing";
  if (score >= 70) return "supports";
  if (score >= 45) return "mixed";
  return "limits";
}

export function sleepDurationScore(hours: number): number {
  if (hours >= 7 && hours <= 9) return 100;
  const distance = hours < 7 ? 7 - hours : hours - 9;
  return clamp(Math.round(100 - distance * 25));
}

export function sleepRegularityScore(standardDeviationHours: number): number {
  if (standardDeviationHours <= 0.5) return 100;
  if (standardDeviationHours <= 1) return 80;
  if (standardDeviationHours <= 1.5) return 60;
  if (standardDeviationHours <= 2) return 35;
  return 15;
}

function buildFactor(
  id: ReadinessFactorId,
  options: {
    score: number | null;
    valueLabel: string;
    explanation: string;
    sourceLabel: string;
    missingReason?: string;
  },
): ReadinessFactor {
  const meta = FACTOR_META[id];
  const score = options.score === null ? null : clamp(Math.round(options.score));
  return {
    id,
    label: meta.label,
    category: "recorded",
    sourceLabel: options.sourceLabel,
    status: readinessStatusForScore(score),
    score,
    weight: meta.weight,
    affectsBand: meta.affectsBand,
    valueLabel: options.valueLabel,
    explanation: options.explanation,
    ...(options.missingReason ? { missingReason: options.missingReason } : {}),
  };
}

function ageHoursFor(observedAt: string, nowMs: number): number | null {
  const observedMs = Date.parse(observedAt);
  if (!Number.isFinite(observedMs)) return null;
  return Math.max(0, round((nowMs - observedMs) / 3_600_000, 1));
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function sleepRegularity(
  checkIns: readonly CheckInRecord[],
): { score: number; valueLabel: string; explanation: string } | null {
  if (checkIns.length < 3) return null;
  const average = mean(checkIns.map((record) => record.sleepHours));
  const variance =
    checkIns.reduce((total, record) => total + (record.sleepHours - average) ** 2, 0) /
    checkIns.length;
  const deviation = round(Math.sqrt(variance), 2);
  const score = sleepRegularityScore(deviation);
  return {
    score,
    valueLabel: `±${deviation} h across ${checkIns.length} check-ins`,
    explanation:
      deviation <= 1
        ? `Sleep duration varied by about ±${deviation} h across the window. This is a description of recorded duration, not sleep quality or a sleep assessment.`
        : `Sleep duration varied by about ±${deviation} h across the window. More variation lowers this factor; it is not a sleep diagnosis.`,
  };
}

function exerciseFactor(
  checkIns: readonly CheckInRecord[],
  windowDays: number,
  missingData: string[],
): ReadinessFactor {
  const recorded = checkIns.filter(
    (record) =>
      isFiniteNumber(record.exercisePlannedMinutes) ||
      isFiniteNumber(record.exerciseCompletedMinutes),
  );
  const completeDays = recorded.filter(
    (record) =>
      isFiniteNumber(record.exercisePlannedMinutes) &&
      isFiniteNumber(record.exerciseCompletedMinutes),
  );

  if (completeDays.length === 0) {
    const reason =
      recorded.length > 0
        ? "Planned and completed exercise minutes were not recorded together, so adherence cannot be described."
        : "No planned or completed exercise minutes were recorded in this window.";
    return buildFactor("exerciseAdherence", {
      score: null,
      valueLabel: "No paired exercise entries",
      explanation:
        "Exercise adherence compares completed with planned minutes on the same day. Without paired entries it is left empty rather than estimated.",
      sourceLabel: "Recorded · crew check-ins",
      missingReason: reason,
    });
  }

  const plannedTotal = completeDays.reduce(
    (total, record) => total + (record.exercisePlannedMinutes ?? 0),
    0,
  );
  const completedTotal = completeDays.reduce(
    (total, record) => total + (record.exerciseCompletedMinutes ?? 0),
    0,
  );

  if (plannedTotal === 0) {
    if (completedTotal === 0) {
      return buildFactor("exerciseAdherence", {
        score: null,
        valueLabel: "No planned minutes",
        explanation:
          "Zero planned exercise minutes were recorded, so an adherence ratio would describe nothing.",
        sourceLabel: "Recorded · crew check-ins",
        missingReason:
          "No planned exercise minutes were recorded in this window, so adherence cannot be described.",
      });
    }
    return buildFactor("exerciseAdherence", {
      score: 100,
      valueLabel: `${completedTotal} min completed, no plan`,
      explanation: `${completedTotal} completed minutes were recorded against a zero plan. The rubric treats that as full completion while noting there was no plan to compare against.`,
      sourceLabel: "Recorded · crew check-ins",
    });
  }

  const score = clamp((completedTotal / plannedTotal) * 100);
  if (completeDays.length < windowDays) {
    missingData.push(
      `Exercise entries cover ${completeDays.length} of ${windowDays} days in this window.`,
    );
  }
  return buildFactor("exerciseAdherence", {
    score,
    valueLabel: `${completedTotal} of ${plannedTotal} planned min`,
    explanation: `${completedTotal} completed minutes are compared with ${plannedTotal} planned minutes across ${completeDays.length} recorded day${completeDays.length === 1 ? "" : "s"}. This is a logging and adherence view, not an exercise prescription.`,
    sourceLabel: "Recorded · crew check-ins",
  });
}

function entryLoggingFactor(
  id: "hydrationLogging" | "nutritionLogging",
  checkIns: readonly CheckInRecord[],
  windowDays: number,
  missingData: string[],
): ReadinessFactor {
  const noun = id === "hydrationLogging" ? "fluid" : "meal or snack";
  const entries = checkIns.filter((record) =>
    id === "hydrationLogging"
      ? isFiniteNumber(record.hydrationEntries)
      : isFiniteNumber(record.nutritionEntries),
  );

  if (entries.length === 0) {
    return buildFactor(id, {
      score: null,
      valueLabel: "No entries recorded",
      explanation:
        "Entry counts describe how often intake was logged. They do not measure hydration status or nutritional adequacy.",
      sourceLabel: "Recorded · crew check-ins",
      missingReason: `No ${id === "hydrationLogging" ? "fluid" : "nutrition"} entries were recorded in this window.`,
    });
  }

  const average = round(
    mean(
      entries.map((record) =>
        id === "hydrationLogging"
          ? (record.hydrationEntries ?? 0)
          : (record.nutritionEntries ?? 0),
      ),
    ),
    1,
  );
  const score = clamp((average / 4) * 100);
  if (entries.length < windowDays) {
    missingData.push(
      `${id === "hydrationLogging" ? "Hydration" : "Nutrition"} entries cover ${entries.length} of ${windowDays} days in this window.`,
    );
  }
  return buildFactor(id, {
    score,
    valueLabel: `${average} ${noun} entries/day`,
    explanation: `${average} ${noun} entries per day were logged across ${entries.length} recorded day${entries.length === 1 ? "" : "s"}. This factor reflects logging frequency only; it is not a measure of hydration or nutrition status.`,
    sourceLabel: "Recorded · crew check-ins",
  });
}

function workloadFatigueFactor(
  latest: CheckInRecord,
  missingData: string[],
): ReadinessFactor {
  const fatigueScore = clamp(Math.round(((5 - latest.fatigue) / 4) * 100));
  if (!isFiniteNumber(latest.workload)) {
    missingData.push(
      "Workload was not recorded on the latest check-in, so this factor uses fatigue only.",
    );
    return buildFactor("workloadFatigue", {
      score: fatigueScore,
      valueLabel: `Fatigue ${latest.fatigue}/5 · workload not recorded`,
      explanation: `Self-reported fatigue is ${latest.fatigue} of 5, scored as ${fatigueScore} of 100. Workload is missing from the latest check-in and was not estimated.`,
      sourceLabel: "Recorded · latest check-in",
      missingReason: "Workload was not recorded on the latest check-in.",
    });
  }

  const workloadScore = clamp(Math.round(((5 - latest.workload) / 4) * 100));
  const score = Math.round((fatigueScore + workloadScore) / 2);
  return buildFactor("workloadFatigue", {
    score,
    valueLabel: `Fatigue ${latest.fatigue}/5 · workload ${latest.workload}/5`,
    explanation: `Self-reported fatigue is ${latest.fatigue} of 5 and workload is ${latest.workload} of 5, averaged into ${score} of 100. This is a self-report summary, not a clinical severity rating.`,
    sourceLabel: "Recorded · latest check-in",
  });
}

function classifyBand(factors: readonly ReadinessFactor[]): {
  band: ReadinessBand;
  averageScore: number | null;
} {
  const scored = factors.filter((factor) => factor.affectsBand && factor.score !== null);
  const totalWeight = scored.reduce((total, factor) => total + factor.weight, 0);
  if (scored.length === 0 || totalWeight < 0.35) {
    return { band: "insufficient", averageScore: null };
  }

  const averageScore = round(
    scored.reduce((total, factor) => total + (factor.score ?? 0) * factor.weight, 0) /
      totalWeight,
  );

  if (scored.some((factor) => (factor.score ?? 100) < 35)) {
    return { band: "rest", averageScore };
  }
  if (
    totalWeight >= 0.6 &&
    averageScore >= 75 &&
    scored.every((factor) => (factor.score ?? 0) >= 55)
  ) {
    return { band: "ready", averageScore };
  }
  if (averageScore >= 50) {
    return { band: "monitor", averageScore };
  }
  return { band: "rest", averageScore };
}

function buildExplanation(
  band: ReadinessBand,
  factors: readonly ReadinessFactor[],
  averageScore: number | null,
  coverage: number,
  windowDays: number,
): string {
  const available = factors.filter((factor) => factor.score !== null);
  const lowest = [...available].sort(
    (left, right) => (left.score ?? 0) - (right.score ?? 0),
  )[0];

  if (band === "insufficient" || averageScore === null) {
    return `There is not enough recorded context in the ${windowDays}-day window to describe recovery readiness. Record a check-in rather than relying on an estimated score.`;
  }

  const basis = `The weighted recorded score is ${averageScore} of 100 with ${available.length} of ${factors.length} rubric inputs available (${coverage}% coverage).`;

  if (band === "ready") {
    return `${basis} Every scored factor is at or above the Ready threshold. Keep routines steady and continue logging; this is monitoring support, not a fitness-for-duty determination.`;
  }

  const lowestText = lowest
    ? `The lowest scored input is ${lowest.label.toLowerCase()} at ${lowest.score} of 100.`
    : "";

  if (band === "monitor") {
    return `${basis} ${lowestText} The band is Monitor because the weighted score is in the middle range or at least one scored factor sits below the Ready threshold. Consider the suggested adjustment and a follow-up check-in.`;
  }

  return `${basis} ${lowestText} The band is Rest and recover because the weighted score is low or at least one scored factor is below 35. This is not a diagnosis; it is a prompt to protect recovery and, if symptoms persist, reach out through the mission medical channel.`;
}

function buildConfidence(
  coverage: number,
  ageHours: number | null,
  checkInsInWindow: number,
  missingData: readonly string[],
): ReadinessConfidence {
  const reasons: string[] = [
    `${checkInsInWindow} check-in${checkInsInWindow === 1 ? "" : "s"} recorded within the window.`,
    ageHours === null
      ? "The latest check-in time could not be read."
      : `The latest check-in is ${ageHours} h old.`,
    `${coverage}% of the seven rubric inputs have recorded data.`,
  ];

  let level: ConfidenceLevel;
  if (
    coverage >= 80 &&
    ageHours !== null &&
    ageHours <= 24 &&
    checkInsInWindow >= 5 &&
    missingData.length === 0
  ) {
    level = "high";
  } else if (coverage >= 45 && ageHours !== null && ageHours <= 48) {
    level = "moderate";
  } else {
    level = "low";
  }

  if (missingData.length > 0) {
    reasons.push(
      `${missingData.length} data gap${missingData.length === 1 ? "" : "s"} remain visible below and are not filled in.`,
    );
  }

  return { level, coverage, reasons };
}

function buildActions(factors: readonly ReadinessFactor[]): ReadinessAction[] {
  const needsAttention = factors
    .filter(
      (factor) =>
        factor.score !== null &&
        (factor.status === "limits" || factor.status === "mixed"),
    )
    .sort((left, right) => {
      if (left.affectsBand !== right.affectsBand) return left.affectsBand ? -1 : 1;
      return (left.score ?? 0) - (right.score ?? 0);
    })
    .slice(0, 3);

  if (needsAttention.length === 0) {
    return [
      {
        id: "maintain-routines",
        title: "Maintain current routines",
        detail:
          "Every recorded scored input is at or above 70. Keep recording check-ins so the picture stays current. No change is required by this rubric.",
        sourceLabel: "Recorded · fixed rubric",
        priority: "primary",
      },
    ];
  }

  return needsAttention.map((factor, index) => {
    const template = ACTION_TEMPLATES[factor.id];
    return {
      id: `action-${factor.id}`,
      title: template.title,
      detail: template.detail,
      sourceLabel: factor.sourceLabel,
      priority: index === 0 ? "primary" : "supporting",
    };
  });
}

function collectMissingData(factors: readonly ReadinessFactor[]): string[] {
  return factors
    .filter((factor) => factor.missingReason)
    .map((factor) => factor.missingReason as string);
}

function buildReadinessInputs(
  latest: CheckInRecord,
  ageHours: number | null,
  count: number,
  windowDays: number,
): ReadinessInputs {
  return {
    checkInId: latest.id,
    observedAt: latest.observedAt,
    ageHours: ageHours ?? 0,
    checkInsInWindow: count,
    windowDays,
    formula: READINESS_FORMULA,
  };
}

export interface AssessReadinessOptions {
  checkIns: readonly CheckInRecord[];
  now?: Date;
  windowDays?: number;
}

export function assessReadiness({
  checkIns,
  now = new Date(),
  windowDays = 7,
}: AssessReadinessOptions): ReadinessAssessment | null {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) return null;
  const days = usableWindowDays(windowDays);
  const windowHours = days * 24;

  const inWindow = checkIns
    .filter((record) => Number.isFinite(Date.parse(record.observedAt)))
    .filter((record) => {
      const observedMs = Date.parse(record.observedAt);
      return observedMs <= nowMs && nowMs - observedMs <= windowHours * 3_600_000;
    })
    .sort((left, right) => Date.parse(right.observedAt) - Date.parse(left.observedAt));

  const latest = inWindow[0];
  if (!latest) return null;

  const latestObservedMs = Date.parse(latest.observedAt);
  const ageHours = ageHoursFor(latest.observedAt, nowMs);
  const missingData: string[] = [];
  if (inWindow.length < 2) {
    missingData.push(
      `Only one check-in was recorded in the ${days}-day window, so trends cannot be described.`,
    );
  }

  const adherenceScore = clamp(Math.round((inWindow.length / days) * 100));
  const checkInAdherence = buildFactor("checkInAdherence", {
    score: adherenceScore,
    valueLabel: `${inWindow.length} of ${days} days`,
    explanation: `${inWindow.length} recorded check-in${inWindow.length === 1 ? "" : "s"} cover ${adherenceScore}% of the ${days}-day window. This factor describes logging coverage, not recovery.`,
    sourceLabel: "Recorded · crew check-ins",
  });

  const sleepHours = latest.sleepHours;
  const sleepDuration = buildFactor("sleepDuration", {
    score: isFiniteNumber(sleepHours) ? sleepDurationScore(sleepHours) : null,
    valueLabel: isFiniteNumber(sleepHours)
      ? `${sleepHours} h on latest check-in`
      : "Sleep duration not recorded",
    explanation: isFiniteNumber(sleepHours)
      ? `The latest recorded sleep duration is ${sleepHours} h. The rubric's 7–9 h reference band is a general benchmark, not a clinical target or a sleep assessment.`
      : "Sleep duration was missing from the latest check-in and was not estimated.",
    sourceLabel: "Recorded · latest check-in",
    ...(isFiniteNumber(sleepHours)
      ? {}
      : { missingReason: "Sleep duration was not recorded on the latest check-in." }),
  });

  const regularity = sleepRegularity(inWindow);
  const sleepRegularityFactor = regularity
    ? buildFactor("sleepRegularity", {
        score: regularity.score,
        valueLabel: regularity.valueLabel,
        explanation: regularity.explanation,
        sourceLabel: `Recorded · derived from ${inWindow.length} check-ins`,
      })
    : buildFactor("sleepRegularity", {
        score: null,
        valueLabel: "Needs three check-ins",
        explanation:
          "Sleep regularity compares recorded sleep duration across the window. Fewer than three check-ins cannot describe variation.",
        sourceLabel: "Recorded · crew check-ins",
        missingReason:
          "At least three check-ins in this window are needed to describe sleep regularity.",
      });

  const exercise = exerciseFactor(inWindow, days, missingData);
  const workload = workloadFatigueFactor(latest, missingData);
  const hydration = entryLoggingFactor("hydrationLogging", inWindow, days, missingData);
  const nutrition = entryLoggingFactor("nutritionLogging", inWindow, days, missingData);

  const factors = FACTOR_ORDER.map((id) => {
    switch (id) {
      case "checkInAdherence":
        return checkInAdherence;
      case "sleepDuration":
        return sleepDuration;
      case "sleepRegularity":
        return sleepRegularityFactor;
      case "exerciseAdherence":
        return exercise;
      case "workloadFatigue":
        return workload;
      case "hydrationLogging":
        return hydration;
      case "nutritionLogging":
        return nutrition;
    }
  });

  const available = factors.filter((factor) => factor.score !== null).length;
  const coverage = Math.round((available / factors.length) * 100);
  const { band, averageScore } = classifyBand(factors);

  missingData.unshift(...collectMissingData(factors));

  const latestAgeHours =
    ageHours ?? Math.max(0, round((nowMs - latestObservedMs) / 3_600_000, 1));

  return {
    band,
    averageScore,
    coverage,
    factors,
    confidence: buildConfidence(coverage, latestAgeHours, inWindow.length, missingData),
    inputs: buildReadinessInputs(latest, latestAgeHours, inWindow.length, days),
    missingData,
    explanation: buildExplanation(band, factors, averageScore, coverage, days),
    actions: buildActions(factors),
    escalation: [...READINESS_ESCALATION],
    caveats: [...READINESS_CAVEATS],
    dataClasses: ["recorded"],
  };
}

const BANDS: readonly ReadinessBand[] = ["ready", "monitor", "rest", "insufficient"];
const STATUSES: readonly ReadinessFactorStatus[] = [
  "supports",
  "mixed",
  "limits",
  "missing",
];
const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = ["high", "moderate", "low"];

function isScore(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100
  );
}

function isReadinessFactor(value: unknown): value is ReadinessFactor {
  if (typeof value !== "object" || value === null) return false;
  const factor = value as Record<string, unknown>;
  return (
    typeof factor.id === "string" &&
    factor.id in FACTOR_META &&
    typeof factor.label === "string" &&
    factor.category === "recorded" &&
    typeof factor.sourceLabel === "string" &&
    typeof factor.status === "string" &&
    STATUSES.includes(factor.status as ReadinessFactorStatus) &&
    (factor.score === null || isScore(factor.score)) &&
    typeof factor.weight === "number" &&
    factor.weight >= 0 &&
    factor.weight <= 1 &&
    typeof factor.affectsBand === "boolean" &&
    typeof factor.valueLabel === "string" &&
    typeof factor.explanation === "string" &&
    (factor.missingReason === undefined || typeof factor.missingReason === "string")
  );
}

function isReadinessAction(value: unknown): value is ReadinessAction {
  if (typeof value !== "object" || value === null) return false;
  const action = value as Record<string, unknown>;
  return (
    typeof action.id === "string" &&
    typeof action.title === "string" &&
    typeof action.detail === "string" &&
    typeof action.sourceLabel === "string" &&
    (action.priority === "primary" || action.priority === "supporting")
  );
}

function isReadinessAssessmentInput(value: unknown): value is ReadinessInputs {
  if (typeof value !== "object" || value === null) return false;
  const inputs = value as Record<string, unknown>;
  return (
    typeof inputs.checkInId === "string" &&
    typeof inputs.observedAt === "string" &&
    Number.isFinite(Date.parse(inputs.observedAt)) &&
    typeof inputs.ageHours === "number" &&
    Number.isFinite(inputs.ageHours) &&
    inputs.ageHours >= 0 &&
    typeof inputs.checkInsInWindow === "number" &&
    Number.isInteger(inputs.checkInsInWindow) &&
    inputs.checkInsInWindow >= 0 &&
    typeof inputs.windowDays === "number" &&
    Number.isInteger(inputs.windowDays) &&
    inputs.windowDays > 0 &&
    typeof inputs.formula === "string"
  );
}

export function isReadinessAssessment(value: unknown): value is ReadinessAssessment {
  if (typeof value !== "object" || value === null) return false;
  const assessment = value as Record<string, unknown>;
  if (
    typeof assessment.band !== "string" ||
    !BANDS.includes(assessment.band as ReadinessBand) ||
    (assessment.averageScore !== null && !isScore(assessment.averageScore)) ||
    !isScore(assessment.coverage) ||
    !Array.isArray(assessment.factors) ||
    assessment.factors.length === 0 ||
    !assessment.factors.every(isReadinessFactor)
  ) {
    return false;
  }

  const confidence = assessment.confidence;
  if (typeof confidence !== "object" || confidence === null) return false;
  const confidenceRecord = confidence as Record<string, unknown>;
  if (
    typeof confidenceRecord.level !== "string" ||
    !CONFIDENCE_LEVELS.includes(confidenceRecord.level as ConfidenceLevel) ||
    !isScore(confidenceRecord.coverage) ||
    !Array.isArray(confidenceRecord.reasons) ||
    !confidenceRecord.reasons.every((reason) => typeof reason === "string")
  ) {
    return false;
  }

  return (
    isReadinessAssessmentInput(assessment.inputs) &&
    typeof assessment.explanation === "string" &&
    Array.isArray(assessment.missingData) &&
    assessment.missingData.every((entry) => typeof entry === "string") &&
    Array.isArray(assessment.actions) &&
    assessment.actions.every(isReadinessAction) &&
    Array.isArray(assessment.escalation) &&
    assessment.escalation.every((entry) => typeof entry === "string") &&
    Array.isArray(assessment.caveats) &&
    assessment.caveats.every((entry) => typeof entry === "string") &&
    Array.isArray(assessment.dataClasses) &&
    assessment.dataClasses.length === 1 &&
    assessment.dataClasses[0] === "recorded"
  );
}

export { FACTOR_ORDER, FACTOR_META };
