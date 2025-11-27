"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Timer, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimerMode, TimerPreset } from "@/types/timer";
import { TIMER_PRESETS } from "@/constants/timer";

interface TimerSettingsModalProps {
  currentMode: TimerMode;
  currentTarget: number;
  onClose: () => void;
  onSetPreset: (preset: TimerPreset) => void;
  onSetCustom: (seconds: number) => void;
  onToggleMode: () => void;
}

// 모달용 윈도우 크기
const MODAL_WINDOW_SIZE = { width: 340, height: 480 };

export function TimerSettingsModal({
  currentMode,
  currentTarget,
  onClose,
  onSetPreset,
  onSetCustom,
  onToggleMode,
}: TimerSettingsModalProps) {
  const { t } = useTranslation();
  const [customMinutes, setCustomMinutes] = useState(
    Math.floor(currentTarget / 60)
  );
  const modalRef = useRef<HTMLDivElement>(null);
  const originalSizeRef = useRef<{ width: number; height: number } | null>(
    null
  );

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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1A1A1A] overflow-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="text-white text-sm font-semibold">
          {t("timerSettings.title")}
        </h3>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <div ref={modalRef} className="flex-1 p-4 overflow-auto">
        {/* 모드 선택 */}
        <div className="mb-4">
          <div className="text-white/50 text-xs mb-2">
            {t("timerSettings.mode.label")}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => currentMode !== "stopwatch" && onToggleMode()}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                currentMode === "stopwatch"
                  ? "bg-white/10 border-white/30 text-white"
                  : "border-white/10 text-white/50 hover:bg-white/5"
              )}
            >
              <Clock size={16} />
              <span className="text-sm">
                {t("timerSettings.mode.stopwatch")}
              </span>
            </button>
            <button
              onClick={() => currentMode !== "countdown" && onToggleMode()}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                currentMode === "countdown"
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                  : "border-white/10 text-white/50 hover:bg-white/5"
              )}
            >
              <Timer size={16} />
              <span className="text-sm">
                {t("timerSettings.mode.countdown")}
              </span>
            </button>
          </div>
        </div>

        {/* 카운트다운 프리셋 (카운트다운 모드일 때만) */}
        {currentMode === "countdown" && (
          <>
            <div className="mb-4">
              <div className="text-white/50 text-xs mb-2">
                {t("timerSettings.preset.label")}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {TIMER_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onSetPreset(preset)}
                    className={cn(
                      "p-2.5 rounded-lg border transition-all text-center",
                      currentTarget === preset.seconds
                        ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                        : "border-white/10 text-white/70 hover:bg-white/5 hover:border-white/20"
                    )}
                  >
                    <div className="text-lg mb-0.5">{preset.emoji}</div>
                    <div className="text-xs font-medium truncate">
                      {t(preset.label)}
                    </div>
                    <div className="text-xs text-white/40">
                      {Math.floor(preset.seconds / 60)}
                      {t("timerSettings.preset.minutes")}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 커스텀 입력 */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-white/50 text-xs mb-2">
                {t("timerSettings.custom.label")}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customMinutes}
                  onChange={(e) => {
                    const value = Math.max(
                      1,
                      Math.min(180, Number(e.target.value))
                    );
                    setCustomMinutes(value);
                  }}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm w-20 text-center focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30"
                />
                <span className="text-white/50 text-sm">
                  {t("timerSettings.custom.unit")}
                </span>
                <button
                  onClick={() => onSetCustom(customMinutes * 60)}
                  className="flex-1 bg-blue-500/20 text-blue-400 rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-500/30 transition-all"
                >
                  {t("timerSettings.custom.apply")}
                </button>
              </div>
            </div>
          </>
        )}

        {/* 스톱워치 모드 안내 */}
        {currentMode === "stopwatch" && (
          <div className="text-white/40 text-xs text-center py-4">
            {t("timerSettings.stopwatchGuide.line1")}
            <br />
            {t("timerSettings.stopwatchGuide.line2")}
          </div>
        )}
      </div>
    </div>
  );
}
