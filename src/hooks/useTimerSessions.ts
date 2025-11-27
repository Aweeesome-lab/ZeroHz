"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type {
  TimerSession,
  SessionStats,
  WeekDayStat,
  TimerMode,
} from "@/types/timer";
import { MAX_SESSION_HISTORY } from "@/constants/timer";

// Tauri Store 설정
const STORE_FILE = "timer-sessions.json";
const STORE_KEY = "sessions";

// Tauri 환경 체크
const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/**
 * 오늘 날짜인지 확인
 */
function isToday(timestamp: number): boolean {
  const today = new Date();
  const date = new Date(timestamp);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * YYYY-MM-DD 형식으로 변환
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 최근 7일 통계 계산
 */
function calculateWeekStats(sessions: TimerSession[]): WeekDayStat[] {
  const stats: Map<string, WeekDayStat> = new Map();

  // 최근 7일 날짜 초기화
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date.getTime());
    stats.set(dateStr, { date: dateStr, sessions: 0, focusTime: 0 });
  }

  // 세션 데이터 집계
  sessions.forEach((session) => {
    const dateStr = formatDate(session.startedAt);
    const existing = stats.get(dateStr);
    if (existing) {
      existing.sessions += 1;
      existing.focusTime += session.actualSeconds;
    }
  });

  return Array.from(stats.values());
}

interface UseTimerSessionsReturn {
  sessions: TimerSession[];
  stats: SessionStats;
  addSession: (session: Omit<TimerSession, "id">) => void;
  clearSessions: () => void;
  clearTodaySessions: () => void;
}

/**
 * useTimerSessions - 타이머 세션 기록 관리 훅
 * Tauri 환경에서는 파일 기반 Store, 웹에서는 LocalStorage 사용
 */
export function useTimerSessions(): UseTimerSessionsReturn {
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const storeRef = useRef<unknown>(null);

  // Tauri Store 또는 LocalStorage에서 불러오기
  useEffect(() => {
    const loadSessions = async () => {
      try {
        if (isTauri) {
          // Tauri Store 사용
          const { load } = await import("@tauri-apps/plugin-store");
          const store = await load(STORE_FILE, {
            autoSave: true,
            defaults: {},
          });
          storeRef.current = store;

          const saved = await store.get<TimerSession[]>(STORE_KEY);
          if (saved) {
            setSessions(saved);
          }
        } else {
          // 웹 환경: LocalStorage 사용
          const saved = localStorage.getItem("zerohz_timer_sessions");
          if (saved) {
            setSessions(JSON.parse(saved));
          }
        }
      } catch (error) {
        console.error("Failed to load timer sessions:", error);
      }
      setIsLoaded(true);
    };

    loadSessions();
  }, []);

  // 세션 변경 시 저장
  useEffect(() => {
    if (!isLoaded) return;

    const saveSessions = async () => {
      try {
        if (isTauri && storeRef.current) {
          const store = storeRef.current as {
            set: (key: string, value: unknown) => Promise<void>;
            save: () => Promise<void>;
          };
          await store.set(STORE_KEY, sessions);
          await store.save();
        } else {
          localStorage.setItem(
            "zerohz_timer_sessions",
            JSON.stringify(sessions)
          );
        }
      } catch (error) {
        console.error("Failed to save timer sessions:", error);
      }
    };

    saveSessions();
  }, [sessions, isLoaded]);

  // 세션 추가
  const addSession = useCallback((sessionData: Omit<TimerSession, "id">) => {
    const newSession: TimerSession = {
      ...sessionData,
      id: crypto.randomUUID(),
    };

    setSessions((prev) => {
      const updated = [newSession, ...prev];
      // 최대 개수 제한
      return updated.slice(0, MAX_SESSION_HISTORY);
    });
  }, []);

  // 모든 세션 삭제
  const clearSessions = useCallback(() => {
    setSessions([]);
  }, []);

  // 오늘 세션만 삭제
  const clearTodaySessions = useCallback(() => {
    setSessions((prev) => prev.filter((s) => !isToday(s.startedAt)));
  }, []);

  // 통계 계산
  const stats = useMemo<SessionStats>(() => {
    const completedSessions = sessions.filter((s) => s.completed);
    const todaySessions = sessions.filter((s) => isToday(s.startedAt));
    const totalFocusTime = sessions.reduce(
      (sum, s) => sum + s.actualSeconds,
      0
    );

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      totalFocusTime,
      averageSessionTime:
        completedSessions.length > 0
          ? Math.round(totalFocusTime / completedSessions.length)
          : 0,
      todaySessions,
      weekStats: calculateWeekStats(sessions),
    };
  }, [sessions]);

  return {
    sessions,
    stats,
    addSession,
    clearSessions,
    clearTodaySessions,
  };
}

/**
 * 세션 생성 헬퍼 함수
 */
export function createSessionData(
  mode: TimerMode,
  targetSeconds: number,
  actualSeconds: number,
  startedAt: number,
  completed: boolean,
  activeSounds: string[],
  preset?: string
): Omit<TimerSession, "id"> {
  return {
    mode,
    targetSeconds,
    actualSeconds,
    completed,
    startedAt,
    endedAt: Date.now(),
    activeSounds,
    preset,
  };
}
