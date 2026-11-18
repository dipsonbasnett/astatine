import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-panel border border-line bg-surface p-6 sm:p-8">
      <span className="grid size-11 place-items-center rounded-control border border-line bg-raised text-accent">
        {icon}
      </span>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        <p className="max-w-prose text-sm leading-6 text-ink-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
