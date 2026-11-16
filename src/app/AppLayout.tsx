import { Suspense, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { DatabaseStatusNotice } from "@/components/layout/DatabaseStatusNotice";
import { Footer } from "@/components/layout/Footer";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { RouteFallback } from "@/components/layout/RouteFallback";
import { Sidebar } from "@/components/layout/Sidebar";
import { SkipLink } from "@/components/layout/SkipLink";
import { useRouteEffects } from "@/app/useRouteEffects";

export function AppLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const announcement = useRouteEffects(mainRef);
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
      <SkipLink />
      <Sidebar />
      <div className="flex min-w-0 flex-col">
        <MobileHeader />
        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="flex-1 focus:outline-none"
        >
          <div className="mx-auto w-full max-w-shell px-page-x pt-page-y pb-page-y">
            <DatabaseStatusNotice />
            <ErrorBoundary key={pathname}>
              <Suspense fallback={<RouteFallback />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
        <Footer />
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
