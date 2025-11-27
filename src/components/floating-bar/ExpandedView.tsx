"use client";

import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SoundButton } from "./SoundButton";
import { TimerControl } from "./TimerControl";
import { SOUNDS, ITEMS_PER_SLIDE } from "@/constants/sounds";
import type { SoundType, SoundVolumes } from "@/types/audio";
import type {
  TimerMode,
  TimerPreset,
  SessionStats,
  TimerSession,
} from "@/types/timer";

/**
 * ExpandedView - 플로팅 바의 확장된 뷰 컴포넌트
 */
interface ExpandedViewProps {
  activeSounds: Set<SoundType>;
  volumes: SoundVolumes;
  isMuted: boolean;
  isPlaying: boolean;
  currentSlide: number;
  onToggleSound: (id: SoundType) => void;
  onVolumeChange: (id: SoundType, value: number) => void;
  onToggleMute: () => void;
  onTogglePlayPause: () => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  onMinimize: () => void;
  // 타이머 props
  timerMode: TimerMode;
  timerFormattedTime: string;
  timerProgress: number;
  timerTargetSeconds: number;
  isTimerRunning: boolean;
  isTimerPaused: boolean;
  isTimerWarning: boolean;
  isTimerCompleted: boolean;
  onTimerToggleMode: () => void;
  onTimerSetPreset: (preset: TimerPreset) => void;
  onTimerSetCustom: (seconds: number) => void;
  onTimerReset: () => void;
  // 세션 기록 props
  timerSessions: TimerSession[];
  timerStats: SessionStats;
  onClearSessions: () => void;
}

export function ExpandedView({
  activeSounds,
  volumes,
  isMuted,
  isPlaying,
  currentSlide,
  onToggleSound,
  onVolumeChange,
  onToggleMute,
  onTogglePlayPause,
  onPrevSlide,
  onNextSlide,
  onMinimize,
  // 타이머 props
  timerMode,
  timerFormattedTime,
  timerProgress,
  timerTargetSeconds,
  isTimerRunning,
  isTimerPaused,
  isTimerWarning,
  isTimerCompleted,
  onTimerToggleMode,
  onTimerSetPreset,
  onTimerSetCustom,
  onTimerReset,
  // 세션 기록 props
  timerSessions,
  timerStats,
  onClearSessions,
}: ExpandedViewProps) {
  const visibleSounds = SOUNDS.slice(
    currentSlide * ITEMS_PER_SLIDE,
    (currentSlide + 1) * ITEMS_PER_SLIDE
  );

  return (
    <>
      {/* 사운드 네비게이션 - 이전 */}
      <button
        onClick={onPrevSlide}
        className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
        data-tauri-drag-region="false"
      >
        <ChevronLeft size={16} />
      </button>

      {/* 사운드 버튼들 */}
      <div className="flex gap-2">
        {visibleSounds.map((sound) => (
          <SoundButton
            key={sound.id}
            sound={sound}
            isActive={activeSounds.has(sound.id)}
            volume={volumes[sound.id]}
            onToggle={onToggleSound}
            onVolumeChange={onVolumeChange}
          />
        ))}
      </div>

      {/* 사운드 네비게이션 - 다음 */}
      <button
        onClick={onNextSlide}
        className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
        data-tauri-drag-region="false"
      >
        <ChevronRight size={16} />
      </button>

      <div className="w-px h-6 bg-white/20 mx-1" />

      {/* 타이머 컨트롤 */}
      <TimerControl
        mode={timerMode}
        formattedTime={timerFormattedTime}
        progress={timerProgress}
        isRunning={isTimerRunning}
        isPaused={isTimerPaused}
        isWarning={isTimerWarning}
        isCompleted={isTimerCompleted}
        targetSeconds={timerTargetSeconds}
        onToggleMode={onTimerToggleMode}
        onSetPreset={onTimerSetPreset}
        onSetCustom={onTimerSetCustom}
        onReset={onTimerReset}
        sessions={timerSessions}
        stats={timerStats}
        onClearSessions={onClearSessions}
      />

      <div className="w-px h-6 bg-white/20 mx-1" />

      {/* 음소거 버튼 */}
      <button
        onClick={onToggleMute}
        className={cn(
          "p-2.5 rounded-full transition-all duration-300 ease-in-out border-0",
          isMuted
            ? "bg-red-500/80 text-white"
            : "bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
        )}
        title="Mute All"
        data-tauri-drag-region="false"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* 재생/일시정지 버튼 */}
      <button
        onClick={onTogglePlayPause}
        className={cn(
          "p-2.5 rounded-full transition-all duration-300 ease-in-out border-0",
          !isPlaying
            ? "bg-amber-500/80 text-white"
            : "bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
        )}
        title={isPlaying ? "Pause All" : "Resume All"}
        data-tauri-drag-region="false"
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <div className="w-px h-6 bg-white/20 mx-1" />

      {/* 최소화 버튼 */}
      <button
        onClick={onMinimize}
        className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
        title="Compact Mode"
        data-tauri-drag-region="false"
      >
        <Minimize2 size={16} />
      </button>
    </>
  );
}
