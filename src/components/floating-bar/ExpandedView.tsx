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
import { SOUNDS, ITEMS_PER_SLIDE } from "@/constants/sounds";
import type { SoundType, SoundVolumes } from "@/types/audio";

/**
 * ExpandedView - 플로팅 바의 확장된 뷰 컴포넌트
 *
 * @param activeSounds - 현재 활성화된 사운드 ID들의 Set
 * @param volumes - 각 사운드별 볼륨 값 (0~1)을 담은 객체
 * @param isMuted - 전체 음소거 상태
 * @param isPlaying - 오디오 재생 상태 (true: 재생 중, false: 일시정지)
 * @param currentSlide - 현재 표시 중인 슬라이드 인덱스 (0부터 시작)
 * @param onToggleSound - 특정 사운드 활성화/비활성화 토글 콜백
 * @param onVolumeChange - 특정 사운드의 볼륨 변경 콜백 (id, 0~1 값)
 * @param onToggleMute - 전체 음소거 토글 콜백
 * @param onTogglePlayPause - 재생/일시정지 토글 콜백
 * @param onPrevSlide - 이전 슬라이드로 이동하는 콜백
 * @param onNextSlide - 다음 슬라이드로 이동하는 콜백
 * @param onMinimize - 축소 모드로 전환하는 콜백
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
}: ExpandedViewProps) {
  const visibleSounds = SOUNDS.slice(
    currentSlide * ITEMS_PER_SLIDE,
    (currentSlide + 1) * ITEMS_PER_SLIDE
  );

  return (
    <>
      <button
        onClick={onPrevSlide}
        className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
        data-tauri-drag-region="false"
      >
        <ChevronLeft size={16} />
      </button>

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

      <button
        onClick={onNextSlide}
        className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
        data-tauri-drag-region="false"
      >
        <ChevronRight size={16} />
      </button>

      <div className="w-px h-6 bg-white/20 mx-1" />

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
