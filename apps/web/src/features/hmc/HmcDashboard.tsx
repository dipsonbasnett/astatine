import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CrewIcon, MissionIcon, RecoveryIcon, VitalsIcon } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { buttonStyles } from "@/components/ui/button-styles";
import { buildSimulatedRecoveryTrend } from "@/features/readiness/recovery-trend";
import { usePreferences } from "@/preferences/usePreferences";
import {
  buildDashboardSnapshot,
  clockTime,
  elapsedClock,
  HMC_RANGES,
  pointsInRange,
  type HmcRange,
} from "./dashboard-data";
import { Astronaut } from "./Astronaut";
import { DashboardBackground } from "./DashboardBackground";
import { HelmetPortrait, ProfileDetails } from "./ProfileDetails";
import { TelemetryChart } from "./TelemetryChart";

const METRICS = [
  {
    key: "heartRate",
    title: "Heart Rate",
    unit: "bpm",
    domain: [50, 90],
    icon: VitalsIcon,
  },
  {
    key: "bloodPressure",
    title: "Blood Pressure",
    unit: "mmHg",
    domain: [60, 140],
    icon: MissionIcon,
  },
  {
    key: "spo2",
    title: "Oxygen Saturation",
    unit: "%",
    domain: [90, 100],
    icon: CrewIcon,
  },
] as const;
type MetricKey = (typeof METRICS)[number]["key"];

const SESSION_TICK_MS = 1000;
const SIMULATED_MINUTES_PER_TICK = 1;
const MAX_SERIES_POINTS = 1441;

function MissionClock({ start, running }: { start: number; running: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    let previous = Date.now();
    const tick = () => {
      const now = Date.now();
      const delta = Math.max(0, now - previous);
      previous = now;
      setElapsed((value) => value + delta);
    };
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  return (
    <section className="hmc-panel hmc-mission" aria-labelledby="mission-time-heading">
      <div>
        <div className="hmc-card-heading">
          <h2 id="mission-time-heading">Mission time</h2>
        </div>
        <p
          className="hmc-clock"
          role="timer"
          aria-label="Simulated mission elapsed time"
          aria-live="off"
        >
          {elapsedClock(elapsed)}
        </p>
        <p className="hmc-muted">
          Local demo started{" "}
          <time dateTime={new Date(start).toISOString()}>
            {clockTime(new Date(start).toISOString())} UTC
          </time>{" "}
          · {running ? "Running" : "Paused"}
        </p>
      </div>
      <MissionIcon className="hmc-orbit-icon" />
    </section>
  );
}

function RecoveryBars() {
  const trend = useMemo(() => buildSimulatedRecoveryTrend({ windowDays: 7 }), []);
  return (
    <figure aria-label="Recovery Trend · Simulated">
      <svg
        viewBox="0 0 440 120"
        role="img"
        aria-label="Seven simulated daily recovery illustration values, D−6 to D0, on a 0–100 arbitrary-unit scale; not a health score."
      >
        <line x1="38" x2="426" y1="85" y2="85" className="hmc-gridline" />
        <text x="2" y="19">
          100
        </text>
        <text x="18" y="86">
          0
        </text>
        {trend.points.map((point, index) => (
          <g key={point.label}>
            <rect
              x={46 + index * 54}
              y={85 - point.value * 0.7}
              width="28"
              height={point.value * 0.7}
              className="hmc-recovery-bar"
            />
            <text x={60 + index * 54} y="111" textAnchor="middle">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
}

export function HmcDashboard() {
  const [anchor, setAnchor] = useState(() => Date.now());
  const [advance, setAdvance] = useState(0);
  const [running, setRunning] = useState(true);
  const [range, setRange] = useState<HmcRange>(60);
  const [detail, setDetail] = useState<MetricKey | "recovery" | "profile" | null>(null);
  const { preferences } = usePreferences();
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(
      () => setAdvance((value) => value + 1),
      SESSION_TICK_MS,
    );
    return () => window.clearInterval(timer);
  }, [running]);
  const snapshot = useMemo(() => {
    const built = buildDashboardSnapshot(
      new Date(anchor + advance * SIMULATED_MINUTES_PER_TICK * 60_000),
      MAX_SERIES_POINTS + advance,
    );
    if (advance === 0) return built;
    return {
      ...built,
      series: {
        heartRate: built.series.heartRate.slice(-MAX_SERIES_POINTS),
        bloodPressure: built.series.bloodPressure.slice(-MAX_SERIES_POINTS),
        spo2: built.series.spo2.slice(-MAX_SERIES_POINTS),
        respiratoryRate: built.series.respiratoryRate.slice(-MAX_SERIES_POINTS),
      },
    };
  }, [anchor, advance]);
  const series = useMemo(
    () => ({
      heartRate: pointsInRange(snapshot.series.heartRate, snapshot.capturedAt, range),
      bloodPressure: pointsInRange(
        snapshot.series.bloodPressure,
        snapshot.capturedAt,
        range,
      ),
      spo2: pointsInRange(snapshot.series.spo2, snapshot.capturedAt, range),
    }),
    [snapshot, range],
  );
  const metric = METRICS.find((item) => item.key === detail);
  const available = METRICS.every((item) => series[item.key].length > 0);
  const closeDetail = () => setDetail(null);

  return (
    <div className="hmc-dashboard">
      <h1 className="sr-only">Dashboard</h1>
      <div className="hmc-toolbar">
        <Button variant="secondary" onClick={() => setRunning(!running)}>
          {running ? "Pause session" : "Resume session"}
        </Button>
      </div>
      {!available && (
        <div role="status" className="hmc-panel p-5">
          <h2>Simulated readings unavailable</h2>
          <p className="hmc-muted">
            No samples are available. Nothing has been substituted from recorded or
            research data.
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setAnchor(Date.now());
              setAdvance(0);
            }}
          >
            Regenerate simulation
          </Button>
        </div>
      )}
      <div className="hmc-top-grid">
        <section className="hmc-astronaut" aria-label="Astronaut visualization">
          <Astronaut />
        </section>
        <div className="hmc-monitor">
          <div className="hmc-metric-grid">
            {METRICS.map((item) => {
              const point = series[item.key].at(-1);
              const Icon = item.icon;
              return (
                <section
                  key={item.key}
                  className="hmc-panel hmc-metric"
                  aria-labelledby={`metric-${item.key}`}
                >
                  <div className="hmc-card-heading">
                    <h2 id={`metric-${item.key}`}>
                      <Icon />
                      {item.title}
                    </h2>
                  </div>
                  <div className="hmc-metric-value">
                    {point
                      ? `${point.value}${item.key === "bloodPressure" ? `/${point.secondaryValue}` : ""}`
                      : "—"}
                    <span>{item.unit}</span>
                  </div>
                  {item.key === "bloodPressure" && (
                    <p className="hmc-muted">Systolic / diastolic</p>
                  )}
                  <TelemetryChart
                    title={item.title}
                    points={series[item.key]}
                    unit={item.unit}
                    domain={item.domain}
                    pressure={item.key === "bloodPressure"}
                    compact
                  />
                  <div className="hmc-metric-footer">
                    <time dateTime={snapshot.capturedAt}>
                      Snapshot {clockTime(snapshot.capturedAt)} UTC
                    </time>
                    <button
                      onClick={() => setDetail(item.key)}
                      aria-label={`View ${item.title} details`}
                    >
                      Details <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </section>
              );
            })}
            <section
              className="hmc-panel hmc-metric"
              aria-labelledby="recovery-trend-heading"
            >
              <div className="hmc-card-heading">
                <h2 id="recovery-trend-heading">
                  <RecoveryIcon />
                  Recovery Trend
                </h2>
              </div>
              <p className="hmc-recovery-heading">Illustrative only</p>
              <RecoveryBars />
              <div className="hmc-metric-footer">
                <span>Not used in readiness</span>
                <button
                  onClick={() => setDetail("recovery")}
                  aria-label="View Recovery Trend details"
                >
                  Details <span aria-hidden="true">↗</span>
                </button>
              </div>
            </section>
          </div>
          <MissionClock key={anchor} start={anchor} running={running} />
        </div>
      </div>
      <div className="hmc-bottom-grid">
        <section
          className="hmc-panel hmc-overview"
          aria-labelledby="vitals-overview-heading"
        >
          <div className="hmc-section-heading">
            <div>
              <h2 id="vitals-overview-heading">Vitals Overview</h2>
              <p className="hmc-muted">Separate measurement scales · UTC</p>
            </div>
          </div>
          <div className="hmc-range" role="group" aria-label="Vitals time range">
            {HMC_RANGES.map((item) => (
              <button
                key={item.minutes}
                aria-pressed={range === item.minutes}
                onClick={() => setRange(item.minutes)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="hmc-overview-charts">
            {METRICS.map((item) => (
              <div key={item.key}>
                <h3>
                  {item.title} <span>{item.unit}</span>
                </h3>
                <TelemetryChart
                  title={`${item.title} overview`}
                  points={series[item.key]}
                  domain={item.domain}
                  unit={item.unit}
                  pressure={item.key === "bloodPressure"}
                />
              </div>
            ))}
          </div>
          <p className="hmc-muted">
            {series.heartRate.length} one-minute samples per channel. Synthetic history,
            not{" "}
            {range === 1440
              ? "24 hours"
              : HMC_RANGES.find((item) => item.minutes === range)?.label}{" "}
            of observed health data. The demo advances one simulated minute per second.
          </p>
          <details className="hmc-table-disclosure">
            <summary>View numerical samples</summary>
            <div className="hmc-table-scroll">
              <table>
                <caption>Simulated values only · UTC · {range}-minute window</caption>
                <thead>
                  <tr>
                    <th scope="col">Time</th>
                    <th scope="col">HR (bpm)</th>
                    <th scope="col">SpO₂ (%)</th>
                    <th scope="col">Systolic (mmHg)</th>
                    <th scope="col">Diastolic (mmHg)</th>
                  </tr>
                </thead>
                <tbody>
                  {series.heartRate.map((point, index) => (
                    <tr key={point.observedAt}>
                      <td>{clockTime(point.observedAt)}</td>
                      <td>{point.value}</td>
                      <td>{series.spo2[index]?.value ?? "Missing"}</td>
                      <td>{series.bloodPressure[index]?.value ?? "Missing"}</td>
                      <td>{series.bloodPressure[index]?.secondaryValue ?? "Missing"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
        <section className="hmc-panel hmc-profile" aria-labelledby="profile-heading">
          <div className="hmc-section-heading">
            <h2 id="profile-heading">Profile</h2>
            <CrewIcon className="size-5 text-ink-subtle" />
          </div>
          <div className="hmc-profile-identity">
            <HelmetPortrait />
            <div>
              <p className="hmc-profile-name">
                {preferences.callsign || "Local crew profile"}
              </p>
              <SourceBadge className="hmc-source-label" category="recorded">
                Recorded · preference
              </SourceBadge>
            </div>
          </div>
          <dl className="hmc-profile-facts">
            <div>
              <dt>Simulation ID</dt>
              <dd>
                HMC-DEMO-01 <span>(fictional)</span>
              </dd>
            </div>
            <div>
              <dt>Mission role</dt>
              <dd>Not assigned</dd>
            </div>
            <div>
              <dt>Health status</dt>
              <dd>Not assessed</dd>
            </div>
          </dl>
          <Button variant="secondary" onClick={() => setDetail("profile")}>
            View Details
          </Button>
          <p className="hmc-muted">Simulated vitals are not linked to this profile.</p>
        </section>
      </div>
      <div className="hmc-boundary">
        <p>
          Monitoring support, not diagnosis. No clinical validation or NASA endorsement.
          Research context is not personal data.
        </p>
        <div>
          <Link to="/check-in" className={buttonStyles({ variant: "secondary" })}>
            Record a check-in
          </Link>
          <Link to="/research" className="hmc-text-link">
            Research center
          </Link>
          <Button
            variant="ghost"
            onClick={() => {
              setAnchor(Date.now());
              setAdvance(0);
              setRunning(true);
            }}
          >
            New simulated session
          </Button>
        </div>
      </div>
      <DashboardBackground />
      <Modal
        open={detail !== null}
        onClose={closeDetail}
        title={
          detail === "profile"
            ? "Profile details"
            : detail === "recovery"
              ? "Recovery Trend details"
              : `${metric?.title ?? "Metric"} details`
        }
        description={
          detail === "profile"
            ? "Local identity and privacy, separate from the fictional astronaut."
            : "Simulated context only. No sensor, personal measurement, diagnosis, or prediction."
        }
      >
        {detail === "profile" ? (
          <ProfileDetails />
        ) : detail === "recovery" ? (
          <div className="space-y-4">
            <SourceBadge className="hmc-source-label" category="simulated">
              Simulated
            </SourceBadge>
            <RecoveryBars />
            <p>
              Deterministic seven-day illustration from the existing recovery-trend
              generator. D0 is the demo endpoint, not a personal check-in. Values have
              arbitrary units and no clinical thresholds, confidence, or predictive
              meaning.
            </p>
            <p>
              Not used in readiness or recommendations. Research and recorded inputs are
              not used to generate these bars.
            </p>
            <Link to="/readiness" className="hmc-text-link">
              Review recorded readiness
            </Link>
          </div>
        ) : (
          metric && (
            <div className="space-y-4">
              <SourceBadge className="hmc-source-label" category="simulated">
                Simulated
              </SourceBadge>
              <TelemetryChart
                title={metric.title}
                unit={metric.unit}
                points={series[metric.key]}
                domain={metric.domain}
                pressure={metric.key === "bloodPressure"}
              />
              <p>{snapshot.note}</p>
              <dl className="hmc-profile-facts">
                <div>
                  <dt>Generator</dt>
                  <dd>
                    {snapshot.generator} v{snapshot.generatorVersion}
                  </dd>
                </div>
                <div>
                  <dt>Scenario / seed</dt>
                  <dd>
                    {snapshot.scenarioLabel} / {snapshot.seed}
                  </dd>
                </div>
                <div>
                  <dt>Latest update</dt>
                  <dd>
                    <time dateTime={snapshot.capturedAt}>{snapshot.capturedAt}</time>
                  </dd>
                </div>
                <div>
                  <dt>Limitations</dt>
                  <dd>
                    One-minute generated values; not an ECG or continuous waveform. Chart
                    lines join samples without smoothing. No personal applicability or
                    medical reference ranges.
                  </dd>
                </div>
              </dl>
              <Link to="/vitals" className="hmc-text-link">
                Open Vitals and data sources
              </Link>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
