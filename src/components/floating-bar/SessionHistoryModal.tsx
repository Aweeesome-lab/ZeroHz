"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  X,
  Trash2,
  Clock,
  Calendar,
  AlertTriangle,
  Lock,
  Timer,
} from "lucide-react";
import type { TimerSession, SessionStats } from "@/types/timer";
import { TIMER_PRESETS } from "@/constants/timer";
import { SOUNDS } from "@/constants/sounds";

interface SessionHistoryModalProps {
  sessions: TimerSession[];
  stats: SessionStats;
  onClose: () => void;
  onClear: () => void;
  isPro: boolean;
}

// 모달용 윈도우 크기
const MODAL_WINDOW_SIZE = { width: 800, height: 600 };

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
    return `${mins}${t("sessionHistory.time.minutes")} ${secs}${t(
      "sessionHistory.time.seconds"
    )}`;
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

  const ModeIcon = session.mode === "countdown" ? Timer : Clock;
  const iconColor = session.completed ? "text-green-400" : "text-orange-400";

  let title = "";
  if (preset) {
    title = `${preset.emoji} ${t(preset.label)}`;
  } else if (session.mode === "countdown") {
    title = `${t("timerSettings.custom.label")} (${formatTime(
      session.targetSeconds
    )})`;
  } else {
    title = t("common.stopwatch");
  }

  return (
    <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <ModeIcon size={12} className={iconColor} />
          <span className="text-white text-xs font-medium">{title}</span>
        </div>
        <span className="text-white/60 text-xs font-mono">
          {formatTime(session.actualSeconds)}
        </span>
      </div>
      {session.taskDescription && (
        <div className="text-white/50 text-xs mb-1.5 line-clamp-2">
          {session.taskDescription}
        </div>
      )}
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

// 시간 포맷 헬퍼 (예: 1.5h or 1.5)
const formatHours = (seconds: number, short = false) => {
  if (seconds === 0) return short ? "" : "-";
  const hours = seconds / 3600;
  if (short) {
    return hours < 0.1 ? "" : hours.toFixed(1);
  }
  return hours < 0.1 ? "<0.1h" : `${hours.toFixed(1)}h`;
};

export function SessionHistoryModal({
  sessions,
  stats,
  onClose,
  onClear,
  isPro,
}: SessionHistoryModalProps) {
  const { t, i18n } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);
  const originalSizeRef = useRef<{ width: number; height: number } | null>(
    null
  );
  const originalPositionRef = useRef<{ x: number; y: number } | null>(null);
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
        const {
          getCurrentWindow,
          LogicalSize,
          PhysicalPosition,
          currentMonitor,
        } = await import("@tauri-apps/api/window");
        const appWindow = getCurrentWindow();

        // 현재 크기 및 위치 저장
        const currentSize = await appWindow.innerSize();
        const currentPos = await appWindow.outerPosition();

        originalSizeRef.current = {
          width: currentSize.width,
          height: currentSize.height,
        };
        originalPositionRef.current = {
          x: currentPos.x,
          y: currentPos.y,
        };

        // 모달 크기로 확장 및 중앙 정렬
        await appWindow.setSize(
          new LogicalSize(MODAL_WINDOW_SIZE.width, MODAL_WINDOW_SIZE.height)
        );

        // 화면 중앙으로 이동
        const monitor = await currentMonitor();
        if (monitor) {
          const scaleFactor = monitor.scaleFactor;
          const monitorSize = monitor.size;
          const monitorPosition = monitor.position;

          const physicalWidth = MODAL_WINDOW_SIZE.width * scaleFactor;

          const x =
            monitorPosition.x +
            Math.round((monitorSize.width - physicalWidth) / 2);
          const y = monitorPosition.y + 50;

          await appWindow.setPosition(new PhysicalPosition(x, y));
        }
      } catch {
        // 웹 환경에서는 무시
        console.log("Not in Tauri environment");
      }
    };

    expandWindow();

    // 닫힐 때 원래 크기 및 위치로 복원
    return () => {
      const restoreWindow = async () => {
        if (originalSizeRef.current && originalPositionRef.current) {
          try {
            const { getCurrentWindow, PhysicalSize, PhysicalPosition } =
              await import("@tauri-apps/api/window");
            const appWindow = getCurrentWindow();

            // 크기 복원 (저장된 크기는 PhysicalSize이므로 PhysicalSize 사용)
            await appWindow.setSize(
              new PhysicalSize(
                originalSizeRef.current.width,
                originalSizeRef.current.height
              )
            );

            // 위치 복원
            await appWindow.setPosition(
              new PhysicalPosition(
                originalPositionRef.current.x,
                originalPositionRef.current.y
              )
            );
          } catch {
            console.log("Failed to restore window size/position");
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

  // 오늘 총 집중 시간 계산
  const todayTotal = useMemo(() => {
    return stats.todaySessions.reduce(
      (acc, session) => acc + session.actualSeconds,
      0
    );
  }, [stats.todaySessions]);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex flex-col bg-[#1A1A1A] overflow-hidden rounded-2xl border border-white/10"
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-sm font-medium text-white flex items-center gap-2">
          <Calendar size={14} />
          {t("sessionHistory.title")}
        </h2>
        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
              title={t("sessionHistory.action.clear")}
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* 통계 요약 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="text-white/40 text-xs mb-1">
              {t("sessionHistory.stats.today")}
            </div>
            <div className="text-xl font-bold text-white">
              {formatDuration(todayTotal, t)}
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <div className="text-white/40 text-xs mb-1">
              {t("sessionHistory.stats.total")}
            </div>
            <div className="text-xl font-bold text-white">
              {formatDuration(stats.totalFocusTime, t)}
            </div>
          </div>
        </div>
        {/* 활동 시간 히트맵 (Active Hours) */}
        <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
          {!isPro && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <div className="p-3 rounded-full bg-white/10 mb-2">
                <Lock size={20} className="text-white/80" />
              </div>
              <p className="text-white/80 text-xs font-medium">
                {t("pro.availableInPro")}
              </p>
            </div>
          )}
          <div
            className={cn(
              "flex items-center justify-between mb-4",
              !isPro && "opacity-20 blur-[1px]"
            )}
          >
            <h3 className="text-white/60 text-xs font-medium">
              {t("sessionHistory.chart.activeHours")}
            </h3>
            <div className="flex items-center gap-2 text-[10px] text-white/30">
              <span>{t("sessionHistory.chart.less")}</span>
              <div className="flex gap-0.5">
                <div className="w-2 h-2 rounded-sm bg-white/5" />
                <div className="w-2 h-2 rounded-sm bg-purple-500/20" />
                <div className="w-2 h-2 rounded-sm bg-purple-500/50" />
                <div className="w-2 h-2 rounded-sm bg-purple-500/80" />
                <div className="w-2 h-2 rounded-sm bg-purple-500" />
              </div>
              <span>{t("sessionHistory.chart.more")}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="w-full">
              {/* X축 레이블 (시간) */}
              <div className="flex mb-2">
                <div className="w-8" /> {/* Y축 레이블 공간 */}
                <div className="flex-1 flex justify-between px-1">
                  {Array.from({ length: 24 }).map((_, hour) => (
                    <span
                      key={hour}
                      className="text-[10px] text-white/20 w-full text-center"
                    >
                      {hour}
                    </span>
                  ))}
                </div>
                <div className="w-10 text-[10px] text-white/20 text-center">
                  {t("sessionHistory.chart.total")}
                </div>
              </div>

              {/* 그리드 */}
              <div className="flex flex-col gap-1">
                {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map(
                  (dayKey, dayIndex) => {
                    const dayLabel = t(`sessionHistory.chart.days.${dayKey}`);
                    // 해당 요일의 전체 세션 계산
                    const daySessions = sessions.filter((session) => {
                      const date = new Date(session.startedAt);
                      return date.getDay() === dayIndex;
                    });
                    const dayTotalDuration = daySessions.reduce(
                      (acc, cur) => acc + cur.actualSeconds,
                      0
                    );

                    return (
                      <div key={dayKey} className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30 w-8 font-medium">
                          {dayLabel}
                        </span>
                        <div className="flex-1 grid grid-cols-24 gap-0.5">
                          {Array.from({ length: 24 }).map((_, hour) => {
                            // 해당 요일/시간의 세션 필터링
                            const hourSessions = sessions.filter((session) => {
                              const date = new Date(session.startedAt);
                              return (
                                date.getDay() === dayIndex &&
                                date.getHours() === hour
                              );
                            });

                            const count = hourSessions.length;
                            const totalDuration = hourSessions.reduce(
                              (acc, cur) => acc + cur.actualSeconds,
                              0
                            );

                            // 최대값 기준 투명도 계산 (최대 10개 기준)
                            const intensity = Math.min(count / 5, 1); // 5개 이상이면 최대 진하기

                            // 툴팁 텍스트 생성 (예: "3 sessions (1.5h)")
                            const durationText =
                              totalDuration > 0
                                ? `(${formatHours(totalDuration)})`
                                : "";

                            return (
                              <div
                                key={hour}
                                className={cn(
                                  "aspect-square rounded-sm transition-all hover:ring-1 hover:ring-white/50 flex items-center justify-center",
                                  count === 0 ? "bg-white/5" : "bg-purple-500"
                                )}
                                style={{
                                  opacity:
                                    count === 0 ? 1 : 0.2 + intensity * 0.8,
                                }}
                                title={`${dayLabel} ${hour}:00 - ${count} sessions ${durationText}`}
                              >
                                <span className="text-[8px] text-white/90 font-medium">
                                  {formatHours(totalDuration, true)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {/* 일일 합계 (Total) */}
                        <div className="w-10 text-[10px] text-white/40 text-center font-mono">
                          {formatHours(dayTotalDuration)}
                        </div>
                      </div>
                    );
                  }
                )}

                {/* 시간대별 합계 (Hourly Total) */}
                <div className="flex items-center gap-2 mt-1 pt-1 border-t border-white/5">
                  <span className="text-[10px] text-white/30 w-8 font-medium">
                    {t("sessionHistory.chart.all")}
                  </span>
                  <div className="flex-1 grid grid-cols-24 gap-0.5">
                    {Array.from({ length: 24 }).map((_, hour) => {
                      // 해당 시간대의 전체 세션 계산
                      const hourSessions = sessions.filter((session) => {
                        const date = new Date(session.startedAt);
                        return date.getHours() === hour;
                      });

                      const count = hourSessions.length;
                      const totalDuration = hourSessions.reduce(
                        (acc, cur) => acc + cur.actualSeconds,
                        0
                      );

                      const durationText =
                        totalDuration > 0
                          ? `(${formatHours(totalDuration)})`
                          : "";

                      return (
                        <div
                          key={`total-${hour}`}
                          className="flex items-center justify-center w-full"
                          title={`Total ${hour}:00 - ${count} sessions ${durationText}`}
                        >
                          <span className="text-[8px] text-white/40 font-mono">
                            {formatHours(totalDuration, true)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-10" /> {/* Total column spacer */}
                </div>
              </div>
            </div>
          </div>
        </div>
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
