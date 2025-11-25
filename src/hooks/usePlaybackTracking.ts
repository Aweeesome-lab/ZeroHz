"use client";

import { useEffect, useRef, useCallback } from "react";
import type { SoundType } from "@/types/audio";
import { analytics } from "@/lib/analytics";

/**
 * Playback tracking intervals (in seconds)
 */
const TRACKING_INTERVAL_SECONDS = 60; // Report every minute

/**
 * usePlaybackTracking - 재생 시간 트래킹 훅 (북극성 지표)
 *
 * 트래킹 이벤트:
 * - playback_session_start: 재생 세션 시작
 * - playback_session_end: 재생 세션 종료 (총 재생 시간 포함)
 * - playback_heartbeat: 1분마다 재생 중임을 알림
 * - sound_toggled: 사운드 on/off
 *
 * @param isPlaying - 현재 재생 중인지 여부
 * @param activeSounds - 활성화된 사운드 Set
 */
export function usePlaybackTracking(
  isPlaying: boolean,
  activeSounds: Set<SoundType>
) {
  const sessionStartTimeRef = useRef<number | null>(null);
  const totalPlaybackTimeRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(false);

  const hasActiveSounds = activeSounds.size > 0;
  const isActivelyPlaying = isPlaying && hasActiveSounds;

  // Get active sound names for tracking
  const getActiveSoundNames = useCallback(() => {
    return Array.from(activeSounds);
  }, [activeSounds]);

  // Start session
  const startSession = useCallback(() => {
    if (isActiveRef.current) return;

    sessionStartTimeRef.current = Date.now();
    isActiveRef.current = true;

    analytics.playbackSessionStart({
      activeSounds: getActiveSoundNames(),
      soundCount: activeSounds.size,
    });
  }, [getActiveSoundNames, activeSounds.size]);

  // End session
  const endSession = useCallback(() => {
    if (!isActiveRef.current || !sessionStartTimeRef.current) return;

    const sessionDuration = Math.floor(
      (Date.now() - sessionStartTimeRef.current) / 1000
    );
    totalPlaybackTimeRef.current += sessionDuration;

    analytics.playbackSessionEnd({
      sessionDurationSeconds: sessionDuration,
      totalPlaybackSeconds: totalPlaybackTimeRef.current,
      activeSounds: getActiveSoundNames(),
      soundCount: activeSounds.size,
    });

    sessionStartTimeRef.current = null;
    isActiveRef.current = false;
  }, [getActiveSoundNames, activeSounds.size]);

  // Handle playback state changes
  useEffect(() => {
    if (isActivelyPlaying) {
      startSession();
    } else {
      endSession();
    }
  }, [isActivelyPlaying, startSession, endSession]);

  // Heartbeat: send periodic updates while playing
  useEffect(() => {
    if (!isActivelyPlaying) return;

    const interval = setInterval(() => {
      if (!sessionStartTimeRef.current) return;

      const sessionDuration = Math.floor(
        (Date.now() - sessionStartTimeRef.current) / 1000
      );

      analytics.playbackHeartbeat({
        sessionDurationSeconds: sessionDuration,
        totalPlaybackSeconds: totalPlaybackTimeRef.current + sessionDuration,
        activeSounds: getActiveSoundNames(),
        soundCount: activeSounds.size,
      });
    }, TRACKING_INTERVAL_SECONDS * 1000);

    return () => clearInterval(interval);
  }, [isActivelyPlaying, getActiveSoundNames, activeSounds.size]);

  // Track sound changes (when sounds are added/removed during playback)
  const prevActiveSoundsRef = useRef<Set<SoundType>>(new Set());

  useEffect(() => {
    if (!isActivelyPlaying) {
      prevActiveSoundsRef.current = new Set(activeSounds);
      return;
    }

    const prev = prevActiveSoundsRef.current;
    const current = activeSounds;

    // Find added sounds
    const added = Array.from(current).filter((s) => !prev.has(s));
    // Find removed sounds
    const removed = Array.from(prev).filter((s) => !current.has(s));

    // Send individual event per sound for easier PostHog breakdown analysis
    added.forEach((soundId) => {
      analytics.soundToggled({
        soundId,
        action: "on",
        allActiveSounds: getActiveSoundNames(),
        soundCount: activeSounds.size,
      });
    });

    removed.forEach((soundId) => {
      analytics.soundToggled({
        soundId,
        action: "off",
        allActiveSounds: getActiveSoundNames(),
        soundCount: activeSounds.size,
      });
    });

    prevActiveSoundsRef.current = new Set(current);
  }, [activeSounds, isActivelyPlaying, getActiveSoundNames]);

  // Send session end on page unload/close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isActiveRef.current && sessionStartTimeRef.current) {
        const sessionDuration = Math.floor(
          (Date.now() - sessionStartTimeRef.current) / 1000
        );

        // Use sendBeacon transport for reliable tracking on page close
        analytics.playbackSessionEnd(
          {
            sessionDurationSeconds: sessionDuration,
            totalPlaybackSeconds:
              totalPlaybackTimeRef.current + sessionDuration,
            activeSounds: Array.from(prevActiveSoundsRef.current),
            soundCount: prevActiveSoundsRef.current.size,
            reason: "page_close",
          },
          { transport: "sendBeacon" }
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);
}
