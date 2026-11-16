import { useId } from "react";
import { Link } from "react-router-dom";

import { ArrowRightIcon } from "@/components/icons";
import { findRouteByPath } from "@/app/routes";

export interface RelatedSurfacesProps {
  paths: readonly string[];
  title?: string;
}

export function RelatedSurfaces({
  paths,
  title = "Related surfaces",
}: RelatedSurfacesProps) {
  const headingId = useId();
  const routes = paths
    .map((path) => findRouteByPath(path))
    .filter((route): route is NonNullable<typeof route> => Boolean(route));

  return (
    <nav aria-labelledby={headingId} className="space-y-4">
      <h2 id={headingId} className="font-mono text-label text-ink-subtle uppercase">
        {title}
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {routes.map((route) => {
          const Icon = route.icon;
          return (
            <li key={route.path}>
              <Link
                to={route.path}
                className="group flex h-full items-start gap-3 rounded-control border border-line bg-surface p-4 transition-colors hover:border-accent hover:bg-raised/40"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-control border border-line bg-canvas text-accent">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
                    {route.label}
                    <ArrowRightIcon className="size-3.5 text-ink-subtle group-hover:text-accent" />
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-ink-muted">
                    {route.summary}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
