import { describe, expect, it } from "vitest";

import type { CheckInDraft } from "@/types/health";

import {
  CHECK_IN_FIELDS,
  DEFAULT_CHECK_IN_VALUES,
  checkInField,
  createCheckInRecord,
  validateCheckInDraft,
} from "./checkin-engine";

const validDraft: CheckInDraft = {
  observedAt: "2026-11-16T08:00:00.000Z",
  ...DEFAULT_CHECK_IN_VALUES,
};

describe("validateCheckInDraft", () => {
  it("accepts a complete numeric draft and returns a normalized copy", () => {
    const result = validateCheckInDraft(validDraft);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(validDraft);
    expect(result.value).not.toBe(validDraft);
  });

  it("rejects a non-object with a form-level issue", () => {
    const result = validateCheckInDraft(null);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toEqual([
      { field: "form", message: "A complete check-in is required." },
    ]);
  });

  it("reports every missing scale rating and an invalid timestamp", () => {
    const result = validateCheckInDraft({ observedAt: "not-a-date", sleepHours: 7 });

    expect(result.ok).toBe(false);
    if (result.ok) return;

    const fields = result.issues.map((issue) => issue.field);
    expect(fields).toContain("observedAt");
    for (const definition of CHECK_IN_FIELDS) {
      expect(fields).toContain(definition.id);
    }
  });

  it("limits sleep duration to the 0–16 hour range", () => {
    expect(validateCheckInDraft({ ...validDraft, sleepHours: -1 }).ok).toBe(false);
    expect(validateCheckInDraft({ ...validDraft, sleepHours: 16.5 }).ok).toBe(false);
    expect(validateCheckInDraft({ ...validDraft, sleepHours: 0 }).ok).toBe(true);
    expect(validateCheckInDraft({ ...validDraft, sleepHours: 16 }).ok).toBe(true);
  });

  it("rejects scale ratings outside 1–5 and non-numeric values", () => {
    expect(validateCheckInDraft({ ...validDraft, fatigue: 0 }).ok).toBe(false);
    expect(validateCheckInDraft({ ...validDraft, fatigue: 6 }).ok).toBe(false);
    expect(validateCheckInDraft({ ...validDraft, fatigue: "3" }).ok).toBe(false);
    expect(validateCheckInDraft({ ...validDraft, mood: 2.5 }).ok).toBe(false);
  });
});

describe("CHECK_IN_FIELDS", () => {
  it("defines six fields with complete 1–5 option labels", () => {
    expect(CHECK_IN_FIELDS).toHaveLength(6);
    for (const definition of CHECK_IN_FIELDS) {
      expect(definition.options.map((option) => option.value)).toEqual([1, 2, 3, 4, 5]);
      expect(definition.label.length).toBeGreaterThan(0);
      expect(definition.hint.length).toBeGreaterThan(0);
    }
  });

  it("marks inverse-scored factors as lower-is-better", () => {
    expect(checkInField("fatigue")?.higherIsBetter).toBe(false);
    expect(checkInField("soreness")?.higherIsBetter).toBe(false);
    expect(checkInField("stress")?.higherIsBetter).toBe(false);
    expect(checkInField("sleepQuality")?.higherIsBetter).toBe(true);
    expect(checkInField("hydration")?.higherIsBetter).toBe(true);
  });
});

describe("createCheckInRecord", () => {
  it("stamps an envelope and crew-entry provenance", () => {
    const record = createCheckInRecord(validDraft, {
      id: "record-1",
      now: "2026-11-16T08:05:00.000Z",
    });

    expect(record).toMatchObject({
      id: "record-1",
      createdAt: "2026-11-16T08:05:00.000Z",
      updatedAt: "2026-11-16T08:05:00.000Z",
      observedAt: validDraft.observedAt,
      source: {
        category: "recorded",
        origin: "crew-entry",
        label: "Crew-entered check-in",
      },
    });
  });
});
