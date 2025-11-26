/**
 * Analytics Event Tracking
 *
 * 모든 PostHog 이벤트를 중앙 관리합니다.
 * 이벤트 추가/수정 시 이 파일만 수정하면 됩니다.
 *
 * @example
 * import { analytics } from "@/lib/analytics";
 * analytics.playbackSessionStart({ activeSounds: ["rain"], soundCount: 1 });
 */

import posthog from "posthog-js";
import { PostHog as TauriPostHog } from "tauri-plugin-posthog-api";

interface TauriWindow extends Window {
  __TAURI_INTERNALS__?: unknown;
  __TAURI__?: unknown;
}

const isTauri =
  typeof window !== "undefined" &&
  ("__TAURI_INTERNALS__" in (window as unknown as TauriWindow) ||
    "__TAURI__" in (window as unknown as TauriWindow));

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
  playbackSessionStart: async (props: PlaybackSessionStartProps) => {
    if (
      process.env.NODE_ENV === "development" ||
      typeof window !== "undefined"
    ) {
      console.log("[Analytics] playbackSessionStart", props);
    }

    const properties = {
      active_sounds: props.activeSounds,
      sound_count: props.soundCount,
      timestamp: new Date().toISOString(),
    };

    if (isTauri) {
      await TauriPostHog.capture(EVENTS.PLAYBACK_SESSION_START, properties);
    } else {
      posthog.capture(EVENTS.PLAYBACK_SESSION_START, properties);
    }
  },

  /**
   * 재생 세션 종료 (북극성 지표)
   */
  playbackSessionEnd: async (
    props: PlaybackSessionEndProps,
    options?: { transport?: "sendBeacon" }
  ) => {
    if (
      process.env.NODE_ENV === "development" ||
      typeof window !== "undefined"
    ) {
      console.log("[Analytics] playbackSessionEnd", props);
    }

    const properties = {
      session_duration_seconds: props.sessionDurationSeconds,
      total_playback_seconds: props.totalPlaybackSeconds,
      active_sounds: props.activeSounds,
      sound_count: props.soundCount,
      reason: props.reason,
      timestamp: new Date().toISOString(),
    };

    if (isTauri) {
      await TauriPostHog.capture(EVENTS.PLAYBACK_SESSION_END, properties);
    } else {
      posthog.capture(EVENTS.PLAYBACK_SESSION_END, properties, options);
    }
  },

  /**
   * 재생 중 1분마다 heartbeat
   */
  playbackHeartbeat: async (props: PlaybackHeartbeatProps) => {
    // Heartbeat is frequent, maybe log only in dev or verbose
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics] playbackHeartbeat", props);
    }

    const properties = {
      session_duration_seconds: props.sessionDurationSeconds,
      total_playback_seconds: props.totalPlaybackSeconds,
      active_sounds: props.activeSounds,
      sound_count: props.soundCount,
      timestamp: new Date().toISOString(),
    };

    if (isTauri) {
      await TauriPostHog.capture(EVENTS.PLAYBACK_HEARTBEAT, properties);
    } else {
      posthog.capture(EVENTS.PLAYBACK_HEARTBEAT, properties);
    }
  },

  /**
   * 개별 사운드 on/off
   */
  soundToggled: async (props: SoundToggledProps) => {
    if (
      process.env.NODE_ENV === "development" ||
      typeof window !== "undefined"
    ) {
      console.log("[Analytics] soundToggled", props);
    }

    const properties = {
      sound_id: props.soundId,
      action: props.action,
      all_active_sounds: props.allActiveSounds,
      sound_count: props.soundCount,
    };

    if (isTauri) {
      await TauriPostHog.capture(EVENTS.SOUND_TOGGLED, properties);
    } else {
      posthog.capture(EVENTS.SOUND_TOGGLED, properties);
    }
  },
};

export default analytics;
