"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { TimerMode, TimerState, TimerPreset } from "@/types/timer";
import { TIMER_WARNING_THRESHOLD } from "@/constants/timer";

interface UseTimerOptions {
  onComplete?: () => void;
  onWarning?: () => void;
}

interface UseTimerReturn extends TimerState {
  // 계산된 값
  progress: number; // 0~1 (카운트다운 진행률)
  isWarning: boolean; // 5분 미만 경고 상태
  isCompleted: boolean; // 타이머 완료 여부
  formattedTime: string; // "MM:SS" 형식
  formattedTarget: string; // 목표 시간 "MM:SS" 형식

  // 액션
  setMode: (mode: TimerMode) => void;
  setTarget: (seconds: number) => void;
  setPreset: (preset: TimerPreset) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  toggleMode: () => void;
}

/**
 * 시간을 MM:SS 형식으로 변환
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.abs(seconds) % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * useTimer - 양방향 타이머 훅 (스톱워치 + 카운트다운)
 */
export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const { onComplete, onWarning } = options;

  const [state, setState] = useState<TimerState>({
    mode: "stopwatch",
    targetSeconds: 1500, // 기본 25분
    currentSeconds: 0,
    isRunning: false,
    isPaused: false,
    startedAt: null,
    completedAt: null,
  });

  const warningTriggeredRef = useRef(false);
  const completeTriggeredRef = useRef(false);

  // 타이머 로직
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isRunning && !state.isPaused) {
      interval = setInterval(() => {
        setState((prev) => {
          if (prev.mode === "stopwatch") {
            // 스톱워치: 증가
            return { ...prev, currentSeconds: prev.currentSeconds + 1 };
          } else {
            // 카운트다운: 감소
            const newSeconds = prev.currentSeconds - 1;

            if (newSeconds <= 0) {
              // 완료
              return {
                ...prev,
                currentSeconds: 0,
                isRunning: false,
                completedAt: Date.now(),
              };
            }

            return { ...prev, currentSeconds: newSeconds };
          }
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [state.isRunning, state.isPaused, state.mode]);

  // 계산된 값들
  const progress = useMemo(() => {
    if (state.mode === "stopwatch" || state.targetSeconds === 0) return 0;
    return 1 - state.currentSeconds / state.targetSeconds;
  }, [state.mode, state.currentSeconds, state.targetSeconds]);

  const isWarning = useMemo(() => {
    return (
      state.mode === "countdown" &&
      state.isRunning &&
      state.currentSeconds > 0 &&
      state.currentSeconds <= TIMER_WARNING_THRESHOLD
    );
  }, [state.mode, state.isRunning, state.currentSeconds]);

  const isCompleted = useMemo(() => {
    return (
      state.mode === "countdown" &&
      state.currentSeconds === 0 &&
      state.completedAt !== null
    );
  }, [state.mode, state.currentSeconds, state.completedAt]);

  // 경고 콜백
  useEffect(() => {
    if (isWarning && !warningTriggeredRef.current) {
      warningTriggeredRef.current = true;
      onWarning?.();
    }
  }, [isWarning, onWarning]);

  // 완료 콜백
  useEffect(() => {
    if (isCompleted && !completeTriggeredRef.current) {
      completeTriggeredRef.current = true;
      onComplete?.();
    }
  }, [isCompleted, onComplete]);

  // 액션들
  const setMode = useCallback((mode: TimerMode) => {
    setState((prev) => ({
      ...prev,
      mode,
      currentSeconds: mode === "countdown" ? prev.targetSeconds : 0,
      isRunning: false,
      isPaused: false,
      startedAt: null,
      completedAt: null,
    }));
    warningTriggeredRef.current = false;
    completeTriggeredRef.current = false;
  }, []);

  const toggleMode = useCallback(() => {
    setState((prev) => {
      const newMode = prev.mode === "stopwatch" ? "countdown" : "stopwatch";
      return {
        ...prev,
        mode: newMode,
        currentSeconds: newMode === "countdown" ? prev.targetSeconds : 0,
        isRunning: false,
        isPaused: false,
        startedAt: null,
        completedAt: null,
      };
    });
    warningTriggeredRef.current = false;
    completeTriggeredRef.current = false;
  }, []);

  const setTarget = useCallback((seconds: number) => {
    setState((prev) => ({
      ...prev,
      targetSeconds: seconds,
      currentSeconds: prev.mode === "countdown" ? seconds : prev.currentSeconds,
    }));
    warningTriggeredRef.current = false;
    completeTriggeredRef.current = false;
  }, []);

  const setPreset = useCallback((preset: TimerPreset) => {
    setState((prev) => ({
      ...prev,
      mode: "countdown",
      targetSeconds: preset.seconds,
      currentSeconds: preset.seconds,
      isRunning: false,
      isPaused: false,
      startedAt: null,
      completedAt: null,
    }));
    warningTriggeredRef.current = false;
    completeTriggeredRef.current = false;
  }, []);

  const start = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      startedAt: Date.now(),
      completedAt: null,
      currentSeconds:
        prev.mode === "countdown" && prev.currentSeconds === 0
          ? prev.targetSeconds
          : prev.currentSeconds,
    }));
    warningTriggeredRef.current = false;
    completeTriggeredRef.current = false;
  }, []);

  const pause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resume = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentSeconds: prev.mode === "countdown" ? prev.targetSeconds : 0,
      isRunning: false,
      isPaused: false,
      startedAt: null,
      completedAt: null,
    }));
    warningTriggeredRef.current = false;
    completeTriggeredRef.current = false;
  }, []);

  return {
    ...state,
    progress,
    isWarning,
    isCompleted,
    formattedTime: formatTime(state.currentSeconds),
    formattedTarget: formatTime(state.targetSeconds),
    setMode,
    setTarget,
    setPreset,
    start,
    pause,
    resume,
    reset,
    toggleMode,
  };
}
