import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  size?: "title" | "display";
  titleId?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  size = "title",
  titleId,
}: PageHeaderProps) {
  return (
    <header className="flex max-w-3xl flex-col gap-5">
      <p className="font-mono text-label text-accent uppercase">{eyebrow}</p>
      <h1
        id={titleId}
        className={cn("text-ink", size === "display" ? "text-display" : "text-title")}
      >
        {title}
      </h1>
      {description && (
        <p className="max-w-2xl text-base leading-7 text-ink-muted sm:text-lg sm:leading-8">
          {description}
        </p>
      )}
      {meta && <div className="flex flex-wrap items-center gap-3">{meta}</div>}
      {actions && <div className="flex flex-wrap gap-3 pt-1">{actions}</div>}
    </header>
  );
}
