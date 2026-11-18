import {
  DataLayerError,
  createRecordId,
  db as defaultDatabase,
  toDataLayerError,
  type AstatineDatabase,
} from "@/lib/db";
import { isTelemetrySampleRecord } from "@/lib/validation";
import type { TelemetrySampleDraft, TelemetrySampleRecord } from "@/types/health";

export interface SaveSimulatedTelemetryOptions {
  database?: AstatineDatabase;
  now?: string;
}

export async function saveSimulatedTelemetry(
  drafts: readonly TelemetrySampleDraft[],
  {
    database = defaultDatabase,
    now = new Date().toISOString(),
  }: SaveSimulatedTelemetryOptions = {},
): Promise<TelemetrySampleRecord[]> {
  const records: TelemetrySampleRecord[] = drafts.map((draft) => ({
    ...draft,
    id: createRecordId(),
    createdAt: now,
    updatedAt: now,
  }));

  const invalid = records.find((record) => !isTelemetrySampleRecord(record));
  if (invalid) {
    throw new DataLayerError(
      "validation",
      "A simulated telemetry sample did not pass local validation.",
    );
  }

  try {
    await database.transaction("rw", database.telemetrySamples, async () => {
      await database.telemetrySamples.bulkAdd(records);
    });
    return records;
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function listRecentTelemetry(
  limit = 30,
  database: AstatineDatabase = defaultDatabase,
): Promise<TelemetrySampleRecord[]> {
  try {
    return await database.telemetrySamples
      .orderBy("capturedAt")
      .reverse()
      .limit(limit)
      .toArray();
  } catch (error) {
    throw toDataLayerError(error);
  }
}
