import { APP_VERSION } from "@/lib/constants";
import { db as defaultDatabase, toDataLayerError, type AstatineDatabase } from "@/lib/db";
import {
  isCheckInRecord,
  isIsoTimestamp,
  isPlainObject,
  isTelemetrySampleRecord,
} from "@/lib/validation";
import type {
  CheckInRecord,
  ReportSnapshotRecord,
  TelemetrySampleRecord,
} from "@/types/health";

import { isReportSnapshotRecord } from "@/features/reports/report-validation";

export const EXPORT_FORMAT = "astatine.local-export";
export const EXPORT_VERSION = 1;
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_RECORDS = 10_000;

export interface LocalDataExport {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  appVersion: string;
  exportedAt: string;
  sections: {
    recorded: {
      checkIns: CheckInRecord[];
      reportSnapshots: ReportSnapshotRecord[];
    };
    simulated: {
      telemetrySamples: TelemetrySampleRecord[];
    };
  };
}

export type TransferErrorCode =
  | "too-large"
  | "invalid-json"
  | "invalid-format"
  | "unsupported-version"
  | "invalid-record";

export class DataTransferError extends Error {
  readonly code: TransferErrorCode;
  readonly issues: string[];

  constructor(code: TransferErrorCode, message: string, issues: string[] = []) {
    super(message);
    this.name = "DataTransferError";
    this.code = code;
    this.issues = issues;
  }
}

export interface ImportSummary {
  checkIns: number;
  reportSnapshots: number;
  telemetrySamples: number;
}

function byCreatedAt(left: { createdAt: string }, right: { createdAt: string }): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

export async function createExportBundle(
  database: AstatineDatabase = defaultDatabase,
  exportedAt = new Date().toISOString(),
): Promise<LocalDataExport> {
  try {
    const [checkIns, reportSnapshots, telemetrySamples] = await Promise.all([
      database.checkIns.toArray(),
      database.reportSnapshots.toArray(),
      database.telemetrySamples.toArray(),
    ]);

    return {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      appVersion: APP_VERSION,
      exportedAt,
      sections: {
        recorded: {
          checkIns: checkIns.sort(byCreatedAt),
          reportSnapshots: reportSnapshots.sort(byCreatedAt),
        },
        simulated: {
          telemetrySamples: telemetrySamples.sort(byCreatedAt),
        },
      },
    };
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export function serializeExportBundle(bundle: LocalDataExport): string {
  return JSON.stringify(bundle, null, 2);
}

function issue(issues: string[], message: string): void {
  if (issues.length < 20) issues.push(message);
}

function readRecordArray(
  value: unknown,
  path: string,
  issues: string[],
  guard: (record: unknown) => boolean,
): unknown[] {
  if (!Array.isArray(value)) {
    issue(issues, `${path} must be an array.`);
    return [];
  }
  if (value.length > MAX_IMPORT_RECORDS) {
    issue(issues, `${path} exceeds the ${MAX_IMPORT_RECORDS} record import limit.`);
    return [];
  }

  value.forEach((record, index) => {
    if (!guard(record)) {
      issue(issues, `${path}[${index}] is not a valid record for its data class.`);
    }
  });

  return value;
}

function checkDuplicateIds(
  records: readonly unknown[],
  path: string,
  issues: string[],
): void {
  const ids = new Set<string>();
  records.forEach((record, index) => {
    if (!isPlainObject(record) || typeof record.id !== "string") return;
    if (ids.has(record.id)) {
      issue(issues, `${path}[${index}] repeats id ${record.id}.`);
    }
    ids.add(record.id);
  });
}

function validateBundle(input: unknown): LocalDataExport {
  if (!isPlainObject(input)) {
    throw new DataTransferError(
      "invalid-format",
      "The selected file is not an Astatine local-data export.",
    );
  }
  if (input.format !== EXPORT_FORMAT) {
    throw new DataTransferError(
      "invalid-format",
      "The selected file is not an Astatine local-data export.",
    );
  }
  if (input.version !== EXPORT_VERSION) {
    throw new DataTransferError(
      "unsupported-version",
      "This export version is not supported by this build of Astatine.",
    );
  }
  if (
    !isIsoTimestamp(input.exportedAt) ||
    typeof input.appVersion !== "string" ||
    input.appVersion.length > 40
  ) {
    throw new DataTransferError(
      "invalid-format",
      "The export metadata is incomplete or invalid.",
    );
  }

  if (!isPlainObject(input.sections)) {
    throw new DataTransferError(
      "invalid-format",
      "The export is missing its data-class sections.",
    );
  }
  const { recorded, simulated } = input.sections;
  if (!isPlainObject(recorded) || !isPlainObject(simulated)) {
    throw new DataTransferError(
      "invalid-format",
      "The export must separate recorded and simulated sections.",
    );
  }

  const issues: string[] = [];
  const checkIns = readRecordArray(
    recorded.checkIns,
    "sections.recorded.checkIns",
    issues,
    isCheckInRecord,
  );
  const reportSnapshots = readRecordArray(
    recorded.reportSnapshots,
    "sections.recorded.reportSnapshots",
    issues,
    isReportSnapshotRecord,
  );
  const telemetrySamples = readRecordArray(
    simulated.telemetrySamples,
    "sections.simulated.telemetrySamples",
    issues,
    isTelemetrySampleRecord,
  );

  checkDuplicateIds(checkIns, "sections.recorded.checkIns", issues);
  checkDuplicateIds(reportSnapshots, "sections.recorded.reportSnapshots", issues);
  checkDuplicateIds(telemetrySamples, "sections.simulated.telemetrySamples", issues);

  if (issues.length > 0) {
    throw new DataTransferError(
      "invalid-record",
      "The export contains records that failed local validation. Nothing was imported.",
      issues,
    );
  }

  return input as unknown as LocalDataExport;
}

export function parseExportBundle(raw: string): LocalDataExport {
  if (typeof raw !== "string" || raw.length > MAX_IMPORT_BYTES) {
    throw new DataTransferError(
      "too-large",
      "The file is too large to import through this local review flow.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new DataTransferError("invalid-json", "The selected file is not valid JSON.");
  }

  return validateBundle(parsed);
}

export async function applyImportBundle(
  bundle: LocalDataExport,
  database: AstatineDatabase = defaultDatabase,
): Promise<ImportSummary> {
  const validated = validateBundle(bundle);

  try {
    await database.transaction(
      "rw",
      database.checkIns,
      database.reportSnapshots,
      database.telemetrySamples,
      async () => {
        await database.checkIns.bulkPut(validated.sections.recorded.checkIns);
        await database.reportSnapshots.bulkPut(
          validated.sections.recorded.reportSnapshots,
        );
        await database.telemetrySamples.bulkPut(
          validated.sections.simulated.telemetrySamples,
        );
      },
    );

    return {
      checkIns: validated.sections.recorded.checkIns.length,
      reportSnapshots: validated.sections.recorded.reportSnapshots.length,
      telemetrySamples: validated.sections.simulated.telemetrySamples.length,
    };
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function importLocalData(
  raw: string,
  database: AstatineDatabase = defaultDatabase,
): Promise<ImportSummary> {
  return applyImportBundle(parseExportBundle(raw), database);
}

export function formatImportSummary(summary: ImportSummary): string {
  const parts = [
    `${summary.checkIns} recorded check-in${summary.checkIns === 1 ? "" : "s"}`,
    `${summary.reportSnapshots} report snapshot${summary.reportSnapshots === 1 ? "" : "s"}`,
    `${summary.telemetrySamples} simulated sample${summary.telemetrySamples === 1 ? "" : "s"}`,
  ];
  return `Imported ${parts.join(", ")}.`;
}
