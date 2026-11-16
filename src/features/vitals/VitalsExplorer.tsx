import { useId, useState } from "react";
import { Link } from "react-router-dom";

import { ArrowRightIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { Tab, TabList, TabPanel } from "@/components/ui/Tabs";
import { formatDateTime } from "@/lib/format";
import type {
  VitalPoint,
  VitalSimulatedSeries,
  VitalView,
  VitalViewId,
  VitalsSnapshot,
} from "@/types/health";

import { VITALS_NO_RESEARCH_NOTE, VITALS_RESEARCH_NOTE } from "./vitals-engine";
import { VitalTrace } from "./VitalTrace";

function formatNumber(value: number, decimals: number): string {
  return value
    .toFixed(decimals)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

function pointText(view: VitalView, point: VitalPoint): string {
  if (view.id === "bloodPressure" && point.secondaryValue !== undefined) {
    return `${formatNumber(point.value, view.decimals)}/${formatNumber(
      point.secondaryValue,
      view.decimals,
    )} ${view.unit}`;
  }
  return `${formatNumber(point.value, view.decimals)} ${view.unit}`;
}

function TrendLine({ series }: { series: VitalSimulatedSeries }) {
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>{series.trendLabel}</Badge>
        <span className="font-mono text-[0.625rem] tracking-[0.08em] text-ink-subtle uppercase">
          {series.points.length} simulated samples
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-ink-muted">{series.trendDetail}</p>
    </div>
  );
}

function RecordedCard({ view }: { view: VitalView }) {
  const { recorded } = view;
  const latest = recorded.latest;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-label text-ink-subtle uppercase">
            Recorded self-report
          </p>
          <h4 className="mt-2 text-lg font-semibold tracking-tight text-ink">
            Latest recorded value
          </h4>
        </div>
        <SourceBadge category="recorded">Recorded</SourceBadge>
      </div>

      <p className="mt-4 font-mono text-3xl text-ink">
        {latest ? pointText(view, latest) : "Not recorded"}
      </p>
      <p className="mt-1 text-xs text-ink-subtle">
        {latest ? formatDateTime(latest.observedAt) : "No recorded value in this window"}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge>{recorded.trendLabel}</Badge>
        <span className="text-xs text-ink-subtle">{recorded.coverageText}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-ink-muted">{recorded.trendDetail}</p>

      {recorded.context.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs leading-5 text-ink-muted">
          {recorded.context.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        <VitalTrace
          id={`${view.id}-recorded-trace`}
          title={`${view.label}, recorded values`}
          category="recorded"
          points={recorded.points}
          unit={view.unit}
          decimals={view.decimals}
          emptyMessage={`No recorded ${view.label.toLowerCase()} observations in this window. Astatine does not fill the gap with simulated values.`}
        />
      </div>

      {recorded.missing.length > 0 && (
        <div className="mt-5 rounded-control border border-dashed border-line px-3 py-3">
          <h5 className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
            Missing or partial data
          </h5>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-ink-muted">
            {recorded.missing.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-ink-subtle">{recorded.note}</p>
    </Card>
  );
}

function SimulatedCard({ view }: { view: VitalView }) {
  const simulated = view.simulated;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-label text-ink-subtle uppercase">
            Simulated demonstration
          </p>
          <h4 className="mt-2 text-lg font-semibold tracking-tight text-ink">
            Synthetic values, clearly separated
          </h4>
        </div>
        <div className="flex flex-wrap gap-2">
          <SourceBadge category="simulated">Simulated</SourceBadge>
          <Badge>Not recorded data</Badge>
        </div>
      </div>

      {simulated ? (
        <>
          <p className="mt-4 font-mono text-3xl text-ink">
            {pointText(view, simulated.latest)}
          </p>
          <p className="mt-1 text-xs text-ink-subtle">
            Synthetic latest sample · {formatDateTime(simulated.latest.observedAt)}
          </p>
          <TrendLine series={simulated} />
          <div className="mt-5">
            <VitalTrace
              id={`${view.id}-simulated-trace`}
              title={`${view.label}, simulated demonstration values`}
              category="simulated"
              points={simulated.points}
              unit={view.unit}
              decimals={view.decimals}
              emptyMessage="No simulated samples are available."
            />
          </div>
          <p className="mt-4 font-mono text-[0.625rem] tracking-[0.08em] text-ink-subtle uppercase">
            {simulated.generator} · v{simulated.generatorVersion} · seed {simulated.seed}{" "}
            · {simulated.scenarioLabel}
          </p>
          <p className="mt-2 text-xs leading-5 text-ink-subtle">{simulated.note}</p>
        </>
      ) : (
        <p className="mt-4 rounded-control border border-dashed border-line px-3 py-3 text-xs leading-5 text-ink-muted">
          No simulated series is shown for this view. Astatine synthesizes device-style
          demonstration values only for heart rate, SpO2, and blood-pressure-style
          readings. Recorded check-ins are the only source for sleep, activity, hydration,
          and nutrition.
        </p>
      )}
    </Card>
  );
}

function ReferenceCard({ view }: { view: VitalView }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold tracking-tight text-ink">
          Reference context
        </h4>
        <Badge>
          {view.reference.status === "rubric-benchmark" ? "Rubric rule" : "Not shown"}
        </Badge>
      </div>
      <p className="mt-2 text-sm font-medium text-ink">{view.reference.title}</p>
      <p className="mt-1 text-xs leading-5 text-ink-muted">{view.reference.detail}</p>
    </Card>
  );
}

function ResearchCard({ view }: { view: VitalView }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold tracking-tight text-ink">
          Research context
        </h4>
        <SourceBadge category="research">Research</SourceBadge>
      </div>

      {view.research ? (
        <>
          <a
            href={view.research.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 block text-sm font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
          >
            {view.research.title}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <p className="mt-1 text-xs text-ink-subtle">
            {view.research.publisher} · accessed {view.research.accessedAt}
          </p>
          <p className="mt-3 text-xs leading-5 text-ink-muted">{view.research.claim}</p>
          <p className="mt-2 text-xs leading-5 text-ink-subtle">
            Limitations: {view.research.limitations}
          </p>
          <p className="mt-3 text-xs leading-5 text-ink-subtle">{VITALS_RESEARCH_NOTE}</p>
        </>
      ) : (
        <p className="mt-3 text-xs leading-5 text-ink-muted">{VITALS_NO_RESEARCH_NOTE}</p>
      )}

      <p className="mt-3 text-xs leading-5 text-ink-subtle">
        Astatine is not affiliated with, endorsed by, or clinically validated by any cited
        agency.
      </p>
      <Link
        to="/research"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
      >
        Open the research integrity workflow
        <ArrowRightIcon className="size-3.5" />
      </Link>
    </Card>
  );
}

function ViewLinks({ view }: { view: VitalView }) {
  return (
    <nav aria-label={`Related surfaces for ${view.label}`} className="space-y-2">
      <h4 className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
        Related surfaces
      </h4>
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {view.links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-xs font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export interface VitalsExplorerProps {
  snapshot: VitalsSnapshot;
}

export function VitalsExplorer({ snapshot }: VitalsExplorerProps) {
  const idBase = useId();
  const [activeId, setActiveId] = useState<VitalViewId>("heartRate");

  return (
    <section aria-labelledby={`${idBase}-vitals-heading`} className="space-y-5">
      <div className="max-w-3xl">
        <p className="font-mono text-label text-ink-subtle uppercase">Focused views</p>
        <h2
          id={`${idBase}-vitals-heading`}
          className="mt-2 text-2xl font-semibold tracking-tight text-ink"
        >
          Vital signs
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Each view shows recorded self-report, a labeled simulated demonstration, and
          reference and research context in separate sections. They are never combined
          into one series, one score, or one conclusion.
        </p>
      </div>

      <TabList label="Vital signs">
        {snapshot.views.map((view) => (
          <Tab
            key={view.id}
            id={`${idBase}-tab-${view.id}`}
            panelId={`${idBase}-panel-${view.id}`}
            selected={view.id === activeId}
            onSelect={() => {
              setActiveId(view.id);
            }}
          >
            {view.label}
          </Tab>
        ))}
      </TabList>

      {snapshot.views.map((view) => (
        <TabPanel
          key={view.id}
          id={`${idBase}-panel-${view.id}`}
          labelledBy={`${idBase}-tab-${view.id}`}
          active={view.id === activeId}
          className="space-y-4"
        >
          <div className="max-w-3xl">
            <h3 className="text-xl font-semibold tracking-tight text-ink">
              {view.label}
            </h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{view.summary}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
            <div className="min-w-0 space-y-4">
              <RecordedCard view={view} />
              <SimulatedCard view={view} />
            </div>
            <div className="min-w-0 space-y-4">
              <ReferenceCard view={view} />
              <ResearchCard view={view} />
              <ViewLinks view={view} />
            </div>
          </div>
        </TabPanel>
      ))}
    </section>
  );
}
