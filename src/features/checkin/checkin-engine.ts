import {
  CHECK_IN_SCALE_FIELDS,
  isFiniteNumber,
  isIsoTimestamp,
  isPlainObject,
  isScaleValue,
} from "@/lib/validation";
import type {
  CheckInDraft,
  CheckInRecord,
  CheckInScaleField,
  ScaleValue,
  ValidationIssue,
  ValidationResult,
} from "@/types/health";

export interface CheckInFieldDefinition {
  id: CheckInScaleField;
  label: string;
  hint: string;
  higherIsBetter: boolean;
  options: readonly { value: ScaleValue; label: string }[];
}

export const CHECK_IN_FIELDS: readonly CheckInFieldDefinition[] = [
  {
    id: "sleepQuality",
    label: "Sleep quality",
    hint: "Self-rated quality of the previous sleep period.",
    higherIsBetter: true,
    options: [
      { value: 1, label: "Very poor" },
      { value: 2, label: "Poor" },
      { value: 3, label: "Fair" },
      { value: 4, label: "Good" },
      { value: 5, label: "Very good" },
    ],
  },
  {
    id: "fatigue",
    label: "Fatigue",
    hint: "How much fatigue you notice right now, from very low to very high.",
    higherIsBetter: false,
    options: [
      { value: 1, label: "Very low" },
      { value: 2, label: "Low" },
      { value: 3, label: "Moderate" },
      { value: 4, label: "High" },
      { value: 5, label: "Very high" },
    ],
  },
  {
    id: "mood",
    label: "Mood",
    hint: "Your general mood right now. There is no correct answer.",
    higherIsBetter: true,
    options: [
      { value: 1, label: "Very low" },
      { value: 2, label: "Low" },
      { value: 3, label: "Neutral" },
      { value: 4, label: "Good" },
      { value: 5, label: "Very good" },
    ],
  },
  {
    id: "soreness",
    label: "Soreness",
    hint: "Self-rated muscle or joint soreness, not a clinical measure.",
    higherIsBetter: false,
    options: [
      { value: 1, label: "None" },
      { value: 2, label: "Mild" },
      { value: 3, label: "Moderate" },
      { value: 4, label: "High" },
      { value: 5, label: "Very high" },
    ],
  },
  {
    id: "stress",
    label: "Stress",
    hint: "How much pressure or tension you notice right now.",
    higherIsBetter: false,
    options: [
      { value: 1, label: "Very low" },
      { value: 2, label: "Low" },
      { value: 3, label: "Moderate" },
      { value: 4, label: "High" },
      { value: 5, label: "Very high" },
    ],
  },
  {
    id: "hydration",
    label: "Hydration",
    hint: "Your self-rating only. Astatine does not measure hydration.",
    higherIsBetter: true,
    options: [
      { value: 1, label: "Very poor" },
      { value: 2, label: "Poor" },
      { value: 3, label: "Fair" },
      { value: 4, label: "Good" },
      { value: 5, label: "Very good" },
    ],
  },
];

export const WORKLOAD_OPTIONS: readonly { value: ScaleValue; label: string }[] = [
  { value: 1, label: "Very low" },
  { value: 2, label: "Low" },
  { value: 3, label: "Moderate" },
  { value: 4, label: "High" },
  { value: 5, label: "Very high" },
];

export const DEFAULT_CHECK_IN_VALUES = {
  sleepHours: 7.5,
  sleepQuality: 3,
  fatigue: 3,
  mood: 3,
  soreness: 2,
  stress: 2,
  hydration: 3,
} as const satisfies Omit<CheckInDraft, "observedAt">;

export function checkInField(
  field: CheckInScaleField,
): CheckInFieldDefinition | undefined {
  return CHECK_IN_FIELDS.find((definition) => definition.id === field);
}

export function validateCheckInDraft(input: unknown): ValidationResult<CheckInDraft> {
  if (!isPlainObject(input)) {
    return {
      ok: false,
      issues: [{ field: "form", message: "A complete check-in is required." }],
    };
  }

  const issues: ValidationIssue[] = [];

  if (!isIsoTimestamp(input.observedAt)) {
    issues.push({
      field: "observedAt",
      message: "Choose a valid observation time.",
    });
  }

  if (!isFiniteNumber(input.sleepHours)) {
    issues.push({ field: "sleepHours", message: "Enter sleep duration in hours." });
  } else if (input.sleepHours < 0 || input.sleepHours > 16) {
    issues.push({
      field: "sleepHours",
      message: "Sleep duration must be between 0 and 16 hours.",
    });
  }

  for (const field of CHECK_IN_SCALE_FIELDS) {
    if (!isScaleValue(input[field])) {
      issues.push({
        field,
        message: `${checkInField(field)?.label ?? field} must be rated from 1 to 5.`,
      });
    }
  }

  if (input.workload !== undefined && !isScaleValue(input.workload)) {
    issues.push({ field: "workload", message: "Workload must be rated from 1 to 5." });
  }

  validateOptionalMinutes(input, "exercisePlannedMinutes", "Planned exercise", issues);
  validateOptionalMinutes(
    input,
    "exerciseCompletedMinutes",
    "Completed exercise",
    issues,
  );

  for (const [field, label] of [
    ["hydrationEntries", "Hydration entries"],
    ["nutritionEntries", "Nutrition entries"],
  ] as const) {
    const value = input[field];
    if (value !== undefined && !isEntryCount(value)) {
      issues.push({ field, message: `${label} must be a whole number from 0 to 20.` });
    }
  }

  if (issues.length > 0) return { ok: false, issues };

  const draft: CheckInDraft = {
    observedAt: input.observedAt as string,
    sleepHours: input.sleepHours as number,
    sleepQuality: input.sleepQuality as ScaleValue,
    fatigue: input.fatigue as ScaleValue,
    mood: input.mood as ScaleValue,
    soreness: input.soreness as ScaleValue,
    stress: input.stress as ScaleValue,
    hydration: input.hydration as ScaleValue,
  };

  if (isScaleValue(input.workload)) draft.workload = input.workload;
  if (typeof input.exercisePlannedMinutes === "number") {
    draft.exercisePlannedMinutes = input.exercisePlannedMinutes;
  }
  if (typeof input.exerciseCompletedMinutes === "number") {
    draft.exerciseCompletedMinutes = input.exerciseCompletedMinutes;
  }
  if (typeof input.hydrationEntries === "number") {
    draft.hydrationEntries = input.hydrationEntries;
  }
  if (typeof input.nutritionEntries === "number") {
    draft.nutritionEntries = input.nutritionEntries;
  }

  return { ok: true, value: draft };
}

function isEntryCount(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 20
  );
}

function validateOptionalMinutes(
  input: Record<string, unknown>,
  field: "exercisePlannedMinutes" | "exerciseCompletedMinutes",
  label: string,
  issues: ValidationIssue[],
): void {
  const value = input[field];
  if (value === undefined) return;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 480) {
    issues.push({
      field,
      message: `${label} must be a whole number of minutes from 0 to 480.`,
    });
  }
}

export function createCheckInRecord(
  draft: CheckInDraft,
  options: { id: string; now: string },
): CheckInRecord {
  return {
    id: options.id,
    ...draft,
    createdAt: options.now,
    updatedAt: options.now,
    source: {
      category: "recorded",
      origin: "crew-entry",
      label: "Crew-entered check-in",
    },
  };
}
