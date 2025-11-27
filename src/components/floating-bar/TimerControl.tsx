import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Timer, Clock, RotateCcw, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TimerMode, TimerPreset, SessionStats } from "@/types/timer";
import { TimerSettingsModal } from "./TimerSettingsModal";
import { SessionHistoryModal } from "./SessionHistoryModal";
import type { TimerSession } from "@/types/timer";

interface TimerControlProps {
  mode: TimerMode;
  formattedTime: string;
  progress: number;
  isRunning: boolean;
  isPaused: boolean;
  isWarning: boolean;
  isCompleted: boolean;
  targetSeconds: number;
  onToggleMode: () => void;
  onSetPreset: (preset: TimerPreset, taskDescription?: string) => void;
  onSetCustom: (seconds: number, taskDescription?: string) => void;
  onReset: () => void;
  // 세션 히스토리 props
  sessions: TimerSession[];
  stats: SessionStats;
  onClearSessions: () => void;
}

export function TimerControl({
  mode,
  formattedTime,
  progress,
  isRunning,
  isPaused,
  isWarning,
  isCompleted,
  targetSeconds,
  onToggleMode,
  onSetPreset,
  onSetCustom,
  onReset,
  sessions,
  stats,
  onClearSessions,
}: TimerControlProps) {
  const { t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="relative flex items-center gap-1">
      {/* 모드 토글 버튼 */}
      <button
        onClick={onToggleMode}
        className={cn(
          "p-1 rounded-full transition-all",
          mode === "countdown"
            ? "bg-blue-500/20 text-blue-400"
            : "text-white/50 hover:bg-white/10 hover:text-white"
        )}
        title={
          mode === "countdown"
            ? t("timerControl.mode.countdown")
            : t("timerControl.mode.stopwatch")
        }
        data-tauri-drag-region="false"
      >
        {mode === "countdown" ? <Timer size={14} /> : <Clock size={14} />}
      </button>

      {/* 타이머 시간 표시 (클릭 시 설정) */}
      <button
        onClick={() => setShowSettings(true)}
        className={cn(
          "relative font-mono text-xs font-medium px-2 py-0.5 rounded transition-all flex items-center gap-0.5",
          isRunning && !isPaused && "bg-blue-500/10",
          isPaused && "bg-yellow-500/10",
          isWarning && "bg-orange-500/10 text-orange-400",
          isCompleted && "bg-green-500/10 text-green-400"
        )}
        title={t("timerControl.action.settings")}
        data-tauri-drag-region="false"
      >
        {/* Progress bar (카운트다운일 때만) */}
        {mode === "countdown" && isRunning && (
          <span
            className={cn(
              "absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-1000",
              isWarning ? "bg-orange-400/50" : "bg-blue-400/50"
            )}
            style={{ width: `${progress * 100}%` }}
          />
        )}

        <span
          className={cn(
            "relative z-10 transition-colors",
            mode === "countdown" &&
              !isWarning &&
              !isCompleted &&
              "text-blue-400",
            mode === "stopwatch" && "text-white/80"
          )}
        >
          {formattedTime}
        </span>

        <Settings size={10} className="text-white/30" />
      </button>

      {/* Reset 버튼 */}
      <button
        onClick={onReset}
        className="p-1 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-all"
        title={t("timerControl.action.reset")}
        data-tauri-drag-region="false"
      >
        <RotateCcw size={12} />
      </button>

      {/* 히스토리 버튼 */}
      <button
        onClick={() => setShowHistory(true)}
        className="p-1 rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-all"
        title={t("timerControl.action.history")}
        data-tauri-drag-region="false"
      >
        <History size={12} />
      </button>

      {/* 설정 모달 */}
      {showSettings && (
        <TimerSettingsModal
          currentMode={mode}
          currentTarget={targetSeconds}
          onClose={() => setShowSettings(false)}
          onSetPreset={(preset, taskDescription) => {
            onSetPreset(preset, taskDescription);
            setShowSettings(false);
          }}
          onSetCustom={(seconds, taskDescription) => {
            onSetCustom(seconds, taskDescription);
            setShowSettings(false);
          }}
          onToggleMode={onToggleMode}
        />
      )}

      {/* 히스토리 모달 */}
      {showHistory && (
        <SessionHistoryModal
          sessions={sessions}
          stats={stats}
          onClose={() => setShowHistory(false)}
          onClear={onClearSessions}
        />
      )}
    </div>
  );
}
