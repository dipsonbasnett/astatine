import { useEffect, useRef, type RefObject } from "react";
import { useLocation } from "react-router-dom";

import { findRouteByPath } from "@/app/routes";

export function useRouteEffects(mainRef: RefObject<HTMLElement | null>): string {
  const { pathname } = useLocation();
  const initialRender = useRef(true);
  const route = findRouteByPath(pathname);

  useEffect(() => {
    document.title = route?.documentTitle ?? "Page not found · Astatine";
  }, [route]);

  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      return;
    }

    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname, mainRef]);

  return route ? `${route.label} page` : "Page not found";
}
