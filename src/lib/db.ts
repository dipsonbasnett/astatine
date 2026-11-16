import Dexie, { type Table } from "dexie";

import type {
  CheckInRecord,
  ReportSnapshotRecord,
  TelemetrySampleRecord,
} from "@/types/health";

export const DATABASE_NAME = "astatine";
export const DATABASE_SCHEMA_VERSION = 2;

export type DataErrorCode =
  "unavailable" | "blocked" | "quota" | "validation" | "version" | "unknown";

export class DataLayerError extends Error {
  readonly code: DataErrorCode;
  readonly detail?: string;

  constructor(code: DataErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "DataLayerError";
    this.code = code;
    this.detail = options?.cause instanceof Error ? options.cause.message : undefined;
  }
}

const USER_MESSAGES: Record<DataErrorCode, string> = {
  unavailable: "Local browser storage is unavailable in this context.",
  blocked: "Local storage is blocked by another tab or browser setting.",
  quota: "This browser has no room left for local health records.",
  validation: "The record did not pass local validation and was not saved.",
  version: "This browser holds a newer local database version than this build supports.",
  unknown: "Local health records could not be read or written in this browser.",
};

export function toDataLayerError(error: unknown): DataLayerError {
  if (error instanceof DataLayerError) return error;

  if (typeof indexedDB === "undefined") {
    return new DataLayerError("unavailable", USER_MESSAGES.unavailable, {
      cause: error,
    });
  }

  const name = error instanceof Error ? error.name : "";
  const message = error instanceof Error ? error.message : String(error);

  if (name === "QuotaExceededError" || /quota/i.test(message)) {
    return new DataLayerError("quota", USER_MESSAGES.quota, { cause: error });
  }

  if (name === "VersionError") {
    return new DataLayerError("version", USER_MESSAGES.version, { cause: error });
  }

  if (name === "MissingAPIError" || name === "InvalidStateError") {
    return new DataLayerError("unavailable", USER_MESSAGES.unavailable, {
      cause: error,
    });
  }

  if (/blocked/i.test(name) || /blocked/i.test(message)) {
    return new DataLayerError("blocked", USER_MESSAGES.blocked, { cause: error });
  }

  return new DataLayerError("unknown", USER_MESSAGES.unknown, { cause: error });
}

export function createRecordId(): string {
  return crypto.randomUUID();
}

export class AstatineDatabase extends Dexie {
  checkIns!: Table<CheckInRecord, string>;
  telemetrySamples!: Table<TelemetrySampleRecord, string>;
  reportSnapshots!: Table<ReportSnapshotRecord, string>;

  constructor(name = DATABASE_NAME) {
    super(name);

    // Version 1 was the pre-recorded-data schema. Version 2 adds report
    // snapshots, category indexes, and backfills provenance on older rows.
    // Future versions must be additive; never edit a released version block.
    this.version(1).stores({
      checkIns: "id, observedAt, createdAt",
      telemetrySamples: "id, scenarioId, channel, capturedAt",
    });

    this.version(2)
      .stores({
        checkIns: "id, observedAt, createdAt, source.category",
        telemetrySamples: "id, scenarioId, channel, capturedAt, source.category",
        reportSnapshots: "id, createdAt, source.category",
      })
      .upgrade(async (transaction) => {
        await transaction
          .table("checkIns")
          .toCollection()
          .modify((legacy: Record<string, unknown>) => {
            legacy.updatedAt ??= legacy.createdAt;
            legacy.source ??= {
              category: "recorded",
              origin: "crew-entry",
              label: "Crew-entered check-in",
            };
          });

        await transaction
          .table("telemetrySamples")
          .toCollection()
          .modify((legacy: Record<string, unknown>) => {
            legacy.updatedAt ??= legacy.createdAt;
            legacy.source ??= {
              category: "simulated",
              origin: "generator",
              label: "Simulated demonstration telemetry",
              generator: "astatine.telemetry",
              generatorVersion: 1,
              scenarioId:
                typeof legacy.scenarioId === "string" ? legacy.scenarioId : "legacy",
              seed: 0,
            };
          });
      });
  }
}

export const db = new AstatineDatabase();

export function createDatabase(name = DATABASE_NAME): AstatineDatabase {
  return new AstatineDatabase(name);
}

export async function openDatabase(
  database: AstatineDatabase = db,
): Promise<AstatineDatabase> {
  try {
    await database.open();
    return database;
  } catch (error) {
    throw toDataLayerError(error);
  }
}
