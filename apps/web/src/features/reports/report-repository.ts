import {
  DataLayerError,
  createRecordId,
  db as defaultDatabase,
  toDataLayerError,
  type AstatineDatabase,
} from "@/lib/db";
import type { ReportSnapshotDraft, ReportSnapshotRecord } from "@/types/health";

import { isReportSnapshotDraft } from "./report-validation";

export interface CreateReportSnapshotOptions {
  database?: AstatineDatabase;
  now?: string;
  id?: string;
}

export async function createReportSnapshot(
  draft: ReportSnapshotDraft,
  {
    database = defaultDatabase,
    now = new Date().toISOString(),
    id,
  }: CreateReportSnapshotOptions = {},
): Promise<ReportSnapshotRecord> {
  if (!isReportSnapshotDraft(draft)) {
    throw new DataLayerError(
      "validation",
      "The report snapshot did not pass local validation.",
    );
  }

  const record: ReportSnapshotRecord = {
    ...draft,
    id: id ?? createRecordId(),
    createdAt: now,
    updatedAt: now,
    source: {
      category: "recorded",
      origin: "derived",
      label: "Derived locally from recorded check-ins",
      derivedFrom: [draft.checkInId],
    },
  };

  try {
    await database.reportSnapshots.add(record);
    return record;
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function listReportSnapshots(
  limit = 10,
  database: AstatineDatabase = defaultDatabase,
): Promise<ReportSnapshotRecord[]> {
  try {
    return await database.reportSnapshots
      .orderBy("createdAt")
      .reverse()
      .limit(limit)
      .toArray();
  } catch (error) {
    throw toDataLayerError(error);
  }
}
