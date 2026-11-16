import { isNonEmptyString, isPlainObject } from "@/lib/validation";
import type {
  CoachResearchContext,
  CoachSourceLabel,
  CountermeasureCoach,
  CountermeasureCoachItem,
  CountermeasurePlan,
  CountermeasureStatus,
  CountermeasureSuggestion,
  ReadinessAssessment,
  ReadinessFactor,
  ReadinessFactorId,
  ReadinessFactorStatus,
} from "@/types/health";

import { READINESS_BAND_LABELS } from "@/features/readiness/readiness-engine";

import { COACH_RESEARCH_NOTE, researchForCoachDomain } from "./research-library";

interface ItemCopy {
  title: string;
  whyItMatters: string;
  suggestion: string;
  caution: string;
}

const ITEM_COPY: Record<ReadinessFactorId, ItemCopy> = {
  checkInAdherence: {
    title: "Check-in completion",
    whyItMatters:
      "Regular check-ins keep the recorded picture current during long-duration missions and make gaps explicit.",
    suggestion:
      "Record a check-in at a similar time each day so the window stays current. This is about logging coverage, not recovery.",
    caution:
      "A missed check-in is a data gap, not a health signal. Astatine does not infer anything from missing entries.",
  },
  sleepDuration: {
    title: "Sleep duration and regularity",
    whyItMatters:
      "Mission schedules and the spaceflight environment can affect sleep timing. Astatine only summarizes the sleep entries you record.",
    suggestion:
      "Where duty schedules allow, keep sleep and wake times steady and record them at the next check-in. This is not a sleep prescription.",
    caution:
      "Persistent sleep difficulty should go to mission medical support. Astatine cannot assess causes or treat sleep problems.",
  },
  sleepRegularity: {
    title: "Sleep duration and regularity",
    whyItMatters:
      "Variation in recorded sleep timing can make recovery routines harder to compare across a mission week.",
    suggestion:
      "Where duty schedules allow, hold sleep and wake times steady and note schedule changes in your next check-in.",
    caution:
      "This is a description of recorded duration, not a sleep-quality or circadian assessment.",
  },
  exerciseAdherence: {
    title: "Exercise adherence",
    whyItMatters:
      "Planned physical activity is part of spaceflight operations; this view only compares what you planned with what you recorded completing.",
    suggestion:
      "Where operations allow, compare what was planned with what was completed and make tomorrow's plan repeatable. This is not an exercise prescription.",
    caution:
      "Astatine cannot assess physical capacity, injury risk, or fitness for duty. Persistent pain or limitation warrants professional review.",
  },
  hydrationLogging: {
    title: "Hydration logging gaps",
    whyItMatters:
      "Logging fluid intake at consistent points supports routine awareness during mission operations.",
    suggestion:
      "Log fluids at a few consistent points in the day. This improves the record; it does not measure hydration status.",
    caution:
      "Astatine cannot assess hydration status, fluid balance, or medical needs. These entries are counts, not volumes.",
  },
  nutritionLogging: {
    title: "Nutrition logging gaps",
    whyItMatters:
      "Meal and snack logs make intake routines visible during long-duration missions without judging them.",
    suggestion:
      "Log meals and snacks as they happen. Astatine does not assess nutritional adequacy or intake.",
    caution:
      "Astatine cannot evaluate nutrition, prescribe a diet, or diagnose a nutritional problem.",
  },
  workloadFatigue: {
    title: "Workload and recovery balance",
    whyItMatters:
      "High workload alongside fatigue can crowd out recovery routines. This is a self-report summary, not a performance assessment.",
    suggestion:
      "If workload and fatigue are both high, consider a lighter optional block and a follow-up check-in. Do not change operational duties on this basis alone.",
    caution:
      "Fatigue has many causes. Astatine cannot assess them or determine fitness for duty.",
  },
};

const COACH_CAVEATS: readonly string[] = [
  "Monitoring support, not diagnosis. Coach suggestions are non-diagnostic and do not establish fitness for duty.",
  "Every coach item is derived from recorded entries only. The simulated trend is illustrative and never feeds these items.",
  "Research links are general program overviews, not clinical guidance for this crew. Astatine does not copy their content.",
  "No suggestion here should be used to change operational duties or safety decisions.",
];

export const COUNTERMEASURE_BASIS =
  "Derived only from the recorded rubric in this readiness view. Simulated telemetry and research links are excluded from scoring.";

const STATUS_LABELS: Record<CountermeasureStatus, string> = {
  "on-track": "On track",
  attention: "Attention",
  "missing-data": "Missing data",
};

const FACTOR_IDS: readonly ReadinessFactorId[] = [
  "checkInAdherence",
  "sleepDuration",
  "sleepRegularity",
  "exerciseAdherence",
  "hydrationLogging",
  "nutritionLogging",
  "workloadFatigue",
];

const STATUSES: readonly ReadinessFactorStatus[] = [
  "supports",
  "mixed",
  "limits",
  "missing",
];

function factorById(
  assessment: ReadinessAssessment,
  id: ReadinessFactorId,
): ReadinessFactor | undefined {
  return assessment.factors.find((factor) => factor.id === id);
}

function statusFor(
  factors: readonly (ReadinessFactor | undefined)[],
): CountermeasureStatus {
  const present = factors.filter(
    (factor): factor is ReadinessFactor => factor !== undefined,
  );
  const scored = present.filter((factor) => factor.score !== null);
  if (scored.length === 0) return "missing-data";
  if (present.length > scored.length) return "attention";
  return scored.some((factor) => (factor.score ?? 0) < 70) ? "attention" : "on-track";
}

function missingFor(factors: readonly (ReadinessFactor | undefined)[]): string | null {
  const reasons = factors
    .map((factor) => factor?.missingReason)
    .filter((reason): reason is string => Boolean(reason));
  return reasons.length > 0 ? reasons.join(" ") : null;
}

function sourcesFor(
  factors: readonly (ReadinessFactor | undefined)[],
  research: CoachResearchContext | null,
): CoachSourceLabel[] {
  const labels = new Map<string, CoachSourceLabel>();
  factors.forEach((factor) => {
    if (factor) {
      labels.set(factor.sourceLabel, { category: "recorded", label: factor.sourceLabel });
    }
  });
  if (research) {
    const label = `${research.publisher} · accessed ${research.accessedAt}`;
    labels.set(label, { category: "research", label });
  }
  return Array.from(labels.values());
}

function buildItem(
  id: CountermeasureCoachItem["id"],
  factors: readonly (ReadinessFactor | undefined)[],
  copy: ItemCopy,
  currentStatus: string,
): CountermeasureCoachItem {
  const status = statusFor(factors);
  const research = researchForCoachDomain(id);
  return {
    id,
    title: copy.title,
    status,
    statusLabel: STATUS_LABELS[status],
    currentStatus,
    whyItMatters: copy.whyItMatters,
    suggestion: copy.suggestion,
    caution: copy.caution,
    sources: sourcesFor(factors, research),
    missingData: missingFor(factors),
    research,
  };
}

function combineValueLabels(factors: readonly (ReadinessFactor | undefined)[]): string {
  const labels = factors
    .filter((factor): factor is ReadinessFactor => factor !== undefined)
    .map((factor) =>
      factor.score === null
        ? `${factor.label.toLowerCase()} unavailable`
        : factor.valueLabel,
    );
  return labels.join("; ");
}

export function buildCountermeasureCoach(
  assessment: ReadinessAssessment,
): CountermeasureCoach {
  const sleepDuration = factorById(assessment, "sleepDuration");
  const sleepRegularity = factorById(assessment, "sleepRegularity");
  const exercise = factorById(assessment, "exerciseAdherence");
  const hydration = factorById(assessment, "hydrationLogging");
  const nutrition = factorById(assessment, "nutritionLogging");
  const workload = factorById(assessment, "workloadFatigue");
  const checkIn = factorById(assessment, "checkInAdherence");

  const items: CountermeasureCoachItem[] = [
    buildItem(
      "exercise",
      [exercise],
      ITEM_COPY.exerciseAdherence,
      exercise && exercise.score !== null
        ? `${exercise.valueLabel}. Compared with the recorded plan, not a physical assessment.`
        : "No paired planned and completed exercise entries in this window.",
    ),
    buildItem(
      "sleep",
      [sleepDuration, sleepRegularity],
      ITEM_COPY.sleepDuration,
      `${combineValueLabels([sleepDuration, sleepRegularity])}.`,
    ),
    buildItem(
      "hydration",
      [hydration],
      ITEM_COPY.hydrationLogging,
      hydration && hydration.score !== null
        ? `${hydration.valueLabel}. Entry counts only; not a measure of hydration status.`
        : "No hydration entries in this window.",
    ),
    buildItem(
      "nutrition",
      [nutrition],
      ITEM_COPY.nutritionLogging,
      nutrition && nutrition.score !== null
        ? `${nutrition.valueLabel}. Entry counts only; not a nutritional assessment.`
        : "No nutrition entries in this window.",
    ),
    buildItem(
      "workload",
      [workload],
      ITEM_COPY.workloadFatigue,
      workload && workload.score !== null
        ? `${workload.valueLabel}. Self-report summary, not a clinical severity rating.`
        : "No fatigue self-report in this window.",
    ),
    buildItem(
      "checkIn",
      [checkIn],
      ITEM_COPY.checkInAdherence,
      checkIn && checkIn.score !== null
        ? `${checkIn.valueLabel} recorded in the window.`
        : "No check-ins in this window.",
    ),
  ];

  const attention = items.filter((item) => item.status === "attention").length;
  const gaps = items.filter((item) => item.status === "missing-data").length;
  const researchUsed = items.some((item) => item.research !== null);

  return {
    generatedFor: assessment.inputs.observedAt,
    windowDays: assessment.inputs.windowDays,
    items,
    summary: `Readiness is ${READINESS_BAND_LABELS[assessment.band]} for the ${
      assessment.inputs.windowDays
    }-day window. ${attention} of ${items.length} coach areas need attention and ${gaps} ${
      gaps === 1 ? "area has" : "areas have"
    } no usable recorded data.`,
    researchNote: COACH_RESEARCH_NOTE,
    caveats: [...COACH_CAVEATS],
    dataClasses: researchUsed ? ["recorded", "research"] : ["recorded"],
  };
}

function planSuggestion(
  factor: ReadinessFactor,
  priority: CountermeasureSuggestion["priority"],
  maintenance: boolean,
): CountermeasureSuggestion {
  const copy = ITEM_COPY[factor.id];
  return {
    id: `countermeasure.${factor.id}`,
    factorId: factor.id,
    title: maintenance ? "Maintain current routines" : copy.title,
    rationale: maintenance
      ? `All scored rubric inputs are at or above 70. The lowest, ${factor.label.toLowerCase()}, is ${factor.score}/100 (${factor.valueLabel}). No change is indicated by this rubric.`
      : `${factor.label} is ${factor.score}/100 (${factor.valueLabel}), below the rubric's 70-point maintenance line. ${copy.suggestion}`,
    caution: copy.caution,
    priority,
    trigger: {
      label: factor.label,
      score: factor.score,
      status: factor.status,
    },
  };
}

export function buildCountermeasurePlan(
  assessment: ReadinessAssessment,
): CountermeasurePlan {
  const ranked = assessment.factors
    .filter((factor) => factor.score !== null)
    .sort((left, right) => {
      if (left.affectsBand !== right.affectsBand) return left.affectsBand ? -1 : 1;
      return (left.score ?? 0) - (right.score ?? 0);
    });
  const belowThreshold = ranked.filter((factor) => (factor.score ?? 0) < 70);
  const targets =
    belowThreshold.length > 0 ? belowThreshold.slice(0, 2) : ranked.slice(0, 1);

  return {
    suggestions: targets.map((factor, index) =>
      planSuggestion(
        factor,
        index === 0 ? "primary" : "supporting",
        belowThreshold.length === 0,
      ),
    ),
    basis: COUNTERMEASURE_BASIS,
    caveats: [...COACH_CAVEATS],
    dataClasses: ["recorded"],
  };
}

function isFiniteScore(value: unknown): boolean {
  return (
    typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100
  );
}

export function isCountermeasurePlan(value: unknown): value is CountermeasurePlan {
  if (!isPlainObject(value)) return false;
  if (!Array.isArray(value.suggestions) || value.suggestions.length === 0) {
    return false;
  }

  const suggestionsValid = value.suggestions.every((suggestion) => {
    if (!isPlainObject(suggestion) || !isPlainObject(suggestion.trigger)) {
      return false;
    }

    return (
      isNonEmptyString(suggestion.id, 120) &&
      typeof suggestion.factorId === "string" &&
      FACTOR_IDS.includes(suggestion.factorId as ReadinessFactorId) &&
      isNonEmptyString(suggestion.title, 160) &&
      isNonEmptyString(suggestion.rationale, 800) &&
      isNonEmptyString(suggestion.caution, 800) &&
      (suggestion.priority === "primary" || suggestion.priority === "supporting") &&
      isNonEmptyString(suggestion.trigger.label, 80) &&
      (suggestion.trigger.score === null || isFiniteScore(suggestion.trigger.score)) &&
      typeof suggestion.trigger.status === "string" &&
      STATUSES.includes(suggestion.trigger.status as ReadinessFactorStatus)
    );
  });
  if (!suggestionsValid) return false;

  return (
    isNonEmptyString(value.basis, 500) &&
    Array.isArray(value.caveats) &&
    value.caveats.every((caveat) => isNonEmptyString(caveat, 500)) &&
    Array.isArray(value.dataClasses) &&
    value.dataClasses.length === 1 &&
    value.dataClasses[0] === "recorded"
  );
}
