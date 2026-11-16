import {
  isFiniteNumber,
  isIsoTimestamp,
  isNonEmptyString,
  isPlainObject,
} from "@/lib/validation";
import type {
  MissionPhaseDefinition,
  MissionPlan,
  MissionTimeline,
  MissionTimelinePhase,
  ValidationIssue,
  ValidationResult,
} from "@/types/health";

const MINUTE_MS = 60_000;

export function validateMissionPlan(input: unknown): ValidationResult<MissionPlan> {
  if (!isPlainObject(input)) {
    return {
      ok: false,
      issues: [{ field: "plan", message: "A mission plan is required." }],
    };
  }

  const issues: ValidationIssue[] = [];
  if (!isNonEmptyString(input.id, 80)) {
    issues.push({ field: "id", message: "Mission id is required." });
  }
  if (!isNonEmptyString(input.name, 120)) {
    issues.push({ field: "name", message: "Mission name is required." });
  }
  if (!isIsoTimestamp(input.startAt)) {
    issues.push({
      field: "startAt",
      message: "Mission start must be a valid timestamp.",
    });
  }
  if (input.label !== "simulated") {
    issues.push({ field: "label", message: "Mission plans must be labeled simulated." });
  }
  if (!Array.isArray(input.phases) || input.phases.length === 0) {
    issues.push({ field: "phases", message: "At least one mission phase is required." });
  } else {
    const ids = new Set<string>();
    input.phases.forEach((phase: unknown, index: number) => {
      if (!isPlainObject(phase)) {
        issues.push({
          field: `phases.${index}`,
          message: "Each mission phase must be an object.",
        });
        return;
      }
      if (!isNonEmptyString(phase.id, 80)) {
        issues.push({
          field: `phases.${index}.id`,
          message: "Phase id is required.",
        });
      } else if (ids.has(phase.id)) {
        issues.push({
          field: `phases.${index}.id`,
          message: "Phase ids must be unique.",
        });
      } else {
        ids.add(phase.id);
      }
      if (!isNonEmptyString(phase.label, 120)) {
        issues.push({
          field: `phases.${index}.label`,
          message: "Phase label is required.",
        });
      }
      if (
        !isFiniteNumber(phase.durationMinutes) ||
        !Number.isInteger(phase.durationMinutes) ||
        phase.durationMinutes <= 0
      ) {
        issues.push({
          field: `phases.${index}.durationMinutes`,
          message: "Phase duration must be a positive whole number of minutes.",
        });
      }
      if (!isNonEmptyString(phase.summary, 500)) {
        issues.push({
          field: `phases.${index}.summary`,
          message: "Phase summary is required.",
        });
      }
    });
  }

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    value: {
      id: input.id as string,
      name: input.name as string,
      startAt: input.startAt as string,
      label: "simulated",
      phases: input.phases as MissionPhaseDefinition[],
    },
  };
}

export function buildMissionTimeline(plan: MissionPlan, now: string): MissionTimeline {
  const nowMs = Date.parse(now);
  const startMs = Date.parse(plan.startAt);
  if (!Number.isFinite(nowMs) || !Number.isFinite(startMs)) {
    throw new RangeError("Mission timeline requires valid start and current timestamps.");
  }

  const totalMinutes = plan.phases.reduce(
    (total, phase) => total + phase.durationMinutes,
    0,
  );
  let cursorMs = startMs;
  let currentPhaseId: string | null = null;

  const phases: MissionTimelinePhase[] = plan.phases.map((phase) => {
    const startsAtMs = cursorMs;
    const endsAtMs = startsAtMs + phase.durationMinutes * MINUTE_MS;
    cursorMs = endsAtMs;

    const status =
      nowMs < startsAtMs ? "upcoming" : nowMs >= endsAtMs ? "complete" : "active";
    if (status === "active") currentPhaseId = phase.id;

    const phaseProgress =
      status === "complete"
        ? 100
        : status === "upcoming"
          ? 0
          : Math.round(((nowMs - startsAtMs) / (endsAtMs - startsAtMs)) * 1000) / 10;

    return {
      ...phase,
      startsAt: new Date(startsAtMs).toISOString(),
      endsAt: new Date(endsAtMs).toISOString(),
      status,
      progress: phaseProgress,
    };
  });

  const elapsedMinutes = Math.min(
    totalMinutes,
    Math.max(0, Math.round(((nowMs - startMs) / MINUTE_MS) * 10) / 10),
  );

  return {
    missionId: plan.id,
    name: plan.name,
    label: "simulated",
    phases,
    currentPhaseId,
    elapsedMinutes,
    totalMinutes,
    progress:
      totalMinutes === 0 ? 0 : Math.round((elapsedMinutes / totalMinutes) * 1000) / 10,
  };
}
