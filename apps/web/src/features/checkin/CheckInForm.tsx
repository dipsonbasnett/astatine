import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InlineAlert } from "@/components/ui/InlineAlert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDateTime } from "@/lib/format";
import { useAppStore } from "@/state/app-store";
import type { CheckInDraft, CheckInRecord, ScaleValue } from "@/types/health";

import {
  CHECK_IN_FIELDS,
  DEFAULT_CHECK_IN_VALUES,
  WORKLOAD_OPTIONS,
  validateCheckInDraft,
} from "./checkin-engine";
import { createCheckIn } from "./checkin-repository";

interface FormValues {
  sleepHours: string;
  sleepQuality: string;
  fatigue: string;
  mood: string;
  soreness: string;
  stress: string;
  hydration: string;
  workload: string;
  exercisePlannedMinutes: string;
  exerciseCompletedMinutes: string;
  hydrationEntries: string;
  nutritionEntries: string;
}

const INITIAL_VALUES: FormValues = {
  sleepHours: String(DEFAULT_CHECK_IN_VALUES.sleepHours),
  sleepQuality: String(DEFAULT_CHECK_IN_VALUES.sleepQuality),
  fatigue: String(DEFAULT_CHECK_IN_VALUES.fatigue),
  mood: String(DEFAULT_CHECK_IN_VALUES.mood),
  soreness: String(DEFAULT_CHECK_IN_VALUES.soreness),
  stress: String(DEFAULT_CHECK_IN_VALUES.stress),
  hydration: String(DEFAULT_CHECK_IN_VALUES.hydration),
  workload: "",
  exercisePlannedMinutes: "",
  exerciseCompletedMinutes: "",
  hydrationEntries: "",
  nutritionEntries: "",
};

function optionalNumber(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

export function CheckInForm() {
  const refreshData = useAppStore((state) => state.refreshData);
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<CheckInRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const focusFirstInvalid = () => {
    window.requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  };

  const updateValue =
    (field: keyof FormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((current) => ({ ...current, [field]: event.target.value }));
      setFieldErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(null);
    setError(null);

    if (values.sleepHours.trim() === "") {
      setFieldErrors({ sleepHours: "Enter sleep duration in hours." });
      setError("Check the highlighted fields. Nothing was saved.");
      focusFirstInvalid();
      return;
    }

    const draft: CheckInDraft = {
      observedAt: new Date().toISOString(),
      sleepHours: Number(values.sleepHours),
      sleepQuality: Number(values.sleepQuality) as ScaleValue,
      fatigue: Number(values.fatigue) as ScaleValue,
      mood: Number(values.mood) as ScaleValue,
      soreness: Number(values.soreness) as ScaleValue,
      stress: Number(values.stress) as ScaleValue,
      hydration: Number(values.hydration) as ScaleValue,
    };

    if (values.workload !== "") draft.workload = Number(values.workload) as ScaleValue;
    const plannedMinutes = optionalNumber(values.exercisePlannedMinutes);
    const completedMinutes = optionalNumber(values.exerciseCompletedMinutes);
    const hydrationEntries = optionalNumber(values.hydrationEntries);
    const nutritionEntries = optionalNumber(values.nutritionEntries);
    if (plannedMinutes !== undefined) draft.exercisePlannedMinutes = plannedMinutes;
    if (completedMinutes !== undefined) {
      draft.exerciseCompletedMinutes = completedMinutes;
    }
    if (hydrationEntries !== undefined) draft.hydrationEntries = hydrationEntries;
    if (nutritionEntries !== undefined) draft.nutritionEntries = nutritionEntries;

    const validation = validateCheckInDraft(draft);
    if (!validation.ok) {
      setFieldErrors(
        Object.fromEntries(
          validation.issues.map((issue) => [issue.field, issue.message]),
        ),
      );
      setError("Check the highlighted fields. Nothing was saved.");
      focusFirstInvalid();
      return;
    }

    setSaving(true);
    try {
      const record = await createCheckIn(validation.value);
      setSaved(record);
      setFieldErrors({});
      refreshData();
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The check-in could not be saved in this browser.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-prose">
          <p className="font-mono text-label text-ink-subtle uppercase">Recorded data</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
            Record a check-in
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Six self-ratings, one sleep-duration observation, and optional daily-practice
            entries, saved only in this browser. There is no sensor capture and no
            automatic upload.
          </p>
        </div>
        <Badge tone="accent">Recorded</Badge>
      </div>

      {saved && (
        <InlineAlert
          tone="success"
          title="Check-in saved in this browser"
          className="mt-6"
        >
          <p>
            Recorded at {formatDateTime(saved.observedAt)}. Readiness now uses this
            self-report.
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <Link
              to="/readiness"
              className="text-accent underline underline-offset-4 hover:text-accent-strong"
            >
              Review recovery readiness
            </Link>
            <Link
              to="/reports"
              className="text-accent underline underline-offset-4 hover:text-accent-strong"
            >
              Create a local report snapshot
            </Link>
          </p>
        </InlineAlert>
      )}

      {error && (
        <InlineAlert tone="danger" title="Check-in not saved" className="mt-6">
          <p>{error}</p>
        </InlineAlert>
      )}

      <form ref={formRef} className="mt-6 space-y-6" noValidate onSubmit={handleSubmit}>
        <Input
          label="Sleep duration (hours)"
          hint="Self-reported duration of the previous sleep period. Stored as context, not a clinical measure."
          type="number"
          inputMode="decimal"
          min={0}
          max={16}
          step={0.25}
          value={values.sleepHours}
          error={fieldErrors.sleepHours}
          onChange={updateValue("sleepHours")}
        />

        <fieldset className="space-y-4 rounded-control border border-line p-4 sm:p-5">
          <legend className="px-1 text-sm font-medium text-ink">
            Self-rated factors
          </legend>
          <p className="text-sm leading-6 text-ink-muted">
            Rate each item from 1 to 5. These are personal observations with no correct
            answer.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            {CHECK_IN_FIELDS.map((field) => (
              <Select
                key={field.id}
                label={field.label}
                hint={field.hint}
                value={values[field.id]}
                error={fieldErrors[field.id]}
                onChange={updateValue(field.id)}
              >
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.value} · {option.label}
                  </option>
                ))}
              </Select>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-control border border-line p-4 sm:p-5">
          <legend className="px-1 text-sm font-medium text-ink">
            Daily practices (optional)
          </legend>
          <p className="text-sm leading-6 text-ink-muted">
            These entries improve the readiness view and the countermeasure coach. Leaving
            a field blank is recorded as missing data, not as zero.
          </p>
          <div className="grid gap-5 md:grid-cols-2">
            <Select
              label="Workload"
              hint="Optional self-rating of today's task demand. Self-report only."
              value={values.workload}
              error={fieldErrors.workload}
              onChange={updateValue("workload")}
            >
              <option value="">Not recorded</option>
              {WORKLOAD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value} · {option.label}
                </option>
              ))}
            </Select>
            <Input
              label="Planned exercise (minutes)"
              hint="Optional planned movement for today. Used to describe adherence, not fitness."
              type="number"
              inputMode="numeric"
              min={0}
              max={480}
              step={5}
              value={values.exercisePlannedMinutes}
              error={fieldErrors.exercisePlannedMinutes}
              onChange={updateValue("exercisePlannedMinutes")}
            />
            <Input
              label="Completed exercise (minutes)"
              hint="Optional completed movement for today. Self-report only."
              type="number"
              inputMode="numeric"
              min={0}
              max={480}
              step={5}
              value={values.exerciseCompletedMinutes}
              error={fieldErrors.exerciseCompletedMinutes}
              onChange={updateValue("exerciseCompletedMinutes")}
            />
            <Input
              label="Hydration log entries"
              hint="Optional count of times you logged fluids today. This measures logging, not fluid balance."
              type="number"
              inputMode="numeric"
              min={0}
              max={20}
              step={1}
              value={values.hydrationEntries}
              error={fieldErrors.hydrationEntries}
              onChange={updateValue("hydrationEntries")}
            />
            <Input
              label="Nutrition log entries"
              hint="Optional count of meals or snacks logged today. This measures logging, not nutrition status."
              type="number"
              inputMode="numeric"
              min={0}
              max={20}
              step={1}
              value={values.nutritionEntries}
              error={fieldErrors.nutritionEntries}
              onChange={updateValue("nutritionEntries")}
            />
          </div>
        </fieldset>

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-prose text-xs leading-5 text-ink-subtle">
            This is not a medical record or a fitness-for-duty assessment. Nothing is
            uploaded.
          </p>
          <Button type="submit" disabled={saving} className="shrink-0">
            {saving ? "Saving…" : "Save check-in"}
          </Button>
        </div>
      </form>

      <p className="mt-5 text-xs leading-5 text-ink-subtle">
        Need the full local-data controls?{" "}
        <Link
          to="/settings"
          className="text-accent underline underline-offset-4 hover:text-accent-strong"
        >
          Review, export, or delete data
        </Link>
        .
      </p>
    </Card>
  );
}
