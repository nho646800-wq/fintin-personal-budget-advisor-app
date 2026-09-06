"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

/**
 * Shows a centered circular spinner whenever the app is mid-navigation
 * (e.g. onboarding step 3 → /onboarding/plan). Detects App Router
 * navigations via History API hooks and clears once the pathname/search
 * settle on the destination route.
 */
export default function RouteLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;

  const [isNavigating, setIsNavigating] = useState(false);
  const [seenRouteKey, setSeenRouteKey] = useState(routeKey);

  // Clear the spinner when the committed route changes. Adjusting state
  // during render in response to a changed prop/path is the React-supported
  // alternative to setState-inside-effect (see react.dev "adjusting state
  // when a prop changes").
  if (routeKey !== seenRouteKey) {
    setSeenRouteKey(routeKey);
    if (isNavigating) {
      setIsNavigating(false);
    }
  }

  useEffect(() => {
    const markNavigating = () => setIsNavigating(true);

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

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      const current = window.location.pathname + window.location.search;
      const next = url.pathname + url.search;
      if (current !== next) {
        markNavigating();
      }
    };

    // Next.js App Router navigations (Link and router.push) go through
    // history.pushState / replaceState. Patching those catches programmatic
    // navigations that never fire an <a> click — like step 3 → plan.
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args: Parameters<History["pushState"]>) => {
      markNavigating();
      return originalPushState(...args);
    };
    history.replaceState = (...args: Parameters<History["replaceState"]>) => {
      markNavigating();
      return originalReplaceState(...args);
    };

    window.addEventListener("popstate", markNavigating);
    document.addEventListener("click", onClick, true);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", markNavigating);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  if (!isNavigating) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-white/40"
      aria-hidden={false}
    >
      <LoadingSpinner size={48} label="Navigating" />
    </div>
  );
}
