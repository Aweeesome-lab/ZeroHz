"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import React from "react";

if (typeof window !== "undefined") {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (key) {
    posthog.init(key, {
      api_host: host || "https://app.posthog.com",
      person_profiles: "identified_only",
      persistence: "localStorage", // Critical for Tauri/Desktop apps
      debug: true, // Enable debug mode to see logs in production console
      loaded: (ph) => {
        console.log("PostHog loaded successfully", ph);
      },
    });
  } else {
    console.error(
      "PostHog initialization failed: NEXT_PUBLIC_POSTHOG_KEY is missing."
    );
  }
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
