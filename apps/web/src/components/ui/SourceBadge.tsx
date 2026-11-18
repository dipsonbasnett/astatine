import type { ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

export type SourceCategory = "recorded" | "simulated" | "research";

export interface SourceBadgeProps {
  category: SourceCategory;
  children: ReactNode;
  className?: string;
}

export function SourceBadge({ category, children, className }: SourceBadgeProps) {
  return (
    <Badge
      tone={category === "recorded" ? "accent" : "neutral"}
      className={cn("normal-case", className)}
    >
      {children}
    </Badge>
  );
}
