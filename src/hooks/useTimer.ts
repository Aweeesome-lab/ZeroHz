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
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * useTimer - 양방향 타이머 훅 (스톱워치 + 카운트다운)
 * 정확도 개선: setInterval 카운트 방식 -> Timestamp Delta 방식
 * 백그라운드 지원: requestAnimationFrame -> setInterval (100ms)
 */
export function useTimer(options: UseTimerOptions = {}): UseTimerReturn {
  const { onComplete, onWarning } = options;

  // 내부 상태: 화면 렌더링용 state와 별개로 정확한 시간 계산을 위한 ref 사용
  const [state, setState] = useState<TimerState>({
    mode: "stopwatch",
    targetSeconds: 1500, // 기본 25분
    currentSeconds: 0,
    isRunning: false,
    isPaused: false,
    startedAt: null,
    completedAt: null,
  });

  // 시간 계산을 위한 Refs
  const startTimeRef = useRef<number | null>(null); // 현재 실행 구간의 시작 시간 (Date.now())
  const accumulatedTimeRef = useRef<number>(0); // 이전 실행 구간들의 누적 시간 (ms)

  const warningTriggeredRef = useRef(false);
  const completeTriggeredRef = useRef(false);

  // 틱 업데이트 함수
  const updateTick = useCallback(() => {
    if (!startTimeRef.current) return;

    const now = Date.now();
    const elapsedMs = now - startTimeRef.current + accumulatedTimeRef.current;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);

    setState((prev) => {
      let newCurrentSeconds = 0;

      if (prev.mode === "stopwatch") {
        // 스톱워치: 0에서 시작해서 증가
        newCurrentSeconds = elapsedSeconds;
      } else {
        // 카운트다운: target에서 시작해서 감소
        newCurrentSeconds = Math.max(0, prev.targetSeconds - elapsedSeconds);
      }

      // 상태 변경이 필요할 때만 업데이트 (불필요한 렌더링 방지)
      if (prev.currentSeconds === newCurrentSeconds) {
        return prev;
      }

      // 카운트다운 완료 체크
      if (
        prev.mode === "countdown" &&
        newCurrentSeconds <= 0 &&
        !prev.completedAt
      ) {
        return {
          ...prev,
          currentSeconds: 0,
          isRunning: false,
          completedAt: Date.now(),
        };
      }

      return {
        ...prev,
        currentSeconds: newCurrentSeconds,
      };
    });
  }, []);

  // 타이머 실행/정지 관리
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (state.isRunning && !state.isPaused) {
      // 실행 중: setInterval 시작 (100ms 간격으로 체크하여 반응성 확보)
      // requestAnimationFrame은 백그라운드에서 멈출 수 있으므로 setInterval 사용
      interval = setInterval(updateTick, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning, state.isPaused, updateTick]);

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
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;
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
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;
    warningTriggeredRef.current = false;
    completeTriggeredRef.current = false;
  }, []);

  const setTarget = useCallback((seconds: number) => {
    setState((prev) => ({
      ...prev,
      targetSeconds: seconds,
      currentSeconds: prev.mode === "countdown" ? seconds : prev.currentSeconds,
    }));
    // 타겟 변경 시 리셋하지 않음 (기존 동작 유지)
    // 하지만 카운트다운 모드에서 실행 중이 아니면 currentSeconds 업데이트
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
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;
    warningTriggeredRef.current = false;
    completeTriggeredRef.current = false;
  }, []);

  const start = useCallback(() => {
    // 이미 실행 중이면 무시
    if (state.isRunning && !state.isPaused) return;

    // 시작 시간 기록
    startTimeRef.current = Date.now();

    // 카운트다운이 완료된 상태에서 다시 시작하면 누적 시간 초기화
    if (state.mode === "countdown" && state.currentSeconds === 0) {
      accumulatedTimeRef.current = 0;
    }

    setState((prev) => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      startedAt: prev.startedAt || Date.now(), // 최초 시작 시간 유지
      completedAt: null,
      currentSeconds:
        prev.mode === "countdown" && prev.currentSeconds === 0
          ? prev.targetSeconds
          : prev.currentSeconds,
    }));

    warningTriggeredRef.current = false;
    completeTriggeredRef.current = false;
  }, [state.isRunning, state.isPaused, state.mode, state.currentSeconds]);

  const pause = useCallback(() => {
    if (!state.isRunning || state.isPaused) return;

    // 현재까지 흐른 시간 누적
    if (startTimeRef.current) {
      accumulatedTimeRef.current += Date.now() - startTimeRef.current;
      startTimeRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, [state.isRunning, state.isPaused]);

  const resume = useCallback(() => {
    if (!state.isRunning || !state.isPaused) return;

    // 다시 시작 시간 기록
    startTimeRef.current = Date.now();

    setState((prev) => ({
      ...prev,
      isPaused: false,
    }));
  }, [state.isRunning, state.isPaused]);

  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentSeconds: prev.mode === "countdown" ? prev.targetSeconds : 0,
      isRunning: false,
      isPaused: false,
      startedAt: null,
      completedAt: null,
    }));
    accumulatedTimeRef.current = 0;
    startTimeRef.current = null;
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
