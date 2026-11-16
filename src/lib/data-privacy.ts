import { db as defaultDatabase, toDataLayerError, type AstatineDatabase } from "@/lib/db";

export interface LocalDataCounts {
  checkIns: number;
  reportSnapshots: number;
  telemetrySamples: number;
}

export async function getLocalDataCounts(
  database: AstatineDatabase = defaultDatabase,
): Promise<LocalDataCounts> {
  try {
    const [checkIns, reportSnapshots, telemetrySamples] = await Promise.all([
      database.checkIns.count(),
      database.reportSnapshots.count(),
      database.telemetrySamples.count(),
    ]);
    return { checkIns, reportSnapshots, telemetrySamples };
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function deleteRecordedData(
  database: AstatineDatabase = defaultDatabase,
): Promise<void> {
  try {
    await database.transaction(
      "rw",
      database.checkIns,
      database.reportSnapshots,
      async () => {
        await database.checkIns.clear();
        await database.reportSnapshots.clear();
      },
    );
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function deleteSimulatedData(
  database: AstatineDatabase = defaultDatabase,
): Promise<void> {
  try {
    await database.transaction("rw", database.telemetrySamples, async () => {
      await database.telemetrySamples.clear();
    });
  } catch (error) {
    throw toDataLayerError(error);
  }
}

export async function deleteAllLocalData(
  database: AstatineDatabase = defaultDatabase,
): Promise<void> {
  try {
    await database.transaction(
      "rw",
      database.checkIns,
      database.reportSnapshots,
      database.telemetrySamples,
      async () => {
        await database.checkIns.clear();
        await database.reportSnapshots.clear();
        await database.telemetrySamples.clear();
      },
    );
  } catch (error) {
    throw toDataLayerError(error);
  }
}
