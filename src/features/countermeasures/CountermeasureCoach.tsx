import { Badge } from "@/components/ui/Badge";
import { SourceBadge } from "@/components/ui/SourceBadge";
import type {
  CountermeasureCoach as CountermeasureCoachModel,
  CountermeasureCoachItem,
  CountermeasureStatus,
} from "@/types/health";

const STATUS_TONE: Record<CountermeasureStatus, "accent" | "neutral"> = {
  "on-track": "accent",
  attention: "neutral",
  "missing-data": "neutral",
};

function CoachItem({ item }: { item: CountermeasureCoachItem }) {
  const headingId = `coach-${item.id}-heading`;

  return (
    <li>
      <article
        aria-labelledby={headingId}
        className="flex h-full flex-col rounded-panel border border-line bg-surface p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 id={headingId} className="text-base font-semibold tracking-tight text-ink">
            {item.title}
          </h3>
          <Badge tone={STATUS_TONE[item.status]}>{item.statusLabel}</Badge>
        </div>

        <p className="mt-3 text-sm leading-6 text-ink-muted">{item.currentStatus}</p>

        <div className="mt-4">
          <p className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
            Why it matters in spaceflight
          </p>
          <p className="mt-1 text-xs leading-5 text-ink-muted">{item.whyItMatters}</p>
        </div>

        <div className="mt-4">
          <p className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
            Suggested action
          </p>
          <p className="mt-1 text-sm leading-6 text-ink">{item.suggestion}</p>
          <p className="mt-2 text-xs leading-5 text-ink-subtle">{item.caution}</p>
        </div>

        {item.missingData && (
          <p className="mt-4 rounded-control border border-dashed border-line px-3 py-2 text-xs leading-5 text-ink-subtle">
            Missing data: {item.missingData}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {item.sources.map((source) => (
            <SourceBadge key={source.label} category={source.category}>
              {source.label}
            </SourceBadge>
          ))}
        </div>

        <div className="mt-auto pt-5">
          {item.research ? (
            <div className="rounded-control border border-line bg-canvas/40 p-3">
              <p className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
                Research context
              </p>
              <a
                href={item.research.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 block text-sm font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
              >
                {item.research.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <p className="mt-1 text-xs leading-5 text-ink-muted">
                {item.research.publisher} · accessed {item.research.accessedAt}
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-muted">
                {item.research.claim}
              </p>
              <p className="mt-2 text-xs leading-5 text-ink-subtle">
                Limitations: {item.research.limitations}
              </p>
            </div>
          ) : (
            <p className="text-xs leading-5 text-ink-subtle">
              No verified research source is linked for this item. Astatine omits context
              rather than citing something it cannot support.
            </p>
          )}
        </div>
      </article>
    </li>
  );
}

export interface CountermeasureCoachProps {
  coach: CountermeasureCoachModel;
}

export function CountermeasureCoach({ coach }: CountermeasureCoachProps) {
  return (
    <section aria-labelledby="countermeasure-coach-heading" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="font-mono text-label text-ink-subtle uppercase">Daily support</p>
          <h2
            id="countermeasure-coach-heading"
            className="mt-2 text-2xl font-semibold tracking-tight text-ink"
          >
            Countermeasure coach
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{coach.summary}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Non-diagnostic</Badge>
          <Badge>{coach.windowDays}-day window</Badge>
        </div>
      </div>

      <ul className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {coach.items.map((item) => (
          <CoachItem key={item.id} item={item} />
        ))}
      </ul>

      <div className="rounded-control border border-line bg-surface p-4">
        <p className="text-xs leading-5 text-ink-muted">{coach.researchNote}</p>
        <ul className="mt-3 space-y-1.5 text-xs leading-5 text-ink-subtle">
          {coach.caveats.map((caveat) => (
            <li key={caveat}>• {caveat}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
