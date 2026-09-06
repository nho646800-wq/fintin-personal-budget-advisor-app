"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type GeneratePlanState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; content: string; generatedAt: Date };

type GeneratePlanResult = {
  content: string;
};

/**
 * Module-level in-flight promise so React Strict Mode remounts (and brief
 * unmounts during PageTransition exit/enter) reuse the same Gemini request
 * instead of aborting it and leaving the UI stuck until a manual refresh.
 */
let inFlightPlanRequest: Promise<GeneratePlanResult> | null = null;

async function requestPlan(): Promise<GeneratePlanResult> {
  if (!inFlightPlanRequest) {
    inFlightPlanRequest = (async () => {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      let body: { content?: string; error?: string } = {};
      try {
        body = await response.json();
      } catch {
        body = {};
      }

      if (!response.ok) {
        throw new Error(
          body.error ?? "Something went wrong generating your plan."
        );
      }

      if (!body.content || typeof body.content !== "string") {
        throw new Error("The plan response was empty. Please try again.");
      }

      return { content: body.content };
    })().finally(() => {
      inFlightPlanRequest = null;
    });
  }

  return inFlightPlanRequest;
}

/**
 * Waits for Gemini to finish generating the initial plan, then updates
 * React state so the UI reflects the response without a manual refresh.
 *
 * - Auto-starts on mount
 * - Shares one in-flight request across remounts
 * - Exposes `retry()` so error recovery re-triggers the request
 */
export function useGeneratePlan() {
  const [state, setState] = useState<GeneratePlanState>({ status: "loading" });
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);

  const run = useCallback(async (options?: { showLoading?: boolean }) => {
    const requestId = ++requestIdRef.current;

    // Only flip back to loading on explicit retries. Initial mount already
    // starts in the loading state, which avoids a synchronous setState
    // inside the mount effect (flagged by react-hooks/set-state-in-effect).
    if (options?.showLoading) {
      setState({ status: "loading" });
    }

    try {
      const result = await requestPlan();

      // Ignore stale completions if a newer retry superseded this one.
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setState({
        status: "success",
        content: result.content,
        generatedAt: new Date(),
      });
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong generating your plan.",
      });
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Defer so the fetch (and any resulting setState) runs after the effect
    // body returns — keeps react-hooks/set-state-in-effect happy while still
    // auto-starting generation on mount.
    const timer = window.setTimeout(() => {
      void run();
    }, 0);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
    };
  }, [run]);

  const retry = useCallback(() => {
    void run({ showLoading: true });
  }, [run]);

  return {
    ...state,
    retry,
    isLoading: state.status === "loading",
    isError: state.status === "error",
    isSuccess: state.status === "success",
  };
}
