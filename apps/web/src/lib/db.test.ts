import { afterEach, describe, expect, it } from "vitest";

import {
  DATABASE_SCHEMA_VERSION,
  DataLayerError,
  createDatabase,
  openDatabase,
  toDataLayerError,
  type AstatineDatabase,
} from "./db";

const databases: AstatineDatabase[] = [];

function remember(database: AstatineDatabase): AstatineDatabase {
  databases.push(database);
  return database;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function seedLegacyVersionOne(name: string): Promise<void> {
  const request = indexedDB.open(name, 1);
  request.onupgradeneeded = () => {
    const legacy = request.result;
    legacy.createObjectStore("checkIns", { keyPath: "id" });
    legacy.createObjectStore("telemetrySamples", { keyPath: "id" });
  };

  const legacy = await requestResult(request);
  const transaction = legacy.transaction(["checkIns", "telemetrySamples"], "readwrite");

  transaction.objectStore("checkIns").put({
    id: "legacy-checkin",
    observedAt: "2026-01-01T08:00:00.000Z",
    sleepHours: 7,
    sleepQuality: 3,
    fatigue: 3,
    mood: 3,
    soreness: 2,
    stress: 2,
    hydration: 3,
    createdAt: "2026-01-01T08:00:00.000Z",
  });

  transaction.objectStore("telemetrySamples").put({
    id: "legacy-sample",
    scenarioId: "steady-orbit",
    channel: "heartRate",
    capturedAt: "2026-01-01T08:00:00.000Z",
    value: 70,
    unit: "bpm",
    signalQuality: 0.9,
    createdAt: "2026-01-01T08:00:00.000Z",
  });

  await transactionDone(transaction);
  legacy.close();
}

afterEach(async () => {
  for (const database of databases.splice(0)) {
    database.close();
    await database.delete();
  }
});

describe("database schema", () => {
  it("declares schema version 2 with all three data-class stores", async () => {
    const database = remember(createDatabase(`astatine-schema-${crypto.randomUUID()}`));
    await openDatabase(database);

    expect(DATABASE_SCHEMA_VERSION).toBe(2);
    expect(database.tables.map((table) => table.name).sort()).toEqual([
      "checkIns",
      "reportSnapshots",
      "telemetrySamples",
    ]);
    expect(await database.reportSnapshots.count()).toBe(0);
  });

  it("upgrades version 1 rows with provenance and updatedAt backfill", async () => {
    const name = `astatine-migration-${crypto.randomUUID()}`;
    await seedLegacyVersionOne(name);

    const database = remember(createDatabase(name));
    await openDatabase(database);

    const checkIn = await database.checkIns.get("legacy-checkin");
    expect(checkIn).toMatchObject({
      updatedAt: "2026-01-01T08:00:00.000Z",
      source: {
        category: "recorded",
        origin: "crew-entry",
        label: "Crew-entered check-in",
      },
    });

    const sample = await database.telemetrySamples.get("legacy-sample");
    expect(sample).toMatchObject({
      updatedAt: "2026-01-01T08:00:00.000Z",
      source: {
        category: "simulated",
        origin: "generator",
        generator: "astatine.telemetry",
        generatorVersion: 1,
        scenarioId: "steady-orbit",
        seed: 0,
      },
    });
  });
});

describe("toDataLayerError", () => {
  it("passes existing data-layer errors through unchanged", () => {
    const error = new DataLayerError("validation", "Invalid record.");

    expect(toDataLayerError(error)).toBe(error);
  });

  it("maps quota, version, blocked, and unknown failures to user-facing codes", () => {
    const quota = new Error("Storage full");
    quota.name = "QuotaExceededError";
    const version = new Error("Newer version");
    version.name = "VersionError";
    const blocked = new Error("Database is blocked by another tab");

    expect(toDataLayerError(quota)).toMatchObject({ code: "quota" });
    expect(toDataLayerError(version)).toMatchObject({ code: "version" });
    expect(toDataLayerError(blocked)).toMatchObject({ code: "blocked" });
    expect(toDataLayerError(new Error("Something else"))).toMatchObject({
      code: "unknown",
    });
  });
});
