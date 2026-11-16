import { useId, type ReactNode } from "react";

import { Badge } from "@/components/ui/Badge";
import { SourceBadge } from "@/components/ui/SourceBadge";
import { cn } from "@/lib/cn";
import type { DatasetProvenance } from "@/types/health";
import {
  PRIVACY_STATUS_DESCRIPTIONS,
  PRIVACY_STATUS_LABELS,
  datasetIdentifierLabel,
  datasetTrainingDisclosure,
  datasetVerificationLine,
} from "./dataset-integrity";

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="font-medium text-accent underline underline-offset-4 hover:text-accent-strong"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function ProvenanceItem({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 break-words text-ink-muted">{children}</dd>
    </div>
  );
}

export interface DatasetProvenanceCardProps {
  dataset: DatasetProvenance;
}

export function DatasetProvenanceCard({ dataset }: DatasetProvenanceCardProps) {
  const headingId = useId();

  return (
    <article
      aria-labelledby={headingId}
      className="rounded-panel border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={headingId} className="text-lg font-semibold tracking-tight text-ink">
            {dataset.title}
          </h3>
          <p className="mt-1 text-sm text-ink-muted">{dataset.creator}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SourceBadge category="research">Research dataset</SourceBadge>
          <Badge>{PRIVACY_STATUS_LABELS[dataset.privacyStatus]}</Badge>
        </div>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <ProvenanceItem label="Official source">
          <ExternalLink href={dataset.officialSourceUrl}>Open dataset page</ExternalLink>
        </ProvenanceItem>
        <ProvenanceItem label="License">
          <ExternalLink href={dataset.licenseUrl}>{dataset.licenseName}</ExternalLink>
        </ProvenanceItem>
        <ProvenanceItem label="Citation" className="sm:col-span-2">
          {dataset.citation}
        </ProvenanceItem>
        <ProvenanceItem label="Identifier">
          {datasetIdentifierLabel(dataset)}
        </ProvenanceItem>
        <ProvenanceItem label="SHA-256 checksum">
          <code className="font-mono text-xs break-all">
            {dataset.fileChecksum.value}
          </code>
        </ProvenanceItem>
        <ProvenanceItem label="Ingested">
          {dataset.ingestedAt.slice(0, 10)}
        </ProvenanceItem>
        <ProvenanceItem label="Privacy">
          {PRIVACY_STATUS_DESCRIPTIONS[dataset.privacyStatus]}
        </ProvenanceItem>
        <ProvenanceItem label="Intended use" className="sm:col-span-2">
          {dataset.intendedUse}
        </ProvenanceItem>
        <ProvenanceItem label="Limitations" className="sm:col-span-2">
          {dataset.limitations}
        </ProvenanceItem>
        <ProvenanceItem label="Attribution requirements" className="sm:col-span-2">
          <ul className="space-y-1">
            {dataset.attributionRequirements.map((requirement) => (
              <li key={requirement}>• {requirement}</li>
            ))}
          </ul>
        </ProvenanceItem>
        <ProvenanceItem label="Model training" className="sm:col-span-2">
          {datasetTrainingDisclosure(dataset)}
        </ProvenanceItem>
        <ProvenanceItem label="Source verification" className="sm:col-span-2">
          {datasetVerificationLine(dataset)}
        </ProvenanceItem>
      </dl>

      <p className="mt-5 rounded-control border border-dashed border-line px-3 py-2 text-xs leading-5 text-ink-subtle">
        This dataset is research context. It does not describe the selected crew member or
        astronaut, is not medical advice, and is never mixed with recorded or simulated
        data.
      </p>
    </article>
  );
}
