import {
  DataLayerError,
  createRecordId,
  db as defaultDatabase,
  toDataLayerError,
  type AstatineDatabase,
} from "@/lib/db";
import type { CheckInDraft, CheckInRecord } from "@/types/health";

import { createCheckInRecord, validateCheckInDraft } from "./checkin-engine";

export interface CreateCheckInOptions {
  database?: AstatineDatabase;
  now?: string;
  id?: string;
}

export async function createCheckIn(
  draft: CheckInDraft,
  {
    database = defaultDatabase,
    now = new Date().toISOString(),
    id,
  }: CreateCheckInOptions = {},
): Promise<CheckInRecord> {
  const validation = validateCheckInDraft(draft);
  if (!validation.ok) {
    throw new DataLayerError(
      "validation",
      validation.issues[0]?.message ?? "The check-in did not pass validation.",
    );
  }

  const record = createCheckInRecord(validation.value, {
    id: id ?? createRecordId(),
    now,
  });

  try {
    await database.checkIns.add(record);
    return record;
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function listCheckIns(
  limit = 20,
  database: AstatineDatabase = defaultDatabase,
): Promise<CheckInRecord[]> {
  try {
    return await database.checkIns.orderBy("observedAt").reverse().limit(limit).toArray();
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function getLatestCheckIn(
  database: AstatineDatabase = defaultDatabase,
): Promise<CheckInRecord | undefined> {
  try {
    return await database.checkIns.orderBy("observedAt").reverse().first();
  } catch (error) {
    throw toDataLayerError(error);
  }
}
