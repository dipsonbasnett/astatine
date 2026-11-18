import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type InlineAlertTone = "info" | "success" | "danger";

const tones: Record<InlineAlertTone, string> = {
  info: "border-line-strong bg-raised text-ink",
  success: "border-accent/30 bg-accent/10 text-ink",
  danger: "border-danger/30 bg-danger-surface text-ink",
};

export interface InlineAlertProps {
  tone?: InlineAlertTone;
  title: string;
  children?: ReactNode;
  className?: string;
  live?: boolean;
}

export function InlineAlert({
  tone = "info",
  title,
  children,
  className,
  live,
}: InlineAlertProps) {
  const isLive = live ?? tone !== "info";

  return (
    <div
      role={isLive ? (tone === "danger" ? "alert" : "status") : undefined}
      className={cn("rounded-control border px-4 py-3", tones[tone], className)}
    >
      <p className="text-sm font-medium text-ink">{title}</p>
      {children && (
        <div className="mt-1 space-y-1 text-sm leading-6 text-ink-muted">{children}</div>
      )}
    </div>
  );
}
