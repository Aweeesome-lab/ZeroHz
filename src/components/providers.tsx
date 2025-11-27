"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import React, { createContext, useContext, useState } from "react";

interface AnalyticsStatus {
  isReady: boolean;
  error: string | null;
}

const AnalyticsStatusContext = createContext<AnalyticsStatus>({
  isReady: false,
  error: null,
});

export const useAnalyticsStatus = () => useContext(AnalyticsStatusContext);

interface TauriWindow extends Window {
  __TAURI_INTERNALS__?: unknown;
  __TAURI__?: unknown;
}

if (typeof window !== "undefined") {
  const tauriWindow = window as unknown as TauriWindow;
  const isTauri =
    "__TAURI_INTERNALS__" in tauriWindow || "__TAURI__" in tauriWindow;

  if (!isTauri) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (key) {
      posthog.init(key, {
        api_host: host || "https://app.posthog.com",
        person_profiles: "identified_only",
        persistence: "localStorage", // Critical for Tauri/Desktop apps
        autocapture: false, // Disable automatic click/input tracking - only custom events
        capture_pageview: false, // Disable automatic pageviews
        capture_pageleave: false, // Disable automatic page leave tracking
        debug: process.env.NODE_ENV === "development",
        loaded: (ph) => {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "PostHog loaded successfully. ID:",
              ph.get_distinct_id()
            );
          }
        },
      });
    } else {
      console.error(
        "PostHog initialization failed: NEXT_PUBLIC_POSTHOG_KEY is missing.",
        "Env:",
        process.env.NODE_ENV
      );
    }
  }
}

import { analyticsState } from "@/lib/analytics"; // Import to force initialization side-effect

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  const [status] = useState<AnalyticsStatus>(() => {
    if (typeof window !== "undefined") {
      const tauriWindow = window as unknown as TauriWindow;
      if ("__TAURI_INTERNALS__" in tauriWindow || "__TAURI__" in tauriWindow) {
        // For Tauri, we check the state from analytics.ts
        // Note: It might not be fully initialized yet (async loaded callback),
        // but if the key was present, we consider it "ready" to accept events (they buffer).
        // If there was a sync error (missing key), it would be in analyticsState.error.

        if (analyticsState.error) {
          return { isReady: false, error: analyticsState.error };
        }

        // Check env var as fallback/confirmation
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
          return { isReady: true, error: null };
        } else {
          return { isReady: false, error: "Missing Key" };
        }
      }
    }

    // Check if initialized
    // Note: posthog.init is called at module level, but we check the env var here for status
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key) {
      return { isReady: true, error: null };
    } else {
      return {
        isReady: false,
        error: "Missing PostHog Key (Check Env Vars)",
      };
    }
  });

  return (
    <AnalyticsStatusContext.Provider value={status}>
      <PostHogProvider client={posthog}>{children}</PostHogProvider>
    </AnalyticsStatusContext.Provider>
  );
}
