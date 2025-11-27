/**
 * Analytics Event Tracking
 *
 * 모든 PostHog 이벤트를 중앙 관리합니다.
 * 이벤트 추가/수정 시 이 파일만 수정하면 됩니다.
 *
 * Note: tauri-plugin-posthog has permission bugs, so we use posthog-js directly
 * in both web and Tauri environments. posthog-js works fine in Tauri's webview.
 *
 * @example
 * import { analytics } from "@/lib/analytics";
 * analytics.playbackSessionStart({ activeSounds: ["rain"], soundCount: 1 });
 */

import posthog from "posthog-js";

interface TauriWindow extends Window {
  __TAURI_INTERNALS__?: unknown;
  __TAURI__?: unknown;
}

const isTauri =
  typeof window !== "undefined" &&
  ("__TAURI_INTERNALS__" in (window as unknown as TauriWindow) ||
    "__TAURI__" in (window as unknown as TauriWindow));

// Initialize PostHog for Tauri environment (web is initialized in providers.tsx)
// Initialize PostHog for Tauri environment (web is initialized in providers.tsx)
if (typeof window !== "undefined" && isTauri) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if (key) {
    console.log("[Analytics] Initializing PostHog for Tauri...");
    try {
      posthog.init(key, {
        api_host: host || "https://app.posthog.com",
        person_profiles: "identified_only",
        persistence: "localStorage",
        capture_pageview: false, // Disable automatic pageviews for desktop app
        loaded: (ph) => {
          console.log(
            "[Analytics] PostHog initialized for Tauri. ID:",
            ph.get_distinct_id()
          );
        },
      });
    } catch (e) {
      console.error("[Analytics] Failed to initialize PostHog:", e);
    }
  } else {
    console.error(
      "[Analytics] FATAL: NEXT_PUBLIC_POSTHOG_KEY not found for Tauri environment"
    );
  }
}

// Debug: Log which analytics backend is being used
if (typeof window !== "undefined") {
  console.log(
    "[Analytics] Environment:",
    isTauri ? "Tauri Desktop" : "Web Browser"
  );
}

// ============================================================================
// Event Names (상수)
// ============================================================================

export const EVENTS = {
  // Playback Events
  PLAYBACK_SESSION_START: "playback_session_start",
  PLAYBACK_SESSION_END: "playback_session_end",
  PLAYBACK_HEARTBEAT: "playback_heartbeat",

  // Sound Events
  SOUND_TOGGLED: "sound_toggled",
} as const;

// ============================================================================
// Event Property Types
// ============================================================================

interface PlaybackSessionStartProps {
  activeSounds: string[];
  soundCount: number;
}

interface PlaybackSessionEndProps {
  sessionDurationSeconds: number;
  totalPlaybackSeconds: number;
  activeSounds: string[];
  soundCount: number;
  reason?: "page_close";
}

interface PlaybackHeartbeatProps {
  sessionDurationSeconds: number;
  totalPlaybackSeconds: number;
  activeSounds: string[];
  soundCount: number;
}

interface SoundToggledProps {
  soundId: string;
  action: "on" | "off";
  allActiveSounds: string[];
  soundCount: number;
}

// ============================================================================
// Analytics Functions
// ============================================================================

export const analytics = {
  /**
   * 재생 세션 시작
   */
  playbackSessionStart: (props: PlaybackSessionStartProps) => {
    console.log("[Analytics] playbackSessionStart", props);

    const properties = {
      active_sounds: props.activeSounds,
      sound_count: props.soundCount,
      timestamp: new Date().toISOString(),
      platform: isTauri ? "desktop" : "web",
    };

    posthog.capture(EVENTS.PLAYBACK_SESSION_START, properties);
  },

  /**
   * 재생 세션 종료 (북극성 지표)
   */
  playbackSessionEnd: (
    props: PlaybackSessionEndProps,
    options?: { transport?: "sendBeacon" }
  ) => {
    console.log("[Analytics] playbackSessionEnd", props);

    const properties = {
      session_duration_seconds: props.sessionDurationSeconds,
      total_playback_seconds: props.totalPlaybackSeconds,
      active_sounds: props.activeSounds,
      sound_count: props.soundCount,
      reason: props.reason,
      timestamp: new Date().toISOString(),
      platform: isTauri ? "desktop" : "web",
    };

    posthog.capture(EVENTS.PLAYBACK_SESSION_END, properties, options);
  },

  /**
   * 재생 중 1분마다 heartbeat
   */
  playbackHeartbeat: (props: PlaybackHeartbeatProps) => {
    console.log("[Analytics] playbackHeartbeat", props);

    const properties = {
      session_duration_seconds: props.sessionDurationSeconds,
      total_playback_seconds: props.totalPlaybackSeconds,
      active_sounds: props.activeSounds,
      sound_count: props.soundCount,
      timestamp: new Date().toISOString(),
      platform: isTauri ? "desktop" : "web",
    };

    posthog.capture(EVENTS.PLAYBACK_HEARTBEAT, properties);
  },

  /**
   * 개별 사운드 on/off
   */
  soundToggled: (props: SoundToggledProps) => {
    console.log("[Analytics] soundToggled", props);

    const properties = {
      sound_id: props.soundId,
      action: props.action,
      all_active_sounds: props.allActiveSounds,
      sound_count: props.soundCount,
      platform: isTauri ? "desktop" : "web",
    };

    posthog.capture(EVENTS.SOUND_TOGGLED, properties);
  },
};

export default analytics;
