import { cn } from "@/lib/cn";

import { ORGAN_ACCESSIBLE_LABELS, type OrganId } from "./organ-copy";

function HeartFigure({ motionActive, heartRate }: FigureProps) {
  const duration = Math.min(2, Math.max(0.4, 60 / Math.max(30, heartRate)));

  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
      className="h-auto w-full"
    >
      <g
        className="organ-heartbeat"
        style={{
          animationDuration: `${duration.toFixed(2)}s`,
          animationPlayState: motionActive ? "running" : "paused",
        }}
      >
        <path
          d="M206 144 C204 108 213 82 242 70 C268 60 292 72 298 96"
          fill="none"
          strokeWidth={17}
          strokeLinecap="round"
          className="stroke-accent/25"
        />
        <path
          d="M194 148 C176 118 150 108 124 102"
          fill="none"
          strokeWidth={12}
          strokeLinecap="round"
          className="stroke-accent/20"
        />
        <path
          d="M200 322 C172 302 118 272 94 236 C64 192 76 140 116 120 C152 102 184 112 200 142 C216 112 248 102 284 120 C324 140 336 192 306 236 C282 272 228 302 200 322 Z"
          className="fill-accent/10 stroke-accent"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <path
          d="M200 152 C188 202 188 262 200 316"
          fill="none"
          strokeWidth={2}
          className="stroke-accent/45"
        />
        <path
          d="M118 150 C150 158 174 188 184 222"
          fill="none"
          strokeWidth={1.75}
          className="stroke-accent/35"
        />
        <path
          d="M282 150 C250 158 226 188 216 222"
          fill="none"
          strokeWidth={1.75}
          className="stroke-accent/35"
        />
        <path
          d="M150 236 C164 242 180 246 196 248"
          fill="none"
          strokeWidth={1.5}
          className="stroke-accent/25"
        />
        <path
          d="M250 236 C236 242 220 246 204 248"
          fill="none"
          strokeWidth={1.5}
          className="stroke-accent/25"
        />
      </g>
    </svg>
  );
}

function LungsFigure({ motionActive, respiratoryRate }: FigureProps) {
  const duration = Math.min(8, Math.max(2, 60 / Math.max(6, respiratoryRate)));
  const style = {
    animationDuration: `${duration.toFixed(2)}s`,
    animationPlayState: motionActive ? "running" : "paused",
  };

  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
      className="h-auto w-full"
    >
      <path
        d="M200 40 V126"
        fill="none"
        strokeWidth={18}
        strokeLinecap="round"
        className="stroke-accent/25"
      />
      <path
        d="M200 120 C186 142 172 152 158 158"
        fill="none"
        strokeWidth={12}
        strokeLinecap="round"
        className="stroke-accent/20"
      />
      <path
        d="M200 120 C214 142 228 152 242 158"
        fill="none"
        strokeWidth={12}
        strokeLinecap="round"
        className="stroke-accent/20"
      />

      <g className="organ-lung-left" style={style}>
        <path
          d="M176 130 C142 140 116 184 118 236 C120 274 146 302 172 294 C188 289 192 268 192 234 V150 C192 136 186 128 176 130 Z"
          className="fill-accent/10 stroke-accent"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <path
          d="M138 188 C152 196 166 208 176 224"
          fill="none"
          strokeWidth={1.75}
          className="stroke-accent/30"
        />
        <path
          d="M128 232 C144 240 160 252 172 266"
          fill="none"
          strokeWidth={1.75}
          className="stroke-accent/30"
        />
        <path
          d="M160 156 C168 176 172 200 174 226"
          fill="none"
          strokeWidth={1.5}
          className="stroke-accent/25"
        />
      </g>

      <g className="organ-lung-right" style={style}>
        <path
          d="M224 130 C258 140 284 184 282 236 C280 274 254 302 228 294 C212 289 208 268 208 234 V150 C208 136 214 128 224 130 Z"
          className="fill-accent/10 stroke-accent"
          strokeWidth={3}
          strokeLinejoin="round"
        />
        <path
          d="M262 188 C248 196 234 208 224 224"
          fill="none"
          strokeWidth={1.75}
          className="stroke-accent/30"
        />
        <path
          d="M272 232 C256 240 240 252 228 266"
          fill="none"
          strokeWidth={1.75}
          className="stroke-accent/30"
        />
        <path
          d="M240 156 C232 176 228 200 226 226"
          fill="none"
          strokeWidth={1.5}
          className="stroke-accent/25"
        />
      </g>
    </svg>
  );
}

const BRAIN_NODES = [
  { cx: 170, cy: 150, delay: 0 },
  { cx: 216, cy: 126, delay: 0.8 },
  { cx: 262, cy: 158, delay: 1.6 },
  { cx: 236, cy: 204, delay: 2.4 },
  { cx: 184, cy: 216, delay: 3.2 },
  { cx: 286, cy: 208, delay: 4 },
  { cx: 148, cy: 186, delay: 4.8 },
] as const;

function BrainFigure({ motionActive }: FigureProps) {
  const style = {
    animationDuration: "6s",
    animationPlayState: motionActive ? "running" : "paused",
  };

  return (
    <svg
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
      className="h-auto w-full"
    >
      <path
        d="M126 220 C108 194 110 150 136 120 C164 88 214 74 256 88 C300 102 330 140 330 184 C330 220 314 246 286 258 L274 282 C268 296 254 300 244 290 C236 282 232 268 230 256 C206 262 176 254 156 236 C144 226 132 224 126 220 Z"
        className="fill-accent/10 stroke-accent"
        strokeWidth={3}
        strokeLinejoin="round"
      />
      <path
        d="M170 102 C166 128 178 144 200 152 C222 160 236 178 234 204"
        fill="none"
        strokeWidth={1.75}
        className="stroke-accent/30"
      />
      <path
        d="M142 152 C158 160 168 176 170 196 C172 214 186 224 204 226"
        fill="none"
        strokeWidth={1.75}
        className="stroke-accent/30"
      />
      <path
        d="M244 104 C240 128 250 142 272 152 C286 158 292 172 290 188"
        fill="none"
        strokeWidth={1.75}
        className="stroke-accent/30"
      />
      <path
        d="M290 216 C268 222 248 234 238 250"
        fill="none"
        strokeWidth={1.5}
        className="stroke-accent/25"
      />
      <path
        d="M200 152 L216 126 M200 152 L170 150 M216 126 L262 158 M262 158 L236 204 M236 204 L184 216 M184 216 L170 150 M236 204 L286 208 M184 216 L148 186 M262 158 L286 208"
        fill="none"
        strokeWidth={1}
        className="stroke-accent/20"
      />
      {BRAIN_NODES.map((node) => (
        <circle
          key={`${node.cx}-${node.cy}`}
          cx={node.cx}
          cy={node.cy}
          r={4.5}
          className="organ-brain-node fill-accent"
          style={{
            ...style,
            animationDelay: `${node.delay}s`,
          }}
        />
      ))}
    </svg>
  );
}

interface FigureProps {
  motionActive: boolean;
  heartRate: number;
  respiratoryRate: number;
}

export interface OrganFigureProps {
  organ: OrganId;
  heartRate: number;
  respiratoryRate: number;
  motionActive: boolean;
  className?: string;
}

export function OrganFigure({
  organ,
  heartRate,
  respiratoryRate,
  motionActive,
  className,
}: OrganFigureProps) {
  const props: FigureProps = { motionActive, heartRate, respiratoryRate };

  return (
    <div
      role="img"
      aria-label={ORGAN_ACCESSIBLE_LABELS[organ]}
      className={cn("min-w-0", className)}
    >
      {organ === "heart" && <HeartFigure {...props} />}
      {organ === "lungs" && <LungsFigure {...props} />}
      {organ === "brain" && <BrainFigure {...props} />}
    </div>
  );
}
