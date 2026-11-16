import type { ReactNode } from "react";

import { AlertIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export interface ErrorStateProps {
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

export function ErrorState({ title, description, actions, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-5 rounded-panel border border-danger/30 bg-danger-surface p-6 sm:p-8",
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-control border border-danger/30 bg-canvas text-danger">
        <AlertIcon className="size-5" />
      </span>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="max-w-prose text-sm leading-6 text-ink-muted">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
