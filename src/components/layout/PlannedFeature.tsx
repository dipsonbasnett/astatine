import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { dataCategoryLabel, type DataCategory } from "@/lib/data-policy";

export interface PlannedFeatureProps {
  eyebrow: string;
  title: string;
  description: string;
  category: DataCategory;
  icon: ReactNode;
  intentTitle: string;
  capabilities: readonly string[];
  boundary: string;
}

export function PlannedFeature({
  eyebrow,
  title,
  description,
  category,
  icon,
  intentTitle,
  capabilities,
  boundary,
}: PlannedFeatureProps) {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        meta={
          <>
            <Badge>Planned</Badge>
            <span className="font-mono text-label text-ink-subtle uppercase">
              Data class / {dataCategoryLabel(category)}
            </span>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <EmptyState
          icon={icon}
          title="Not available in this foundation build"
          description="This route exists so the information architecture, data boundary, and accessibility behavior can be reviewed before any feature logic is added."
          action={
            <Link to="/" className={buttonStyles({ variant: "secondary", size: "sm" })}>
              Return to overview
            </Link>
          }
        />

        <Card className="p-6">
          <p className="font-mono text-label text-ink-subtle uppercase">Design intent</p>
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-ink">
            {intentTitle}
          </h2>
          <ol className="mt-5 space-y-4">
            {capabilities.map((capability, index) => (
              <li key={capability} className="flex gap-3 text-sm leading-6">
                <span aria-hidden="true" className="font-mono text-xs text-accent">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-ink-muted">{capability}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="p-6 sm:p-7">
        <p className="font-mono text-label text-ink-subtle uppercase">Boundary</p>
        <p className="mt-3 max-w-prose text-sm leading-6 text-ink-muted">{boundary}</p>
      </Card>
    </div>
  );
}
