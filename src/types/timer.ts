/**
 * Timer Types - 타이머 기능을 위한 타입 정의
 */

export type TimerMode = "stopwatch" | "countdown";

export interface TimerState {
  mode: TimerMode;
  targetSeconds: number; // 카운트다운 목표 시간 (0 = 스톱워치)
  currentSeconds: number; // 현재 시간 (스톱워치: 증가, 카운트다운: 감소)
  isRunning: boolean;
  isPaused: boolean;
  startedAt: number | null; // 시작 타임스탬프
  completedAt: number | null; // 완료 타임스탬프
}

export interface TimerPreset {
  id: string;
  label: string;
  seconds: number;
  emoji: string;
}

export interface TimerSession {
  id: string;
  mode: TimerMode;
  targetSeconds: number;
  actualSeconds: number; // 실제 진행 시간
  completed: boolean;
  startedAt: number;
  endedAt: number;
  activeSounds: string[]; // 함께 재생된 사운드 ID들
  preset?: string; // 사용한 프리셋 ID
}

export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number; // 총 집중 시간 (초)
  averageSessionTime: number;
  todaySessions: TimerSession[];
  weekStats: WeekDayStat[];
}

export interface WeekDayStat {
  date: string; // YYYY-MM-DD
  sessions: number;
  focusTime: number;
}

export type TimerAction =
  | { type: "toggle-mode" }
  | { type: "set-preset"; preset: TimerPreset }
  | { type: "set-custom"; seconds: number }
  | { type: "start" }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "reset" }
  | { type: "open-settings" }
  | { type: "open-history" };
