import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { formatDateTime, formatDecimal } from "@/lib/format";
import { buildMissionTimeline } from "@/features/mission/mission-engine";
import { createSimulatedMission } from "@/features/mission/simulated-mission";
import { findTelemetryScenario } from "@/features/telemetry/telemetry-engine";
import type { MissionPhaseStatus } from "@/types/health";
import { buildMissionMonitorSnapshot, formatMissionClock } from "./mission-monitor";

const INITIAL_ELAPSED_MS = 125 * 60_000;
const TICK_MS = 1_000;

const PHASE_STATUS_LABELS: Record<MissionPhaseStatus, string> = {
  upcoming: "Upcoming",
  active: "Active",
  complete: "Complete",
};

export interface MissionMonitorProps {
  initialNow?: Date;
}

export function MissionMonitor({ initialNow }: MissionMonitorProps) {
  const [session, setSession] = useState(() => {
    const anchorMs = initialNow?.getTime() ?? Date.now();
    return {
      startAtMs: anchorMs - INITIAL_ELAPSED_MS,
      elapsedMs: INITIAL_ELAPSED_MS,
    };
  });
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSession((current) => ({
        ...current,
        elapsedMs: current.elapsedMs + TICK_MS,
      }));
    }, TICK_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [running]);

  const plan = useMemo(
    () => createSimulatedMission(new Date(session.startAtMs)),
    [session.startAtMs],
  );
  const timeline = useMemo(
    () =>
      buildMissionTimeline(
        plan,
        new Date(session.startAtMs + session.elapsedMs).toISOString(),
      ),
    [plan, session.startAtMs, session.elapsedMs],
  );
  const snapshot = useMemo(() => buildMissionMonitorSnapshot(timeline), [timeline]);

  const activePhase = timeline.phases.find((phase) => phase.status === "active");
  const nextPhase = timeline.phases.find((phase) => phase.status === "upcoming");
  const missionState =
    activePhase?.label ?? (timeline.progress >= 100 ? "Mission complete" : "Not started");

  const restart = () => {
    setSession({ startAtMs: Date.now(), elapsedMs: 0 });
    setRunning(true);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-prose">
            <p className="font-mono text-label text-ink-subtle uppercase">
              Simulated monitor
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-ink">
              Simulated live mission monitor
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              A deterministic demonstration of a running mission clock and synthetic
              telemetry. It is not a live feed, not flight data, and does not describe any
              person.
            </p>
          </div>
          <Badge>Simulated only</Badge>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              setRunning((current) => !current);
            }}
          >
            {running ? "Pause simulation" : "Resume simulation"}
          </Button>
          <Button variant="ghost" onClick={restart}>
            Restart simulation
          </Button>
        </div>

        <p className="mt-4 text-xs leading-5 text-ink-subtle">
          {running ? "Simulation running" : "Simulation paused"} · The clock advances only
          while this page is open. Nothing is stored, uploaded, or included in readiness
          or reports.
        </p>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-label text-ink-subtle uppercase">
              Mission clock
            </p>
            <Badge>Simulated</Badge>
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-ink">
            {plan.name}
          </h3>
          <p className="mt-1 text-sm leading-6 text-ink-muted">
            {activePhase
              ? `Active phase · ${activePhase.label}`
              : timeline.progress >= 100
                ? "All simulated phases complete"
                : "Simulated mission has not started"}
          </p>

          <div
            role="progressbar"
            aria-label="Mission progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(timeline.progress)}
            aria-valuetext={`${Math.round(timeline.progress)} percent complete`}
            className="mt-5 h-2 overflow-hidden rounded-full bg-raised"
          >
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${timeline.progress}%` }}
            />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-ink-subtle">
            <span>{Math.round(timeline.progress)}% complete</span>
            <span className="font-mono">
              {formatMissionClock(timeline.elapsedMinutes)} of{" "}
              {formatMissionClock(timeline.totalMinutes)}
            </span>
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-label text-ink-subtle uppercase">Elapsed</dt>
              <dd className="mt-1 text-sm text-ink-muted">
                {formatMissionClock(timeline.elapsedMinutes)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-label text-ink-subtle uppercase">
                Remaining
              </dt>
              <dd className="mt-1 text-sm text-ink-muted">
                {formatMissionClock(timeline.totalMinutes - timeline.elapsedMinutes)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-label text-ink-subtle uppercase">
                Next phase
              </dt>
              <dd className="mt-1 text-sm text-ink-muted">
                {nextPhase?.label ?? "None scheduled"}
              </dd>
            </div>
          </dl>

          <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-ink-subtle">
            Mission state: {missionState}. The timeline is generated at display time from
            a repository-defined plan and is never treated as operational flight data.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-label text-ink-subtle uppercase">
                Synthetic snapshot
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">
                Demonstrated telemetry
              </h3>
            </div>
            <Badge>Not sensor data</Badge>
          </div>

          {snapshot ? (
            <>
              <ul
                aria-label="Synthetic telemetry snapshot"
                className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1"
              >
                {snapshot.readings.map((reading) => (
                  <li
                    key={reading.channel}
                    className="rounded-control border border-line bg-raised/40 p-3"
                  >
                    <p className="text-xs text-ink-subtle">{reading.label}</p>
                    <p className="mt-1 font-mono text-2xl text-ink">
                      {formatDecimal(reading.value, reading.decimals)}{" "}
                      <span className="text-xs text-ink-muted">{reading.unit}</span>
                    </p>
                    <p className="mt-1 text-xs text-ink-subtle">
                      Synthetic signal quality {Math.round(reading.signalQuality * 100)}%
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-ink-subtle">
                Scenario:{" "}
                {findTelemetryScenario(snapshot.scenarioId)?.label ?? snapshot.scenarioId}
                . Captured{" "}
                <time dateTime={snapshot.capturedAt}>
                  {formatDateTime(snapshot.capturedAt)}
                </time>{" "}
                in the simulated clock. Values are generated from a fixed scenario and
                seed, not measured from a device or a person.
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              No synthetic snapshot is shown because the simulated clock is outside an
              active phase.
            </p>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-label text-ink-subtle uppercase">Timeline</p>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">
              Simulated mission phases
            </h3>
          </div>
          <Badge>Simulated</Badge>
        </div>

        <ol aria-label="Simulated mission phases" className="mt-5 space-y-3">
          {timeline.phases.map((phase, index) => (
            <li
              key={phase.id}
              className={cn(
                "rounded-control border p-4",
                phase.status === "active"
                  ? "border-accent/40 bg-raised/50"
                  : "border-line",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span aria-hidden="true" className="font-mono text-xs text-accent">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-ink">{phase.label}</h4>
                    <p className="mt-1 text-xs leading-5 text-ink-muted">
                      {phase.summary}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge tone={phase.status === "active" ? "accent" : "neutral"}>
                    {PHASE_STATUS_LABELS[phase.status]}
                  </Badge>
                  <p className="mt-1 font-mono text-xs text-ink-subtle">
                    {formatMissionClock(phase.durationMinutes)}
                  </p>
                </div>
              </div>
              {phase.status === "active" && (
                <div
                  role="progressbar"
                  aria-label={`${phase.label} progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(phase.progress)}
                  aria-valuetext={`${Math.round(phase.progress)} percent complete`}
                  className="mt-3 h-1.5 overflow-hidden rounded-full bg-raised"
                >
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>

        <p className="mt-5 border-t border-line pt-4 text-xs leading-5 text-ink-subtle">
          This monitor is research-style demonstration context, not a clinical or
          operational display. It does not diagnose, predict, or recommend care, and it
          never merges with recorded check-ins.
        </p>
      </Card>
    </div>
  );
}
