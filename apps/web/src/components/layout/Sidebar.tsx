import { Link } from "react-router-dom";

import { BrandLockup } from "@/components/brand/BrandLockup";
import { RouteNav } from "@/components/layout/RouteNav";
import { APP_VERSION } from "@/lib/constants";
import { HelmetPortrait } from "@/features/hmc/ProfileDetails";
import { usePreferences } from "@/preferences/usePreferences";

export function Sidebar() {
  const { preferences } = usePreferences();
  const profileName = preferences.callsign || "Crew member";

  return (
    <aside className="relative z-10 hidden border-r border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col print:hidden">
      <div className="px-5 py-6">
        <BrandLockup />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        <RouteNav ariaLabel="Primary navigation" />
      </div>
      <div className="border-t border-line p-5">
        <Link
          to="/profile"
          className="block rounded-control p-2 -m-2 transition-colors hover:bg-raised"
        >
          <HelmetPortrait />
          <span className="mt-3 block text-xs text-ink-subtle">
            Mission Control · local profile
          </span>
          <span className="mt-2 block truncate text-sm font-medium text-ink">
            {profileName}
          </span>
          <span className="mt-1 block text-xs leading-5 text-ink-subtle">
            Stored in this browser only
          </span>
        </Link>
        <p className="mt-4 font-mono text-xs text-ink-subtle">
          v{APP_VERSION} · Local system
        </p>
      </div>
    </aside>
  );
}
