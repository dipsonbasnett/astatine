import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={cn("size-9 shrink-0", className)}
    >
      <rect
        width="32"
        height="32"
        rx="7"
        className="fill-canvas stroke-line"
        strokeWidth="1"
      />
      <path
        d="M8.5 23.5 16 8.5l7.5 15M11.8 17.8h8.4"
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-accent"
      />
    </svg>
  );
}
