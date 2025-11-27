import type { TimerPreset } from "@/types/timer";

/**
 * 타이머 프리셋 설정
 */
export const TIMER_PRESETS: TimerPreset[] = [
  { id: "pomodoro", label: "presets.pomodoro", seconds: 1500, emoji: "🍅" }, // 25분
  { id: "short-break", label: "presets.shortBreak", seconds: 300, emoji: "☕" }, // 5분
  { id: "long-break", label: "presets.longBreak", seconds: 900, emoji: "🌳" }, // 15분
  { id: "focus", label: "presets.focus", seconds: 2700, emoji: "🎯" }, // 45분
  { id: "hour", label: "presets.hour", seconds: 3600, emoji: "⏰" }, // 60분
];

/**
 * 타이머 알림 사운드 설정
 */
export const TIMER_NOTIFICATION_SOUNDS = {
  complete: {
    id: "timer_complete",
    path: "/sounds/timer-complete.mp3",
    volume: 0.7,
  },
  warning: {
    id: "timer_warning",
    path: "/sounds/timer-warning.mp3",
    volume: 0.5,
  },
} as const;

/**
 * 타이머 경고 기준 (초)
 */
export const TIMER_WARNING_THRESHOLD = 300; // 5분

/**
 * 세션 기록 최대 보관 개수
 */
export const MAX_SESSION_HISTORY = 100;

/**
 * LocalStorage 키
 */
export const STORAGE_KEYS = {
  timerSessions: "zerohz_timer_sessions",
  timerSettings: "zerohz_timer_settings",
} as const;
