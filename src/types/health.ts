import type { DataCategory } from "@/lib/data-policy";

export type ScaleValue = 1 | 2 | 3 | 4 | 5;

export type CheckInScaleField =
  "sleepQuality" | "fatigue" | "mood" | "soreness" | "stress" | "hydration";

export interface ValidationIssue {
  field: string;
  message: string;
}

export type ValidationResult<T> =
  { ok: true; value: T } | { ok: false; issues: ValidationIssue[] };

export interface RecordEnvelope {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordedSource {
  category: Extract<DataCategory, "recorded">;
  origin: "crew-entry" | "derived";
  label: string;
  derivedFrom?: string[];
}

export interface SimulatedSource {
  category: Extract<DataCategory, "simulated">;
  origin: "generator";
  label: string;
  generator: string;
  generatorVersion: number;
  scenarioId: string;
  seed: number;
}

export interface ResearchSource {
  category: Extract<DataCategory, "research">;
  origin: "external";
  label: string;
  publisher: string;
  url: string;
  accessedAt: string;
  license?: string;
}

export type SourceMetadata = RecordedSource | SimulatedSource | ResearchSource;

export interface CheckInValues {
  sleepHours: number;
  sleepQuality: ScaleValue;
  fatigue: ScaleValue;
  mood: ScaleValue;
  soreness: ScaleValue;
  stress: ScaleValue;
  hydration: ScaleValue;
}

export interface DailyPracticeValues {
  workload?: ScaleValue;
  exercisePlannedMinutes?: number;
  exerciseCompletedMinutes?: number;
  hydrationEntries?: number;
  nutritionEntries?: number;
}

export interface CheckInDraft extends CheckInValues, DailyPracticeValues {
  observedAt: string;
}

export interface CheckInRecord extends RecordEnvelope, CheckInDraft {
  source: RecordedSource & { origin: "crew-entry" };
}

export type TelemetryChannel = "heartRate" | "respiratoryRate" | "skinTemperature";

export interface TelemetrySampleDraft {
  scenarioId: string;
  channel: TelemetryChannel;
  capturedAt: string;
  value: number;
  unit: string;
  signalQuality: number;
  source: SimulatedSource;
}

export interface TelemetrySampleRecord extends RecordEnvelope, TelemetrySampleDraft {
  source: SimulatedSource & { origin: "generator" };
}

export type ReadinessBand = "ready" | "monitor" | "rest" | "insufficient";
export type ReadinessFactorStatus = "supports" | "mixed" | "limits" | "missing";
export type ConfidenceLevel = "low" | "moderate" | "high";

export type ReadinessFactorId =
  | "checkInAdherence"
  | "sleepDuration"
  | "sleepRegularity"
  | "exerciseAdherence"
  | "hydrationLogging"
  | "nutritionLogging"
  | "workloadFatigue";

export interface ReadinessFactor {
  id: ReadinessFactorId;
  label: string;
  category: "recorded";
  sourceLabel: string;
  status: ReadinessFactorStatus;
  score: number | null;
  weight: number;
  affectsBand: boolean;
  valueLabel: string;
  explanation: string;
  missingReason?: string;
}

export interface ReadinessAction {
  id: string;
  title: string;
  detail: string;
  sourceLabel: string;
  priority: "primary" | "supporting";
}

export interface ReadinessConfidence {
  level: ConfidenceLevel;
  coverage: number;
  reasons: string[];
}

export interface ReadinessInputs {
  checkInId: string;
  observedAt: string;
  ageHours: number;
  checkInsInWindow: number;
  windowDays: number;
  formula: string;
}

export interface ReadinessAssessment {
  band: ReadinessBand;
  averageScore: number | null;
  coverage: number;
  factors: ReadinessFactor[];
  confidence: ReadinessConfidence;
  inputs: ReadinessInputs;
  missingData: string[];
  explanation: string;
  actions: ReadinessAction[];
  escalation: string[];
  caveats: string[];
  dataClasses: readonly ["recorded"];
}

export interface SimulatedTrendPoint {
  dayOffset: number;
  label: string;
  value: number;
}

export interface SimulatedRecoveryTrend {
  label: string;
  source: SimulatedSource;
  points: SimulatedTrendPoint[];
  note: string;
  affectsReadinessBand: false;
}

export type CountermeasureStatus = "on-track" | "attention" | "missing-data";

export interface CountermeasureTrigger {
  label: string;
  score: number | null;
  status: ReadinessFactorStatus;
}

export interface CountermeasureSuggestion {
  id: string;
  factorId: ReadinessFactorId;
  title: string;
  rationale: string;
  caution: string;
  priority: "primary" | "supporting";
  trigger: CountermeasureTrigger;
}

export interface CountermeasurePlan {
  suggestions: CountermeasureSuggestion[];
  basis: string;
  caveats: string[];
  dataClasses: readonly ["recorded"];
}

export type CoachDomain =
  "exercise" | "sleep" | "hydration" | "nutrition" | "workload" | "checkIn";

export interface CoachSourceLabel {
  category: "recorded" | "simulated" | "research";
  label: string;
}

export interface CoachResearchContext {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessedAt: string;
  claim: string;
  limitations: string;
}

export interface CountermeasureCoachItem {
  id: CoachDomain;
  title: string;
  status: CountermeasureStatus;
  statusLabel: string;
  currentStatus: string;
  whyItMatters: string;
  suggestion: string;
  caution: string;
  sources: CoachSourceLabel[];
  missingData: string | null;
  research: CoachResearchContext | null;
}

export interface CountermeasureCoach {
  generatedFor: string;
  windowDays: number;
  items: CountermeasureCoachItem[];
  summary: string;
  researchNote: string;
  caveats: string[];
  dataClasses: readonly ("recorded" | "research")[];
}

export interface ReportObservation extends CheckInValues {
  observedAt: string;
  sourceLabel: string;
}

export interface ReportSnapshotDraft {
  title: string;
  generatedAt: string;
  checkInId: string;
  observation: ReportObservation;
  readiness: ReadinessAssessment;
  countermeasures: CountermeasurePlan;
  caveats: string[];
  missingData: string[];
  dataClasses: readonly ["recorded"];
}

export interface ReportSnapshotRecord extends RecordEnvelope, ReportSnapshotDraft {
  source: RecordedSource & { origin: "derived"; derivedFrom: string[] };
}

export type ResearchKind = "program" | "dataset" | "publication";

export interface ResearchEntry {
  id: string;
  title: string;
  publisher: string;
  url: string;
  accessedAt: string;
  kind: ResearchKind;
  summary: string;
  topics: readonly string[];
  source: ResearchSource;
}

export interface ResearchContext {
  entries: ResearchEntry[];
  note: string;
}

export type DatasetPrivacyStatus =
  | "open-public"
  | "de-identified-public"
  | "credentialed-access"
  | "restricted-not-approved";

export type DatasetIdentifierType = "doi" | "persistent" | "accession";

export type DatasetIdentifier =
  | { type: DatasetIdentifierType; value: string; url: string }
  | { type: "unavailable"; reason: string };

export interface DatasetChecksum {
  algorithm: "sha256";
  value: string;
  manifestUrl?: string;
}

export interface DatasetPrivacyReview {
  reviewedAt: string;
  reviewReference: string;
  lawfulBasis?: string;
}

export interface DatasetSourceVerification {
  verifiedAt: string;
  verifiedBy: string;
  officialSource: boolean;
  licenseTerms: boolean;
  citation: boolean;
  checksum: boolean;
  privacy: boolean;
}

export type DatasetModelTraining =
  | { status: "not-used" }
  | {
      status: "used";
      evidenceUrl: string;
      documentedAt: string;
      modelIds: readonly string[];
    };

export interface DatasetProvenance {
  category: "research";
  id: string;
  title: string;
  creator: string;
  officialSourceUrl: string;
  licenseName: string;
  licenseUrl: string;
  citation: string;
  identifier: DatasetIdentifier;
  fileChecksum: DatasetChecksum;
  ingestedAt: string;
  intendedUse: string;
  limitations: string;
  privacyStatus: DatasetPrivacyStatus;
  containsHumanData: boolean;
  privacyReview: DatasetPrivacyReview;
  attributionRequirements: readonly string[];
  modelTraining: DatasetModelTraining;
  sourceVerification: DatasetSourceVerification;
}

export interface MissionPhaseDefinition {
  id: string;
  label: string;
  durationMinutes: number;
  summary: string;
}

export interface MissionPlan {
  id: string;
  name: string;
  startAt: string;
  phases: readonly MissionPhaseDefinition[];
  label: "simulated";
}

export type MissionPhaseStatus = "upcoming" | "active" | "complete";

export interface MissionTimelinePhase extends MissionPhaseDefinition {
  startsAt: string;
  endsAt: string;
  status: MissionPhaseStatus;
  progress: number;
}

export interface MissionTimeline {
  missionId: string;
  name: string;
  label: "simulated";
  phases: MissionTimelinePhase[];
  currentPhaseId: string | null;
  elapsedMinutes: number;
  totalMinutes: number;
  progress: number;
}
