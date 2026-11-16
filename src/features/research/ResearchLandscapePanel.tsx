import { useId, useState, type ReactNode } from "react";

import { ResearchIcon } from "@/components/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SourceBadge } from "@/components/ui/SourceBadge";
import {
  ACCESS_MODEL_LABELS,
  INGESTION_SUITABILITY_LABELS,
  LANDSCAPE_KIND_LABELS,
  LANDSCAPE_PRIVACY_LABELS,
  LANDSCAPE_SEPARATION_NOTE,
  LANDSCAPE_VERIFIED_AT,
  RESEARCH_DOMAIN_IDS,
  RESEARCH_DOMAIN_LABELS,
  RESEARCH_LANDSCAPE,
  validateResearchLandscape,
  type ResearchDomainId,
  type ResearchLandscapeEntry,
} from "./provenance/landscape";

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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[0.625rem] tracking-[0.12em] text-ink-subtle uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 break-words text-ink-muted">{children}</dd>
    </div>
  );
}

function matchesQuery(entry: ResearchLandscapeEntry, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) return true;

  return [
    entry.name,
    entry.publisher,
    entry.purpose,
    ...entry.dataTypes,
    ...entry.useCases,
    ...entry.domains.map((domain) => RESEARCH_DOMAIN_LABELS[domain]),
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

export interface ResearchLandscapePanelProps {
  entries?: readonly ResearchLandscapeEntry[];
}

export function ResearchLandscapePanel({
  entries = RESEARCH_LANDSCAPE,
}: ResearchLandscapePanelProps) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState<ResearchDomainId | "all">("all");
  const searchId = useId();

  const validation = validateResearchLandscape(entries);
  const visible = entries.filter(
    (entry) =>
      (domain === "all" || entry.domains.includes(domain)) && matchesQuery(entry, query),
  );
  const filtersActive = query.trim().length > 0 || domain !== "all";

  return (
    <section aria-labelledby="research-landscape-heading" className="space-y-5">
      <div>
        <p className="font-mono text-label text-ink-subtle uppercase">Landscape</p>
        <h2
          id="research-landscape-heading"
          className="mt-2 text-2xl font-semibold tracking-tight text-ink"
        >
          Research data landscape
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          Open NASA and partner resources that could supply evidence after review. Each
          entry records its official source, access model, license, privacy status,
          citation requirement, ingestion suitability, and risks.
        </p>
        <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
          {LANDSCAPE_SEPARATION_NOTE}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Input
          id={searchId}
          type="search"
          label="Search the landscape"
          hint="Match a resource by name, publisher, purpose, data type, or use case."
          placeholder="Checksum, sleep, repository…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          label="Health domain"
          hint="Filter resources mapped to one domain."
          value={domain}
          onChange={(event) => setDomain(event.target.value as ResearchDomainId | "all")}
        >
          <option value="all">All domains</option>
          {RESEARCH_DOMAIN_IDS.map((id) => (
            <option key={id} value={id}>
              {RESEARCH_DOMAIN_LABELS[id]}
            </option>
          ))}
        </Select>
      </div>

      {validation.ok ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-xs leading-5 text-ink-subtle">
              Showing {visible.length} of {entries.length} resources, verified{" "}
              {LANDSCAPE_VERIFIED_AT}.
            </p>
            {filtersActive && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setDomain("all");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={<ResearchIcon className="size-5" />}
              title="No resources match"
              description="No landscape entry matches the current search and domain filter. Clear the filters to see the full map of external resources."
            />
          ) : (
            <ul className="grid gap-4 xl:grid-cols-2">
              {visible.map((entry) => (
                <li key={entry.id}>
                  <article className="flex h-full flex-col rounded-panel border border-line bg-surface p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold tracking-tight text-ink">
                          {entry.name}
                        </h3>
                        <p className="mt-1 text-sm text-ink-muted">{entry.publisher}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <SourceBadge category="research">External resource</SourceBadge>
                        <Badge
                          tone={
                            entry.verificationStatus === "verified" ? "accent" : "neutral"
                          }
                        >
                          {entry.verificationStatus === "verified"
                            ? "Verified"
                            : "Partially verified"}
                        </Badge>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-ink-muted">
                      {entry.purpose}
                    </p>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                      <Field label="Kind">{LANDSCAPE_KIND_LABELS[entry.kind]}</Field>
                      <Field label="Access">
                        {ACCESS_MODEL_LABELS[entry.accessModel]}
                      </Field>
                      <Field label="Official source">
                        <ExternalLink href={entry.officialUrl}>
                          Open official page
                        </ExternalLink>
                      </Field>
                      <Field label="License">
                        {entry.licenseUrl ? (
                          <ExternalLink href={entry.licenseUrl}>
                            {entry.licenseName}
                          </ExternalLink>
                        ) : (
                          entry.licenseName
                        )}
                        <span className="mt-1 block text-xs leading-5 text-ink-subtle">
                          {entry.licenseNote}
                        </span>
                      </Field>
                      <Field label="Privacy">
                        {LANDSCAPE_PRIVACY_LABELS[entry.privacyStatus]}
                        <span className="mt-1 block text-xs leading-5 text-ink-subtle">
                          {entry.privacyNote}
                        </span>
                      </Field>
                      <Field label="Citation">
                        <span className="text-xs leading-5 text-ink-subtle">
                          {entry.citationRequirement}
                        </span>
                      </Field>
                      <Field label="Ingestion suitability">
                        {INGESTION_SUITABILITY_LABELS[entry.ingestionSuitability]}
                      </Field>
                      <Field label="Model training">
                        Not approved. No model was trained on this resource.
                      </Field>
                      <Field label="Health domains">
                        <ul className="flex flex-wrap gap-1.5">
                          {entry.domains.map((id) => (
                            <li
                              key={id}
                              className="rounded-full border border-line px-2 py-0.5 text-xs"
                            >
                              {RESEARCH_DOMAIN_LABELS[id]}
                            </li>
                          ))}
                        </ul>
                      </Field>
                      <Field label="Data types">
                        <ul className="space-y-1 text-xs leading-5">
                          {entry.dataTypes.map((type) => (
                            <li key={type}>• {type}</li>
                          ))}
                        </ul>
                      </Field>
                      <Field label="Astatine use cases">
                        <ul className="space-y-1 text-xs leading-5">
                          {entry.useCases.map((useCase) => (
                            <li key={useCase}>• {useCase}</li>
                          ))}
                        </ul>
                      </Field>
                      <Field label="Risks">
                        <ul className="space-y-1 text-xs leading-5">
                          {entry.risks.map((risk) => (
                            <li key={risk}>• {risk}</li>
                          ))}
                        </ul>
                      </Field>
                    </dl>

                    <p className="mt-auto pt-5 text-xs leading-5 text-ink-subtle">
                      Verification: {entry.verificationNote}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div
          role="alert"
          className="rounded-panel border border-danger/40 bg-danger-surface p-4 text-sm leading-6 text-danger"
        >
          The landscape does not pass its own validation gate, so no resource is presented
          as verified.
        </div>
      )}
    </section>
  );
}
