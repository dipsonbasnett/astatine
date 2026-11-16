import { Link } from "react-router-dom";

import { ArrowRightIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/Card";
import { featuredRoutes } from "@/app/routes";
import { APP_TAGLINE, APP_VERSION } from "@/lib/constants";
import { DATA_CATEGORIES } from "@/lib/data-policy";

function BoundaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-right font-mono text-xs tracking-[0.08em] text-ink uppercase">
        {value}
      </dd>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col gap-section">
      <section
        aria-labelledby="hero-heading"
        className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start"
      >
        <PageHeader
          size="display"
          titleId="hero-heading"
          eyebrow="Simulated mission health · Local-first"
          title={APP_TAGLINE}
          description="Astatine is a calm, browser-local workspace for crew in simulated long-duration missions. It now includes recorded check-ins, an explainable readiness rubric, local report snapshots, and clearly separated simulation — without overstating what this build can do."
          meta={
            <>
              <Badge tone="accent">Browser-local</Badge>
              <span className="font-mono text-label text-ink-subtle uppercase">
                No sensors · No uploads · Not medical care
              </span>
            </>
          }
          actions={
            <>
              <Link to="/check-in" className={buttonStyles({ size: "lg" })}>
                Record a check-in
              </Link>
              <Link
                to="/about"
                className={buttonStyles({ variant: "secondary", size: "lg" })}
              >
                Read the boundaries
              </Link>
            </>
          }
        />

        <Card className="p-6 lg:mt-2">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-label text-ink-subtle uppercase">
              Operating boundaries
            </p>
            <Badge tone="accent">Local only</Badge>
          </div>
          <dl className="mt-4 divide-y divide-line">
            <BoundaryRow label="Data residency" value="This browser" />
            <BoundaryRow label="Live sensors" value="None" />
            <BoundaryRow label="Automatic uploads" value="None" />
            <BoundaryRow label="Clinical use" value="Not intended" />
            <BoundaryRow label="Build" value={`v${APP_VERSION}`} />
          </dl>
          <p className="mt-4 text-xs leading-5 text-ink-subtle">
            These are product boundaries, not health telemetry.
          </p>
        </Card>
      </section>

      <section aria-labelledby="workspace-heading" className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <p className="font-mono text-label text-ink-subtle uppercase">Workspace</p>
          <h2
            id="workspace-heading"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Six surfaces, one boundary model
          </h2>
          <p className="text-sm leading-6 text-ink-muted">
            Available surfaces stay intentionally narrow: recorded check-in, explainable
            recovery readiness, a self-report health brief, labeled simulation, and local
            report snapshots. The readiness coach links a small set of verified public
            research context. Mission renders a deterministic simulation, and research
            shows an integrity workflow with an empty dataset registry.
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredRoutes.map((route, index) => {
            const Icon = route.icon;

            return (
              <li key={route.path}>
                <Link
                  to={route.path}
                  className="group flex h-full flex-col rounded-panel border border-line-control bg-surface p-6 transition-colors hover:border-accent hover:bg-raised/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid size-10 place-items-center rounded-control border border-line bg-canvas text-accent">
                      <Icon className="size-5" />
                    </span>
                    <Badge>{route.status === "planned" ? "Planned" : "Available"}</Badge>
                  </div>
                  <p className="mt-6 font-mono text-label text-ink-subtle uppercase">
                    {String(index + 1).padStart(2, "0")} / {route.group}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">
                    {route.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">{route.summary}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium text-ink-subtle group-hover:text-accent">
                    Open surface
                    <ArrowRightIcon className="size-4" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="data-heading" className="space-y-6">
        <div className="max-w-2xl space-y-2">
          <p className="font-mono text-label text-ink-subtle uppercase">Data model</p>
          <h2
            id="data-heading"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Three classes. No mixing.
          </h2>
          <p className="text-sm leading-6 text-ink-muted">
            Recorded observations, demonstration content, and research context are
            separate by design. They must never be blended into one deceptively
            authoritative view.
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {DATA_CATEGORIES.map((category) => (
            <li key={category.id}>
              <Card className="h-full p-6">
                <Badge tone={category.id === "recorded" ? "accent" : "neutral"}>
                  {category.label}
                </Badge>
                <p className="mt-4 text-sm leading-6 text-ink-muted">
                  {category.summary}
                </p>
              </Card>
            </li>
          ))}
        </ul>
        <p className="max-w-prose text-sm leading-6 text-ink-subtle">
          Research context is limited to one verified public NASA program page linked
          inside the readiness coach; it is excluded from readiness scoring and reports.
          Simulated telemetry is generated only when you ask for it, labeled simulated
          wherever it appears, and excluded from recorded readiness and reports.{" "}
          <Link
            to="/about"
            className="text-accent underline underline-offset-4 hover:text-accent-strong"
          >
            Read the full product boundaries
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
