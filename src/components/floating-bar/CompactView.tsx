"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Play, Pause, Maximize2, Timer, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOUNDS } from "@/constants/sounds";
import type { SoundType } from "@/types/audio";
import type {
  TimerMode,
  TimerPreset,
  SessionStats,
  TimerSession,
} from "@/types/timer";
import { TimerSettingsModal } from "./TimerSettingsModal";

/**
 * CompactView - 플로팅 바의 축소된 뷰 컴포넌트
 */
interface CompactViewProps {
  activeSounds: Set<SoundType>;
  isPlaying: boolean;
  formattedTime: string;
  onTogglePlayPause: () => void;
  onExpand: () => void;
  // 타이머 props
  timerMode: TimerMode;
  timerProgress: number;
  timerTargetSeconds: number;
  isTimerRunning: boolean;
  isTimerWarning: boolean;
  isTimerCompleted: boolean;
  onTimerToggleMode: () => void;
  onTimerSetPreset: (preset: TimerPreset) => void;
  onTimerSetCustom: (seconds: number) => void;
}

export function CompactView({
  activeSounds,
  isPlaying,
  formattedTime,
  onTogglePlayPause,
  onExpand,
  // 타이머 props
  timerMode,
  timerProgress,
  timerTargetSeconds,
  isTimerRunning,
  isTimerWarning,
  isTimerCompleted,
  onTimerToggleMode,
  onTimerSetPreset,
  onTimerSetCustom,
}: CompactViewProps) {
  const { t } = useTranslation();
  const [showTimerSettings, setShowTimerSettings] = useState(false);

  return (
    <>
      {/* Play/Pause 버튼 */}
      <button
        onClick={onTogglePlayPause}
        className="text-white/70 hover:text-white transition-colors p-0.5"
        title={isPlaying ? t("compactView.pause") : t("compactView.play")}
        data-tauri-drag-region="false"
      >
        {isPlaying ? <Pause size={12} /> : <Play size={12} />}
      </button>

      {/* 타이머 표시 - 클릭 시 설정 */}
      <div className="relative">
        <button
          onClick={() => setShowTimerSettings(true)}
          className={cn(
            "relative font-mono text-xs font-medium min-w-[36px] text-center select-none px-1.5 py-0.5 rounded transition-all",
            timerMode === "countdown" && isTimerRunning && "text-blue-400",
            isTimerWarning && "text-orange-400 animate-pulse",
            isTimerCompleted && "text-green-400",
            !isTimerRunning && timerMode === "stopwatch" && "text-white/80"
          )}
          title={t("timerControl.action.settings")}
          data-tauri-drag-region="false"
        >
          {/* Progress indicator (카운트다운일 때) */}
          {timerMode === "countdown" && isTimerRunning && (
            <div
              className="absolute bottom-0 left-0 h-0.5 bg-blue-400/50 rounded-full transition-all duration-1000"
              style={{ width: `${timerProgress * 100}%` }}
            />
          )}
          {formattedTime}
        </button>

        {/* 타이머 설정 모달 */}
        {showTimerSettings && (
          <TimerSettingsModal
            currentMode={timerMode}
            currentTarget={timerTargetSeconds}
            onClose={() => setShowTimerSettings(false)}
            onSetPreset={(preset) => {
              onTimerSetPreset(preset);
              setShowTimerSettings(false);
            }}
            onSetCustom={(seconds) => {
              onTimerSetCustom(seconds);
              setShowTimerSettings(false);
            }}
            onToggleMode={() => {
              onTimerToggleMode();
              setShowTimerSettings(false);
            }}
          />
        )}
      </div>

      {/* 타이머 모드 인디케이터 */}
      <button
        onClick={onTimerToggleMode}
        className={cn(
          "p-0.5 rounded transition-all",
          timerMode === "countdown"
            ? "text-blue-400"
            : "text-white/40 hover:text-white/60"
        )}
        title={
          timerMode === "countdown"
            ? t("compactView.mode.countdown")
            : t("compactView.mode.stopwatch")
        }
        data-tauri-drag-region="false"
      >
        {timerMode === "countdown" ? <Timer size={10} /> : <Clock size={10} />}
      </button>

      {/* 활성 사운드 아이콘 */}
      {activeSounds.size > 0 && (
        <>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            {SOUNDS.filter((s) => activeSounds.has(s.id)).map((sound) => {
              const Icon = sound.icon;
              return (
                <Icon key={sound.id} size={12} className="text-white/70" />
              );
            })}
          </div>
        </>
      )}

      <div
        className={cn(
          "w-px h-6 bg-white/20 mx-1",
          activeSounds.size === 0 ? "hidden" : ""
        )}
      />

      {/* Expand 버튼 */}
      <button
        onClick={onExpand}
        className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
        title={t("compactView.expand")}
        data-tauri-drag-region="false"
      >
        <Maximize2 size={14} />
      </button>
    </>
  );
}
