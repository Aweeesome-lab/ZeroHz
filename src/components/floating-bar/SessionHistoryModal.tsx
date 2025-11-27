"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Trash2, Clock, CheckCircle, XCircle, Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimerSession, SessionStats } from "@/types/timer";
import { TIMER_PRESETS } from "@/constants/timer";
import { SOUNDS } from "@/constants/sounds";

interface SessionHistoryModalProps {
  sessions: TimerSession[];
  stats: SessionStats;
  onClose: () => void;
  onClear: () => void;
}

// 모달용 윈도우 크기
const MODAL_WINDOW_SIZE = { width: 340, height: 500 };

/**
 * 시간을 MM:SS 형식으로 변환
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * 시간을 "X시간 Y분 Z초" 형식으로 변환
 */
function formatDuration(seconds: number, t: (key: string) => string): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}${t("sessionHistory.time.hours")} ${mins}${t(
      "sessionHistory.time.minutes"
    )} ${secs}${t("sessionHistory.time.seconds")}`;
  }
  if (mins > 0) {
    return `${mins}${t("sessionHistory.time.minutes")} ${secs}${t("sessionHistory.time.seconds")}`;
  }
  return `${secs}${t("sessionHistory.time.seconds")}`;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
function getDateKey(timestamp: number): string {
  return new Date(timestamp).toISOString().split("T")[0];
}

/**
 * 날짜를 한국어로 포맷
 */
function formatDateLabel(
  dateKey: string,
  t: (key: string) => string,
  lang: string
): string {
  const date = new Date(dateKey);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateKey === getDateKey(today.getTime())) {
    return t("sessionHistory.date.today");
  }
  if (dateKey === getDateKey(yesterday.getTime())) {
    return t("sessionHistory.date.yesterday");
  }

  return date.toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });
}

/**
 * 세션 아이템 컴포넌트
 */
function SessionItem({ session }: { session: TimerSession }) {
  const { t, i18n } = useTranslation();
  const preset = TIMER_PRESETS.find((p) => p.id === session.preset);

  return (
    <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {session.completed ? (
            <CheckCircle size={12} className="text-green-400" />
          ) : (
            <XCircle size={12} className="text-orange-400" />
          )}
          <span className="text-white text-xs font-medium">
            {preset
              ? `${preset.emoji} ${t(preset.label)}`
              : session.mode === "countdown"
              ? t("common.countdown")
              : t("common.stopwatch")}
          </span>
        </div>
        <span className="text-white/60 text-xs font-mono">
          {formatTime(session.actualSeconds)}
        </span>
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/30">
          {new Date(session.startedAt).toLocaleTimeString(
            i18n.language === "ko" ? "ko-KR" : "en-US",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )}
        </span>
        {session.activeSounds.length > 0 && (
          <div className="flex items-center gap-0.5">
            {session.activeSounds.map((soundId) => {
              const sound = SOUNDS.find((s) => s.id === soundId);
              if (!sound) return null;
              const Icon = sound.icon;
              return (
                <Icon
                  key={soundId}
                  size={10}
                  className="text-white/30"
                  strokeWidth={2}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function SessionHistoryModal({
  sessions,
  stats,
  onClose,
  onClear,
}: SessionHistoryModalProps) {
  const { t, i18n } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const originalSizeRef = useRef<{ width: number; height: number } | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 날짜별로 세션 그룹핑
  const groupedSessions = useMemo(() => {
    const groups: Map<string, TimerSession[]> = new Map();

    sessions.forEach((session) => {
      const dateKey = getDateKey(session.startedAt);
      const existing = groups.get(dateKey) || [];
      groups.set(dateKey, [...existing, session]);
    });

    // 날짜 내림차순 정렬 (최신 날짜 먼저)
    return Array.from(groups.entries()).sort((a, b) =>
      b[0].localeCompare(a[0])
    );
  }, [sessions]);

  // 모달 열릴 때 윈도우 크기 확장
  useEffect(() => {
    const expandWindow = async () => {
      try {
        const { getCurrentWindow, LogicalSize } = await import(
          "@tauri-apps/api/window"
        );
        const appWindow = getCurrentWindow();

        // 현재 크기 저장
        const currentSize = await appWindow.innerSize();
        originalSizeRef.current = {
          width: currentSize.width,
          height: currentSize.height,
        };

        // 모달 크기로 확장
        await appWindow.setSize(
          new LogicalSize(MODAL_WINDOW_SIZE.width, MODAL_WINDOW_SIZE.height)
        );
      } catch (error) {
        // 웹 환경에서는 무시
        console.log("Not in Tauri environment");
      }
    };

    expandWindow();

    // 닫힐 때 원래 크기로 복원
    return () => {
      const restoreWindow = async () => {
        if (originalSizeRef.current) {
          try {
            const { getCurrentWindow, LogicalSize } = await import(
              "@tauri-apps/api/window"
            );
            const appWindow = getCurrentWindow();
            await appWindow.setSize(
              new LogicalSize(
                originalSizeRef.current.width,
                originalSizeRef.current.height
              )
            );
          } catch (error) {
            console.log("Failed to restore window size");
          }
        }
      };
      restoreWindow();
    };
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#1A1A1A] overflow-hidden"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-white text-sm font-semibold">
          {t("sessionHistory.title")}
        </h2>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/5 rounded-lg p-3 border border-white/5">
            <div className="text-white/40 text-xs mb-1">
              {t("sessionHistory.stats.todayFocusTime")}({stats.todaySessions.length})
            </div>
            <div className="text-white text-lg font-bold">
              {formatDuration(
                stats.todaySessions.reduce((sum, s) => sum + s.actualSeconds, 0),
                t
              )}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/5">
            <div className="text-white/40 text-xs mb-1">
              {t("sessionHistory.stats.focusTime")}({stats.totalSessions})
            </div>
            <div className="text-white text-lg font-bold">
              {formatDuration(stats.totalFocusTime, t)}
            </div>
          </div>
        </div>

        {/* 주간 통계 바 차트 - 임시 비활성화 */}
        {/* <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/5">
          <div className="text-white/40 text-xs mb-2">
            {t("sessionHistory.chart.week")}
          </div>
          <div className="flex items-end justify-between gap-1 h-32">
            {stats.weekStats.map((day) => {
              const maxTime = Math.max(
                ...stats.weekStats.map((d) => d.focusTime),
                1
              );
              const height = (day.focusTime / maxTime) * 100;
              const dayName = new Date(day.date).toLocaleDateString(
                i18n.language === "ko" ? "ko-KR" : "en-US",
                {
                  weekday: "short",
                }
              );

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={cn(
                      "w-full rounded-sm transition-all",
                      day.focusTime > 0 ? "bg-blue-500/60" : "bg-white/10"
                    )}
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${dayName}: ${formatDuration(day.focusTime, t)}`}
                  />
                  <span className="text-white/30 text-[10px]">
                    {dayName.charAt(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div> */}

        {/* 날짜별 세션 리스트 */}
        {groupedSessions.length === 0 ? (
          <div className="text-white/30 text-sm text-center py-8">
            {t("sessionHistory.empty")}
          </div>
        ) : (
          <div className="space-y-4">
            {groupedSessions.map(([dateKey, dateSessions]) => (
              <div key={dateKey}>
                <div className="text-white/50 text-xs font-medium mb-2 flex items-center gap-1">
                  {dateKey === getDateKey(Date.now()) ? (
                    <Clock size={12} />
                  ) : (
                    <Calendar size={12} />
                  )}
                  {formatDateLabel(dateKey, t, i18n.language)} (
                  {dateSessions.length})
                </div>
                <div className="space-y-2">
                  {dateSessions.map((session) => (
                    <SessionItem key={session.id} session={session} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 액션 */}
      {sessions.length > 0 && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 text-red-400/70 text-xs hover:text-red-400 py-2 rounded-lg hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={12} />
            {t("sessionHistory.delete.button")}
          </button>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#252525] rounded-xl p-5 mx-4 border border-white/10 shadow-2xl max-w-[280px] w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-full bg-red-500/20">
                <AlertTriangle size={18} className="text-red-400" />
              </div>
              <h3 className="text-white text-sm font-semibold">
                {t("sessionHistory.delete.confirmTitle")}
              </h3>
            </div>
            <p className="text-white/60 text-xs mb-4 leading-relaxed">
              {t("sessionHistory.delete.confirm")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-2 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  onClear();
                  setShowDeleteConfirm(false);
                }}
                className="flex-1 px-3 py-2 text-xs text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-all"
              >
                {t("sessionHistory.delete.button")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
