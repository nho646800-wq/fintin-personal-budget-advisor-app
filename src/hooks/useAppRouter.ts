"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { startNavigationProgress } from "@/lib/navigation-progress";

/**
 * Drop-in replacement for `useRouter` that shows the route loading spinner
 * for programmatic navigations. Next.js only updates browser history after
 * the new screen has rendered, so the spinner has to be started here.
 */
export function useAppRouter(): AppRouterInstance {
  const router = useRouter();

  return useMemo(
    () => ({
      ...router,
      push: (href, options) => {
        startNavigationProgress(href);
        router.push(href, options);
      },
      replace: (href, options) => {
        startNavigationProgress(href);
        router.replace(href, options);
      },
    }),
    [router]
  );
}
