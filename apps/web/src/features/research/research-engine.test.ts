import { describe, expect, it } from "vitest";

import { makeResearchEntry } from "@/test/fixtures";

import {
  RESEARCH_CONTEXT_NOTE,
  buildResearchContext,
  researchAttributionLine,
  validateResearchLibrary,
} from "./research-engine";

describe("validateResearchLibrary", () => {
  it("accepts attributed entries with https sources", () => {
    const entries = [
      makeResearchEntry(),
      makeResearchEntry({
        id: "research-second",
        title: "Second reference",
        url: "https://example.org/second",
        source: {
          category: "research",
          origin: "external",
          label: "External research context",
          publisher: "Example Space Agency",
          url: "https://example.org/second",
          accessedAt: "2026-11-01T00:00:00.000Z",
        },
      }),
    ];

    const result = validateResearchLibrary(entries);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(entries);
  });

  it("rejects entries without verified attribution", () => {
    const result = validateResearchLibrary([
      makeResearchEntry({ publisher: "Different publisher" }),
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.field).toBe("entries.0");
  });

  it("rejects non-https sources", () => {
    const result = validateResearchLibrary([
      makeResearchEntry({
        url: "http://example.org/reference",
        source: {
          category: "research",
          origin: "external",
          label: "External research context",
          publisher: "Example Space Agency",
          url: "http://example.org/reference",
          accessedAt: "2026-11-01T00:00:00.000Z",
        },
      }),
    ]);

    expect(result.ok).toBe(false);
  });

  it("rejects duplicate ids and urls", () => {
    const result = validateResearchLibrary([
      makeResearchEntry(),
      makeResearchEntry({ title: "Duplicate id, different url" }),
    ]);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    const messages = result.issues.map((issue) => issue.message);
    expect(messages).toContain("Research entry ids must be unique.");
    expect(messages).toContain("Research source urls must be unique.");
  });

  it("rejects a non-array library", () => {
    expect(validateResearchLibrary(null).ok).toBe(false);
  });
});

describe("buildResearchContext", () => {
  const entries = [
    makeResearchEntry(),
    makeResearchEntry({
      id: "research-second",
      title: "Second reference",
      url: "https://example.org/second",
      topics: ["Exercise"],
      source: {
        category: "research",
        origin: "external",
        label: "External research context",
        publisher: "Example Space Agency",
        url: "https://example.org/second",
        accessedAt: "2026-11-01T00:00:00.000Z",
      },
    }),
  ];

  it("returns all entries with the separation note when no topics are selected", () => {
    const context = buildResearchContext(entries);

    expect(context.entries).toEqual(entries);
    expect(context.note).toBe(RESEARCH_CONTEXT_NOTE);
  });

  it("filters by topic case-insensitively", () => {
    const sleep = buildResearchContext(entries, ["SLEEP"]);
    const exercise = buildResearchContext(entries, ["exercise"]);

    expect(sleep.entries.map((entry) => entry.id)).toEqual(["research-example"]);
    expect(exercise.entries.map((entry) => entry.id)).toEqual(["research-second"]);
  });

  it("explains an empty topic result", () => {
    const context = buildResearchContext(entries, ["nonexistent"]);

    expect(context.entries).toEqual([]);
    expect(context.note).toBe(
      "No attributed research entries matched the selected topics.",
    );
  });
});

describe("researchAttributionLine", () => {
  it("formats publisher, title, and access date", () => {
    expect(researchAttributionLine(makeResearchEntry())).toBe(
      "Example Space Agency — Example human spaceflight reference. Accessed 2026-11-01.",
    );
  });
});
