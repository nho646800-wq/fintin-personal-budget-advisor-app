"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  getNavigationProgress,
  startNavigationProgress,
  stopNavigationProgress,
  subscribeNavigationProgress,
} from "@/lib/navigation-progress";

const MAX_SPINNER_MS = 8000;

/**
 * Shows a centered spinner while an in-app navigation is in flight.
 *
 * Started by link clicks (below) and by `useAppRouter().push/replace`.
 * Cleared as soon as the new pathname/search commit. Browser history is
 * deliberately not watched: Next.js writes history only after the new
 * screen has rendered, so treating those writes as navigations turned the
 * spinner on after loading had already finished.
 */
export default function RouteLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  const isNavigating = useSyncExternalStore(
    subscribeNavigationProgress,
    getNavigationProgress,
    () => false
  );

  useEffect(() => {
    stopNavigationProgress();
  }, [routeKey]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      startNavigationProgress(anchor.href);
    };

    // Capture phase: <Link> calls preventDefault in its own handler.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (!isNavigating) return;
    const timeout = window.setTimeout(stopNavigationProgress, MAX_SPINNER_MS);
    return () => window.clearTimeout(timeout);
  }, [isNavigating]);

  if (!isNavigating) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-white/40">
      <LoadingSpinner size={48} label="Navigating" />
    </div>
  );
}
