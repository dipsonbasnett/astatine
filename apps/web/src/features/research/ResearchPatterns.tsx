import { Card } from "@/components/ui/Card";

const RESEARCH_UI_PATTERNS = [
  {
    title: "Label the data class",
    detail:
      "Every research block carries a visible research source badge and never borrows the recorded-data styling used for personal check-ins.",
  },
  {
    title: "Attribution before interpretation",
    detail:
      "Show the citation, creator, publisher, license, identifier, and access date before or alongside any summary of the source.",
  },
  {
    title: "Limitations stay adjacent",
    detail:
      "Display documented limitations next to the intended use, so a reader cannot see a claim without its caveat.",
  },
  {
    title: "Never personalize",
    detail:
      "Use language such as “studies of similar crews” and never phrase a finding as describing the selected crew member or astronaut.",
  },
  {
    title: "Disclose provenance and review",
    detail:
      "Expose the verification date, reviewer, checksum, and ingestion date. A missing field blocks display instead of showing a partial record.",
  },
  {
    title: "Make external destinations explicit",
    detail:
      "Outbound links open in a new tab, name the destination, and include a new-tab hint for assistive technology.",
  },
  {
    title: "No inline personal data",
    detail:
      "Research views do not fetch, merge, or interleave recorded check-ins or simulated telemetry.",
  },
] as const;

const CITATION_ORDER = [
  "Creator or rights holder",
  "Title and version",
  "Publisher",
  "DOI or persistent identifier, or a documented reason none exists",
  "Official source URL",
  "Accessed date",
  "License name and license URL",
  "Required attribution statement",
] as const;

export function ResearchPatterns() {
  return (
    <section aria-labelledby="research-patterns-heading" className="space-y-5">
      <div>
        <p className="font-mono text-label text-ink-subtle uppercase">Interface</p>
        <h2
          id="research-patterns-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-ink"
        >
          Research-context UI patterns
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          These patterns keep external evidence visibly external and prevent research
          context from reading as a personal assessment.
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {RESEARCH_UI_PATTERNS.map((pattern, index) => (
          <li
            key={pattern.title}
            className="rounded-panel border border-line bg-surface p-5"
          >
            <p className="font-mono text-label text-accent uppercase">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-sm font-semibold text-ink">{pattern.title}</h3>
            <p className="mt-2 text-xs leading-5 text-ink-muted">{pattern.detail}</p>
          </li>
        ))}
      </ul>

      <Card className="p-6">
        <p className="font-mono text-label text-ink-subtle uppercase">Citation order</p>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">
          Citation and attribution requirements
        </h3>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          Reproduce the publisher&apos;s citation and attribution text without paraphrase.
          Record every item below for each dataset and each research reference.
        </p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2">
          {CITATION_ORDER.map((entry, index) => (
            <li key={entry} className="flex gap-3 text-sm leading-6">
              <span aria-hidden="true" className="font-mono text-xs text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-ink-muted">{entry}</span>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  );
}
