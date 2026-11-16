import { Link } from "react-router-dom";

import { ShieldIcon } from "@/components/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/button-styles";
import { Card } from "@/components/ui/Card";
import { APP_TAGLINE, REPOSITORY_URL } from "@/lib/constants";
import { DATA_CATEGORIES } from "@/lib/data-policy";

const principles = [
  {
    title: "Boundaries before features",
    description:
      "A surface is only added when its data class, persistence, and sharing behavior are explicit.",
  },
  {
    title: "Crew-readable by default",
    description:
      "Language stays calm, direct, and free of implied diagnosis, prediction, or operational authority.",
  },
  {
    title: "Accessible interaction",
    description:
      "Semantic HTML, keyboard navigation, visible focus, reduced motion, and responsive reflow are baseline requirements.",
  },
  {
    title: "Honest provenance",
    description:
      "Research context is cited. Simulated content is labeled. Neither is ever presented as personal data.",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="About Astatine"
        title="Precision, calm, and explicit boundaries"
        description={`${APP_TAGLINE}. Astatine is an open-source, local-first application for crew-facing health context in simulated long-duration missions — deliberately small, accessible, and free of clinical claims.`}
        meta={
          <>
            <Badge tone="accent">Open source</Badge>
            <span className="font-mono text-label text-ink-subtle uppercase">
              MIT license
            </span>
          </>
        }
      />

      <section aria-labelledby="problem-heading" className="max-w-3xl space-y-3">
        <p className="font-mono text-label text-ink-subtle uppercase">The problem</p>
        <h2
          id="problem-heading"
          className="text-2xl font-semibold tracking-tight text-ink"
        >
          Health context is easy to blur
        </h2>
        <p className="text-sm leading-6 text-ink-muted sm:text-base sm:leading-7">
          Crew in simulated long-duration missions need a calm way to record observations
          and understand context. Tooling can easily blur personal notes, demonstration
          data, and published research into one authoritative-looking interface. Astatine
          keeps those boundaries visible while offering a narrow recorded check-in,
          readiness, and report flow.
        </p>
      </section>

      <section aria-labelledby="principles-heading" className="space-y-5">
        <div className="space-y-2">
          <p className="font-mono text-label text-ink-subtle uppercase">Principles</p>
          <h2
            id="principles-heading"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            What guides the build
          </h2>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {principles.map((principle) => (
            <li key={principle.title}>
              <Card className="h-full p-6">
                <h3 className="text-base font-semibold text-ink">{principle.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
                  {principle.description}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="boundaries-heading" className="space-y-5">
        <div className="space-y-2">
          <p className="font-mono text-label text-ink-subtle uppercase">Data</p>
          <h2
            id="boundaries-heading"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Three separate classes
          </h2>
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
      </section>

      <section aria-labelledby="scope-heading" className="space-y-5">
        <div className="space-y-2">
          <p className="font-mono text-label text-ink-subtle uppercase">Scope</p>
          <h2
            id="scope-heading"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            What this build includes
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-base font-semibold text-ink">Included</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-ink-muted">
              <li>The responsive app shell and accessible navigation</li>
              <li>A typed Dexie/IndexedDB data layer with migrations and validation</li>
              <li>Recorded check-ins with an explainable readiness rubric</li>
              <li>Local report snapshots and clearly labeled simulated telemetry</li>
              <li>Local export, import, and deletion controls</li>
              <li>Error handling, automated tests, and release documentation</li>
            </ul>
          </Card>
          <Card className="p-6">
            <h3 className="text-base font-semibold text-ink">Excluded</h3>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-ink-muted">
              <li>Live sensor integration or device pairing</li>
              <li>Accounts, backend services, and automatic health-data upload</li>
              <li>Diagnosis, prognosis, treatment, or clinical validation</li>
              <li>Simulated clinical content presented as recorded data</li>
              <li>Unverified third-party media or research claims</li>
            </ul>
          </Card>
        </div>
      </section>

      <section aria-labelledby="project-heading" className="space-y-5">
        <div className="space-y-2">
          <p className="font-mono text-label text-ink-subtle uppercase">Project</p>
          <h2
            id="project-heading"
            className="text-2xl font-semibold tracking-tight text-ink"
          >
            Source, license, and contribution
          </h2>
        </div>
        <Card className="p-6 sm:p-7">
          <p className="max-w-prose text-sm leading-6 text-ink-muted">
            Astatine is MIT licensed. The repository documents the product, architecture,
            data policy, research standards, accessibility commitments, and release
            process.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
              className={buttonStyles({ variant: "secondary" })}
            >
              View repository
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <Link to="/settings" className={buttonStyles({ variant: "ghost" })}>
              Local settings
            </Link>
          </div>
        </Card>
      </section>

      <section aria-labelledby="care-heading">
        <Card className="flex flex-col gap-4 border-accent/30 p-6 sm:flex-row sm:items-start sm:p-7">
          <ShieldIcon className="mt-0.5 size-5 shrink-0 text-accent" />
          <div>
            <h2 id="care-heading" className="text-base font-semibold text-ink">
              Not medical care
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-ink-muted">
              Astatine does not diagnose, predict medical events, provide treatment, or
              replace a medical professional. It is not intended for operational or
              clinical decision-making.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
