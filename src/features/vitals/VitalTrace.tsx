import { formatDateTime } from "@/lib/format";
import type { VitalPoint } from "@/types/health";

export interface VitalTraceProps {
  id: string;
  title: string;
  category: "recorded" | "simulated";
  points: readonly VitalPoint[];
  unit: string;
  decimals: number;
  emptyMessage: string;
}

function formatNumber(value: number, decimals: number): string {
  return value
    .toFixed(decimals)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

const WIDTH = 100;
const TOP = 4;
const BOTTOM = 32;

function buildPath(points: readonly VitalPoint[]): string {
  if (points.length === 0) return "";

  const values = points.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const spread = maximum - minimum;

  return points
    .map((point, index) => {
      const x = points.length === 1 ? WIDTH / 2 : (index / (points.length - 1)) * WIDTH;
      const ratio = spread === 0 ? 0.5 : (point.value - minimum) / spread;
      const y = BOTTOM - ratio * (BOTTOM - TOP);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function VitalTrace({
  id,
  title,
  category,
  points,
  unit,
  decimals,
  emptyMessage,
}: VitalTraceProps) {
  if (points.length === 0) {
    return (
      <div className="flex min-h-28 items-center justify-center rounded-control border border-dashed border-line px-4 py-6 text-center text-xs leading-5 text-ink-subtle">
        {emptyMessage}
      </div>
    );
  }

  const values = points.map((point) => point.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const first = points[0];
  const latest = points[points.length - 1];
  const path = buildPath(points);
  const summary = `${title}. ${points.length} ${category} values from ${formatNumber(
    minimum,
    decimals,
  )} to ${formatNumber(maximum, decimals)} ${unit}. First ${
    first ? formatDateTime(first.observedAt) : "unknown"
  }, latest ${latest ? formatDateTime(latest.observedAt) : "unknown"}.`;

  return (
    <figure aria-labelledby={id} className="space-y-2">
      <figcaption id={id} className="sr-only">
        {title}
      </figcaption>
      <svg
        role="img"
        aria-label={summary}
        viewBox={`0 0 ${WIDTH} 36`}
        preserveAspectRatio="none"
        className="h-28 w-full sm:h-32"
      >
        <line
          x1={0}
          x2={WIDTH}
          y1={TOP}
          y2={TOP}
          className="stroke-line"
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={0}
          x2={WIDTH}
          y1={BOTTOM}
          y2={BOTTOM}
          className="stroke-line"
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          fill="none"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          strokeDasharray={category === "simulated" ? "4 3" : undefined}
          className={category === "simulated" ? "stroke-ink-subtle" : "stroke-accent"}
        />
      </svg>
      <ul className="sr-only">
        {points.map((point) => (
          <li key={point.observedAt}>
            {formatDateTime(point.observedAt)}: {formatNumber(point.value, decimals)}{" "}
            {unit} ({category})
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[0.625rem] tracking-[0.08em] text-ink-subtle uppercase">
        <span>{first ? formatDateTime(first.observedAt) : ""}</span>
        <span>
          {formatNumber(minimum, decimals)}–{formatNumber(maximum, decimals)} {unit}
        </span>
        <span>{latest ? formatDateTime(latest.observedAt) : ""}</span>
      </div>
    </figure>
  );
}
