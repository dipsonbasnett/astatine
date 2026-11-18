import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { Tab, TabList, TabPanel } from "@/components/ui/Tabs";
import { formatDateTime, formatDecimal } from "@/lib/format";
import { usePreferences } from "@/preferences/usePreferences";
import type {
  CheckInRecord,
  SimulatedMonitorReading,
  SimulatedVitalsMonitor,
} from "@/types/health";

import { OrganFigure } from "./OrganFigure";
import {
  ORGAN_DESCRIPTIONS,
  ORGAN_LABELS,
  ORGAN_ORDER,
  type OrganId,
} from "./organ-copy";
import { VITALS_NO_RESEARCH_NOTE } from "./vitals-engine";

function useSystemReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => {
      setReduced(query.matches);
    };

    query.addEventListener?.("change", handleChange);
    return () => {
      query.removeEventListener?.("change", handleChange);
    };
  }, []);

  return reduced;
}

function readingFor(
  monitor: SimulatedVitalsMonitor,
  channel: SimulatedMonitorReading["channel"],
): SimulatedMonitorReading | undefined {
  return monitor.readings.find((reading) => reading.channel === channel);
}

function ReadingValue({ reading }: { reading: SimulatedMonitorReading | undefined }) {
  if (!reading) return <span className="text-sm">Unavailable</span>;

  const primary =
    reading.channel === "bloodPressure" && reading.secondaryValue !== undefined
      ? `${formatDecimal(reading.value, reading.decimals)}/${formatDecimal(
          reading.secondaryValue,
          reading.decimals,
        )}`
      : formatDecimal(reading.value, reading.decimals);

  return (
    <>
      <span className="font-mono text-lg">{primary}</span>{" "}
      <span className="font-mono text-[0.625rem] tracking-[0.04em] text-ink-subtle">
        {reading.unit}
      </span>
    </>
  );
}

function MonitorCard({ monitor }: { monitor: SimulatedVitalsMonitor }) {
  const readings = [
    readingFor(monitor, "heartRate"),
    readingFor(monitor, "respiratoryRate"),
    readingFor(monitor, "spo2"),
    readingFor(monitor, "bloodPressure"),
  ];

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="text-sm font-semibold tracking-tight text-ink">
          Simulated monitor
        </h4>
        <div className="flex flex-wrap gap-1.5">
          <SourceBadge category="simulated">Simulated</SourceBadge>
          <Badge>Not sensor data</Badge>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        {readings.map((reading, index) => (
          <div
            key={reading?.channel ?? `missing-${index}`}
            className="rounded-control border border-line bg-raised/40 p-3"
          >
            <dt className="text-xs text-ink-subtle">
              {reading?.label ?? "Simulated reading"}
            </dt>
            <dd className="mt-1 text-ink">
              <ReadingValue reading={reading} />
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 break-words font-mono text-[0.625rem] tracking-[0.08em] text-ink-subtle uppercase">
        {monitor.generator} · v{monitor.generatorVersion} · seed {monitor.seed} ·{" "}
        {monitor.scenarioLabel}
      </p>
      <p className="mt-2 text-xs leading-5 text-ink-subtle">
        Captured in the simulated clock{" "}
        <time dateTime={monitor.capturedAt}>{formatDateTime(monitor.capturedAt)}</time>.
        Values are generated locally from a fixed scenario and seed.
      </p>
    </Card>
  );
}

function RecordedContextCard({ checkIn }: { checkIn: CheckInRecord | null }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold tracking-tight text-ink">
          Recorded context
        </h4>
        <SourceBadge category="recorded">Recorded</SourceBadge>
      </div>

      {checkIn ? (
        <>
          <p className="mt-2 text-xs leading-5 text-ink-muted">
            Newest recorded check-in · {formatDateTime(checkIn.observedAt)}. Shown beside
            the simulation, never merged with it.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-ink-subtle">Sleep duration</dt>
              <dd className="mt-0.5 text-ink">{checkIn.sleepHours} h</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Fatigue</dt>
              <dd className="mt-0.5 text-ink">{checkIn.fatigue}/5</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Hydration rating</dt>
              <dd className="mt-0.5 text-ink">{checkIn.hydration}/5</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Soreness</dt>
              <dd className="mt-0.5 text-ink">{checkIn.soreness}/5</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="mt-2 text-xs leading-5 text-ink-muted">
          No recorded check-ins in this browser. The organ demonstration does not use
          recorded data, and no recorded value is estimated to fill the gap.
        </p>
      )}

      <Link
        to="/check-in"
        className="mt-3 inline-block text-xs font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
      >
        {checkIn ? "Record another check-in" : "Record a check-in"}
      </Link>
    </Card>
  );
}

function OrganResearchCard() {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold tracking-tight text-ink">
          Research context
        </h4>
        <SourceBadge category="research">Research</SourceBadge>
      </div>
      <p className="mt-2 text-xs leading-5 text-ink-muted">{VITALS_NO_RESEARCH_NOTE}</p>
      <p className="mt-2 text-xs leading-5 text-ink-subtle">
        Astatine is not affiliated with, endorsed by, or clinically validated by any cited
        agency. The research integrity workflow defines how a source would be added.
      </p>
      <Link
        to="/research"
        className="mt-3 inline-block text-xs font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
      >
        Open the research integrity workflow
      </Link>
    </Card>
  );
}

export interface OrganContextProps {
  monitor: SimulatedVitalsMonitor;
  latestCheckIn: CheckInRecord | null;
}

export function OrganContext({ monitor, latestCheckIn }: OrganContextProps) {
  const idBase = useId();
  const [activeOrgan, setActiveOrgan] = useState<OrganId>("heart");
  const [paused, setPaused] = useState(false);
  const { preferences } = usePreferences();
  const systemReducedMotion = useSystemReducedMotion();
  const reducedMotion = preferences.motion === "reduced" || systemReducedMotion;
  const motionActive = !paused && !reducedMotion;

  const heartRate = readingFor(monitor, "heartRate")?.value ?? 70;
  const respiratoryRate = readingFor(monitor, "respiratoryRate")?.value ?? 14;

  const motionMessage = reducedMotion
    ? "Reduced motion is active from your system or in-app preference. The organ stays visible without animation."
    : paused
      ? "Organ motion is paused. The organ stays visible."
      : "Organ motion is synchronized to the simulated values in the monitor. It pauses when you pause the demonstration.";

  return (
    <section aria-labelledby={`${idBase}-organ-heading`} className="space-y-5">
      <div className="max-w-3xl">
        <p className="font-mono text-label text-ink-subtle uppercase">
          Procedural illustration
        </p>
        <h2
          id={`${idBase}-organ-heading`}
          className="mt-2 text-2xl font-semibold tracking-tight text-ink"
        >
          Organ context
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Three original procedural illustrations paired with the simulated monitor and
          the newest recorded check-in. Motion is illustrative only; nothing here reads,
          diagnoses, or predicts a medical event.
        </p>
      </div>

      <TabList label="Organ context">
        {ORGAN_ORDER.map((organ) => (
          <Tab
            key={organ}
            id={`${idBase}-organ-tab-${organ}`}
            panelId={`${idBase}-organ-panel-${organ}`}
            selected={organ === activeOrgan}
            onSelect={() => {
              setActiveOrgan(organ);
            }}
          >
            {ORGAN_LABELS[organ]}
          </Tab>
        ))}
      </TabList>

      {ORGAN_ORDER.map((organ) => (
        <TabPanel
          key={organ}
          id={`${idBase}-organ-panel-${organ}`}
          labelledBy={`${idBase}-organ-tab-${organ}`}
          active={organ === activeOrgan}
          className="space-y-4"
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold tracking-tight text-ink">
                {ORGAN_LABELS[organ]}
              </h3>
              <div className="mt-3 flex min-h-80 items-center justify-center bg-canvas lg:min-h-120">
                <OrganFigure
                  organ={organ}
                  heartRate={heartRate}
                  respiratoryRate={respiratoryRate}
                  motionActive={motionActive}
                  className="w-full max-w-3xl"
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-ink-subtle">
                Procedural SVG renderer. No WebGL is required; when WebGL is unavailable,
                this view is unchanged and the organ remains visible.
              </p>
              <p className="mt-2 max-w-prose text-xs leading-5 text-ink-muted">
                {ORGAN_DESCRIPTIONS[organ]}
              </p>
            </div>

            <div className="min-w-0 space-y-4">
              <Card className="p-5">
                <h4 className="text-sm font-semibold tracking-tight text-ink">
                  Demonstration controls
                </h4>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  aria-pressed={paused}
                  onClick={() => {
                    setPaused((current) => !current);
                  }}
                >
                  {paused ? "Resume organ motion" : "Pause organ motion"}
                </Button>
                <p className="mt-3 text-xs leading-5 text-ink-muted">{motionMessage}</p>
                <p className="mt-2 text-xs leading-5 text-ink-subtle">
                  The monitor values do not change while you pause motion; pausing is a
                  display preference, not a data control.
                </p>
              </Card>

              <MonitorCard monitor={monitor} />
              <RecordedContextCard checkIn={latestCheckIn} />
              <OrganResearchCard />
            </div>
          </div>
        </TabPanel>
      ))}
    </section>
  );
}
