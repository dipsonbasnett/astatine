import { NavLink } from "react-router-dom";

import { NAV_GROUPS, routesForGroup } from "@/app/routes";
import { cn } from "@/lib/cn";

export interface RouteNavProps {
  ariaLabel: string;
  onNavigate?: () => void;
}

export function RouteNav({ ariaLabel, onNavigate }: RouteNavProps) {
  return (
    <nav aria-label={ariaLabel}>
      <div className="space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group}>
            <p className="px-3 font-mono text-label text-ink-subtle uppercase">{group}</p>
            <ul className="mt-2 space-y-1">
              {routesForGroup(group).map((route) => {
                const Icon = route.icon;

                return (
                  <li key={route.path}>
                    <NavLink
                      to={route.path}
                      end={route.path === "/"}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "flex min-h-11 items-center gap-3 rounded-control px-3 text-sm transition-colors",
                          isActive
                            ? "relative bg-raised font-medium text-ink before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-accent before:content-['']"
                            : "text-ink-muted hover:bg-raised/60 hover:text-ink",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              "size-[1.15rem] shrink-0",
                              isActive ? "text-accent" : "text-ink-subtle",
                            )}
                          />
                          <span>{route.label}</span>
                          {route.status === "planned" && (
                            <span className="ml-auto font-mono text-label tracking-[0.14em] text-ink-subtle uppercase">
                              Soon
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
