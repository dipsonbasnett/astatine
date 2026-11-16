import { useId } from "react";
import type { VitalPoint } from "@/types/health";
import { clockTime } from "./dashboard-data";

interface TelemetryChartProps {
  title: string;
  unit: string;
  points: readonly VitalPoint[];
  domain: readonly [number, number];
  pressure?: boolean;
  compact?: boolean;
}

export function TelemetryChart({
  title,
  unit,
  points,
  domain,
  pressure = false,
  compact = false,
}: TelemetryChartProps) {
  const id = useId();
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last)
    return <p className="hmc-muted">No simulated samples in this range.</p>;
  const width = 440;
  const left = 40;
  const right = 426;
  const top = 14;
  const bottom = compact ? 66 : 100;
  const start = Date.parse(first.observedAt);
  const duration = Date.parse(last.observedAt) - start;
  const x = (point: VitalPoint) =>
    duration === 0
      ? (left + right) / 2
      : left + ((Date.parse(point.observedAt) - start) / duration) * (right - left);
  const y = (value: number) =>
    bottom - ((value - domain[0]) / (domain[1] - domain[0])) * (bottom - top);
  const path = (secondary: boolean) => {
    let connected = false;
    return points
      .map((point) => {
        const value = secondary ? point.secondaryValue : point.value;
        if (value === undefined) {
          connected = false;
          return "";
        }
        const segment = `${connected ? "L" : "M"}${x(point).toFixed(2)},${y(value).toFixed(2)}`;
        connected = true;
        return segment;
      })
      .join(" ");
  };
  const ticks = [domain[0], (domain[0] + domain[1]) / 2, domain[1]];
  const middle = new Date(start + duration / 2).toISOString();
  return (
    <figure className="hmc-trace" aria-label={`${title} · Simulated`}>
      <svg role="img" aria-labelledby={id} viewBox={`0 0 ${width} ${bottom + 26}`}>
        <title id={id}>
          {title}: {points.length} simulated samples, {clockTime(first.observedAt)}–
          {clockTime(last.observedAt)} UTC. Scale {domain[0]}–{domain[1]} {unit}.
          {pressure ? " Solid line: systolic. Dashed line: diastolic." : ""}
        </title>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={left}
              x2={right}
              y1={y(tick)}
              y2={y(tick)}
              className="hmc-gridline"
            />
            <text x={left - 8} y={y(tick) + 4} textAnchor="end">
              {tick}
            </text>
          </g>
        ))}
        <line x1={left} x2={left} y1={top} y2={bottom} className="hmc-gridline" />
        <path d={path(false)} className="hmc-chart-line" />
        <circle cx={x(last)} cy={y(last.value)} r="3.5" className="hmc-endpoint" />
        {pressure && (
          <>
            <path d={path(true)} className="hmc-chart-line hmc-chart-secondary" />
            {last.secondaryValue !== undefined && (
              <rect
                x={x(last) - 3}
                y={y(last.secondaryValue) - 3}
                width="6"
                height="6"
                className="hmc-endpoint-secondary"
              />
            )}
          </>
        )}
        {[first.observedAt, middle, last.observedAt].map((time, index) => (
          <text
            key={index}
            x={[left, (left + right) / 2, right][index]}
            y={bottom + 20}
            textAnchor={index === 0 ? "start" : index === 2 ? "end" : "middle"}
          >
            {clockTime(time)}
          </text>
        ))}
      </svg>
      {!compact && (
        <figcaption className="hmc-chart-caption">
          {unit} · UTC{pressure ? " · ━ Systolic / ┄ Diastolic" : ""}
        </figcaption>
      )}
    </figure>
  );
}
