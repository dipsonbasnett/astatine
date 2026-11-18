import { afterEach, describe, expect, it } from "vitest";

import type { CheckInDraft } from "@/types/health";

import { createDatabase, openDatabase, type AstatineDatabase } from "./db";
import {
  deleteAllLocalData,
  deleteRecordedData,
  deleteSimulatedData,
  getLocalDataCounts,
} from "./data-privacy";

import { createCheckIn } from "@/features/checkin/checkin-repository";
import { buildCountermeasurePlan } from "@/features/countermeasures/countermeasure-engine";
import { assessReadiness } from "@/features/readiness/readiness-engine";
import { buildReportSnapshotDraft } from "@/features/reports/report-engine";
import { createReportSnapshot } from "@/features/reports/report-repository";
import { simulateTelemetry } from "@/features/telemetry/telemetry-engine";
import { saveSimulatedTelemetry } from "@/features/telemetry/telemetry-repository";

const NOW = "2026-11-16T10:00:00.000Z";
const databases: AstatineDatabase[] = [];

const draft: CheckInDraft = {
  observedAt: "2026-11-16T08:00:00.000Z",
  sleepHours: 7.5,
  sleepQuality: 3,
  fatigue: 3,
  mood: 3,
  soreness: 2,
  stress: 2,
  hydration: 3,
};

async function seededDatabase(): Promise<AstatineDatabase> {
  const database = createDatabase(`astatine-privacy-${crypto.randomUUID()}`);
  await openDatabase(database);
  databases.push(database);

  const checkIn = await createCheckIn(draft, { database, now: NOW, id: "checkin-1" });
  const readiness = assessReadiness({
    checkIns: [checkIn],
    now: new Date(NOW),
  });
  if (!readiness) throw new Error("Expected a readiness fixture.");
  await createReportSnapshot(
    buildReportSnapshotDraft({
      checkIn,
      readiness,
      countermeasures: buildCountermeasurePlan(readiness),
      generatedAt: NOW,
    }),
    { database, now: NOW, id: "snapshot-1" },
  );
  await saveSimulatedTelemetry(
    simulateTelemetry({
      scenarioId: "rest-window",
      seed: 3,
      startedAt: "2026-11-16T09:00:00.000Z",
    }),
    { database, now: NOW },
  );

  return database;
}

afterEach(async () => {
  for (const database of databases.splice(0)) {
    database.close();
    await database.delete();
  }
});

describe("local data privacy controls", () => {
  it("counts each data class separately", async () => {
    const database = await seededDatabase();

    await expect(getLocalDataCounts(database)).resolves.toEqual({
      checkIns: 1,
      reportSnapshots: 1,
      telemetrySamples: 21,
    });
  });

  it("deletes recorded check-ins and derived snapshots without touching simulated data", async () => {
    const database = await seededDatabase();

    await deleteRecordedData(database);

    await expect(getLocalDataCounts(database)).resolves.toEqual({
      checkIns: 0,
      reportSnapshots: 0,
      telemetrySamples: 21,
    });
  });

  it("deletes simulated telemetry without touching recorded data", async () => {
    const database = await seededDatabase();

    await deleteSimulatedData(database);

    await expect(getLocalDataCounts(database)).resolves.toEqual({
      checkIns: 1,
      reportSnapshots: 1,
      telemetrySamples: 0,
    });
  });

  it("deletes every local data class on request", async () => {
    const database = await seededDatabase();

    await deleteAllLocalData(database);

    await expect(getLocalDataCounts(database)).resolves.toEqual({
      checkIns: 0,
      reportSnapshots: 0,
      telemetrySamples: 0,
    });
  });
});
