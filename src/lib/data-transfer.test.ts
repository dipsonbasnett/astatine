import { afterEach, describe, expect, it } from "vitest";

import type { CheckInDraft } from "@/types/health";

import {
  DataTransferError,
  EXPORT_FORMAT,
  EXPORT_VERSION,
  MAX_IMPORT_BYTES,
  applyImportBundle,
  createExportBundle,
  formatImportSummary,
  importLocalData,
  parseExportBundle,
  serializeExportBundle,
  type LocalDataExport,
} from "./data-transfer";
import { createDatabase, openDatabase, type AstatineDatabase } from "./db";

import { createCheckIn } from "@/features/checkin/checkin-repository";
import { buildCountermeasurePlan } from "@/features/countermeasures/countermeasure-engine";
import { assessReadiness } from "@/features/readiness/readiness-engine";
import { buildReportSnapshotDraft } from "@/features/reports/report-engine";
import { createReportSnapshot } from "@/features/reports/report-repository";
import { simulateTelemetry } from "@/features/telemetry/telemetry-engine";
import { saveSimulatedTelemetry } from "@/features/telemetry/telemetry-repository";

const NOW = "2026-11-16T10:00:00.000Z";
const EXPORTED_AT = "2026-11-16T10:10:00.000Z";
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

async function makeDatabase(): Promise<AstatineDatabase> {
  const database = createDatabase(`astatine-transfer-${crypto.randomUUID()}`);
  await openDatabase(database);
  databases.push(database);
  return database;
}

async function seedDatabase(database: AstatineDatabase): Promise<void> {
  const checkIn = await createCheckIn(draft, {
    database,
    now: NOW,
    id: "checkin-1",
  });
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
      scenarioId: "steady-orbit",
      seed: 11,
      startedAt: "2026-11-16T09:00:00.000Z",
    }),
    { database, now: NOW },
  );
}

async function exportFrom(database: AstatineDatabase): Promise<LocalDataExport> {
  return createExportBundle(database, EXPORTED_AT);
}

afterEach(async () => {
  for (const database of databases.splice(0)) {
    database.close();
    await database.delete();
  }
});

describe("createExportBundle", () => {
  it("separates recorded and simulated sections and records format metadata", async () => {
    const database = await makeDatabase();
    await seedDatabase(database);

    const bundle = await exportFrom(database);

    expect(bundle).toMatchObject({
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: EXPORTED_AT,
    });
    expect(bundle.appVersion.length).toBeGreaterThan(0);
    expect(bundle.sections.recorded.checkIns).toHaveLength(1);
    expect(bundle.sections.recorded.reportSnapshots).toHaveLength(1);
    expect(bundle.sections.simulated.telemetrySamples).toHaveLength(21);
    expect(bundle.sections.recorded.checkIns[0]?.source.category).toBe("recorded");
    expect(bundle.sections.simulated.telemetrySamples[0]?.source.category).toBe(
      "simulated",
    );
  });
});

describe("parseExportBundle", () => {
  it("round-trips a serialized export", async () => {
    const database = await makeDatabase();
    await seedDatabase(database);
    const bundle = await exportFrom(database);

    const parsed = parseExportBundle(serializeExportBundle(bundle));

    expect(parsed).toEqual(bundle);
  });

  it("rejects malformed JSON and oversized input", () => {
    expect(() => parseExportBundle("{not json")).toThrow(DataTransferError);
    expect(() => parseExportBundle("not json")).toThrowError(
      expect.objectContaining({ code: "invalid-json" }),
    );
    expect(() => parseExportBundle("x".repeat(MAX_IMPORT_BYTES + 1))).toThrowError(
      expect.objectContaining({ code: "too-large" }),
    );
  });

  it("rejects other formats and unsupported versions", async () => {
    const database = await makeDatabase();
    const bundle = await exportFrom(database);

    expect(() =>
      parseExportBundle(JSON.stringify({ ...bundle, format: "other.app" })),
    ).toThrowError(expect.objectContaining({ code: "invalid-format" }));
    expect(() =>
      parseExportBundle(JSON.stringify({ ...bundle, version: 99 })),
    ).toThrowError(expect.objectContaining({ code: "unsupported-version" }));
  });

  it("rejects records that fail data-class validation", async () => {
    const database = await makeDatabase();
    await seedDatabase(database);
    const bundle = await exportFrom(database);

    const invalid = {
      ...bundle,
      sections: {
        ...bundle.sections,
        recorded: {
          ...bundle.sections.recorded,
          checkIns: [{ ...bundle.sections.recorded.checkIns[0], sleepQuality: 9 }],
        },
      },
    };

    expect(() => parseExportBundle(JSON.stringify(invalid))).toThrowError(
      expect.objectContaining({ code: "invalid-record" }),
    );
  });

  it("rejects duplicated record ids", async () => {
    const database = await makeDatabase();
    await seedDatabase(database);
    const bundle = await exportFrom(database);
    const checkIn = bundle.sections.recorded.checkIns[0];

    const duplicated = {
      ...bundle,
      sections: {
        ...bundle.sections,
        recorded: {
          ...bundle.sections.recorded,
          checkIns: [checkIn, checkIn],
        },
      },
    };

    expect(() => parseExportBundle(JSON.stringify(duplicated))).toThrowError(
      expect.objectContaining({ code: "invalid-record" }),
    );
  });

  it("requires separate recorded and simulated sections", async () => {
    const database = await makeDatabase();
    const bundle = await exportFrom(database);

    expect(() =>
      parseExportBundle(
        JSON.stringify({
          ...bundle,
          sections: { recorded: bundle.sections.recorded },
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: "invalid-format" }));
  });
});

describe("applyImportBundle", () => {
  it("imports every data class into a fresh database", async () => {
    const source = await makeDatabase();
    await seedDatabase(source);
    const bundle = await exportFrom(source);

    const target = await makeDatabase();
    const summary = await applyImportBundle(bundle, target);

    expect(summary).toEqual({
      checkIns: 1,
      reportSnapshots: 1,
      telemetrySamples: 21,
    });
    expect(await target.checkIns.count()).toBe(1);
    expect(await target.reportSnapshots.count()).toBe(1);
    expect(await target.telemetrySamples.count()).toBe(21);
    expect((await target.checkIns.get("checkin-1"))?.source.category).toBe("recorded");
    expect((await target.telemetrySamples.toArray())[0]?.source.category).toBe(
      "simulated",
    );
  });

  it("replaces matching ids instead of duplicating them", async () => {
    const source = await makeDatabase();
    await seedDatabase(source);
    const bundle = await exportFrom(source);

    const target = await makeDatabase();
    await applyImportBundle(bundle, target);
    await applyImportBundle(bundle, target);

    expect(await target.checkIns.count()).toBe(1);
    expect(await target.reportSnapshots.count()).toBe(1);
    expect(await target.telemetrySamples.count()).toBe(21);
  });

  it("supports the parse-then-import helper", async () => {
    const source = await makeDatabase();
    await seedDatabase(source);
    const raw = serializeExportBundle(await exportFrom(source));

    const target = await makeDatabase();
    const summary = await importLocalData(raw, target);

    expect(summary.checkIns).toBe(1);
  });
});

describe("formatImportSummary", () => {
  it("formats counts with singular and plural labels", () => {
    expect(
      formatImportSummary({ checkIns: 1, reportSnapshots: 2, telemetrySamples: 3 }),
    ).toBe("Imported 1 recorded check-in, 2 report snapshots, 3 simulated samples.");
    expect(
      formatImportSummary({ checkIns: 2, reportSnapshots: 1, telemetrySamples: 1 }),
    ).toBe("Imported 2 recorded check-ins, 1 report snapshot, 1 simulated sample.");
  });
});
