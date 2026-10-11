"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import LoadingSpinner from "@/components/LoadingSpinner";

function currentUrlKey(): string {
  return `${window.location.pathname}${window.location.search}`;
}

function urlKeyFromHistoryUrl(url: string | URL | null | undefined): string | null {
  if (url == null) return null;
  try {
    const parsed = new URL(String(url), window.location.href);
    if (parsed.origin !== window.location.origin) return null;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

/**
 * Shows a centered circular spinner during App Router navigations
 * (e.g. onboarding step 3 → /onboarding/plan).
 *
 * Clears as soon as the committed pathname/search change. Also ignores
 * same-URL history writes — Next.js often calls replaceState after a
 * navigation settles (scroll restoration / internal bookkeeping), and
 * treating those as new navigations left the overlay spinning until a
 * full page refresh.
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
    const markNavigatingIfUrlChanges = (
      url: string | URL | null | undefined
    ) => {
      const nextKey = urlKeyFromHistoryUrl(url);
      // pushState/replaceState with no URL (or the same URL) is Next.js
      // internal bookkeeping — not a user navigation.
      if (nextKey == null || nextKey === currentUrlKey()) return;
      setIsNavigating(true);
    };

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

      const nextKey = urlKeyFromHistoryUrl(anchor.href);
      if (nextKey == null || nextKey === currentUrlKey()) return;
      setIsNavigating(true);
    };

    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args: Parameters<History["pushState"]>) => {
      markNavigatingIfUrlChanges(args[2]);
      return originalPushState(...args);
    };
    history.replaceState = (...args: Parameters<History["replaceState"]>) => {
      markNavigatingIfUrlChanges(args[2]);
      return originalReplaceState(...args);
    };

    const onPopState = () => setIsNavigating(true);

    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onClick, true);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  // Belt-and-suspenders: never leave the overlay up indefinitely if a
  // navigation signal never settles into a routeKey change.
  useEffect(() => {
    if (!isNavigating) return;
    const timeout = window.setTimeout(() => setIsNavigating(false), 8000);
    return () => window.clearTimeout(timeout);
  }, [isNavigating]);

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
