import { NavLink } from "react-router-dom";
import { routeDefinitions } from "@/app/routes";
import { cn } from "@/lib/cn";

export interface RouteNavProps {
  ariaLabel: string;
  onNavigate?: () => void;
}

const primaryPaths = ["/", "/reports", "/vitals", "/settings", "/profile"];
const groups = [
  {
    label: "Control center",
    routes: primaryPaths.flatMap((path) =>
      routeDefinitions.filter((route) => route.path === path),
    ),
  },
  {
    label: "Workspace",
    routes: routeDefinitions.filter((route) => !primaryPaths.includes(route.path)),
  },
];

export function RouteNav({ ariaLabel, onNavigate }: RouteNavProps) {
  return (
    <nav aria-label={ariaLabel}>
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-xs text-ink-subtle">{group.label}</p>
            <ul className="mt-2 space-y-1">
              {group.routes.map((route) => {
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
