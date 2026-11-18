import type {
  CheckInRecord,
  CountermeasurePlan,
  ReadinessAssessment,
  ReportSnapshotDraft,
} from "@/types/health";

export const REPORT_SCOPE_NOTE =
  "Derived only from recorded check-ins. Simulated telemetry and research context are excluded.";

export interface BuildReportSnapshotOptions {
  checkIn: CheckInRecord;
  readiness: ReadinessAssessment;
  countermeasures: CountermeasurePlan;
  generatedAt: string;
  title?: string;
}

export function buildReportSnapshotDraft({
  checkIn,
  readiness,
  countermeasures,
  generatedAt,
  title,
}: BuildReportSnapshotOptions): ReportSnapshotDraft {
  if (readiness.inputs.checkInId !== checkIn.id) {
    throw new Error("Readiness assessment does not match the check-in in this report.");
  }
  if (!Number.isFinite(Date.parse(generatedAt))) {
    throw new RangeError("Report generation time must be a valid timestamp.");
  }

  const caveats = Array.from(
    new Set([...readiness.caveats, ...countermeasures.caveats, REPORT_SCOPE_NOTE]),
  );

  return {
    title: title ?? `Local check-in snapshot · ${generatedAt.slice(0, 10)}`,
    generatedAt,
    checkInId: checkIn.id,
    observation: {
      observedAt: checkIn.observedAt,
      sleepHours: checkIn.sleepHours,
      sleepQuality: checkIn.sleepQuality,
      fatigue: checkIn.fatigue,
      mood: checkIn.mood,
      soreness: checkIn.soreness,
      stress: checkIn.stress,
      hydration: checkIn.hydration,
      sourceLabel: checkIn.source.label,
    },
    readiness,
    countermeasures,
    caveats,
    missingData: [...readiness.missingData],
    dataClasses: ["recorded"],
  };
}
