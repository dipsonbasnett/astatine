import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control text-sm font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-55";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-strong",
  secondary:
    "border border-line-control bg-surface text-ink hover:border-accent hover:bg-raised",
  ghost: "text-ink-muted hover:bg-raised hover:text-ink",
  danger: "border border-danger/40 bg-danger-surface text-danger hover:border-danger/60",
};

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3",
  md: "min-h-11 px-4",
  lg: "min-h-12 px-5 text-base",
};

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleOptions = {}): string {
  return cn(base, variants[variant], sizes[size], className);
}
