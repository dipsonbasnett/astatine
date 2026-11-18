import { isResearchEntry } from "@/lib/validation";
import type {
  ResearchContext,
  ResearchEntry,
  ValidationIssue,
  ValidationResult,
} from "@/types/health";

export const RESEARCH_CONTEXT_NOTE =
  "Research entries are external, attributed context. They are never merged with recorded check-ins or simulated telemetry.";

export function validateResearchLibrary(
  input: unknown,
): ValidationResult<readonly ResearchEntry[]> {
  if (!Array.isArray(input)) {
    return {
      ok: false,
      issues: [{ field: "entries", message: "A research entry list is required." }],
    };
  }

  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  const urls = new Set<string>();

  input.forEach((entry: unknown, index: number) => {
    if (!isResearchEntry(entry)) {
      issues.push({
        field: `entries.${index}`,
        message:
          "Research entry is missing verified attribution or a valid https source.",
      });
      return;
    }
    if (ids.has(entry.id)) {
      issues.push({
        field: `entries.${index}.id`,
        message: "Research entry ids must be unique.",
      });
    }
    if (urls.has(entry.url)) {
      issues.push({
        field: `entries.${index}.url`,
        message: "Research source urls must be unique.",
      });
    }
    ids.add(entry.id);
    urls.add(entry.url);
  });

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: input as ResearchEntry[] };
}

export function buildResearchContext(
  entries: readonly ResearchEntry[],
  topics: readonly string[] = [],
): ResearchContext {
  const selected = new Set(
    topics.map((topic) => topic.trim().toLowerCase()).filter(Boolean),
  );
  const filtered =
    selected.size === 0
      ? [...entries]
      : entries.filter((entry) =>
          entry.topics.some((topic) => selected.has(topic.toLowerCase())),
        );

  return {
    entries: filtered,
    note:
      filtered.length === 0 && selected.size > 0
        ? "No attributed research entries matched the selected topics."
        : RESEARCH_CONTEXT_NOTE,
  };
}

export function researchAttributionLine(entry: ResearchEntry): string {
  return `${entry.publisher} — ${entry.title}. Accessed ${entry.accessedAt.slice(0, 10)}.`;
}
