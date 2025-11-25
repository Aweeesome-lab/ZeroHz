"use client";

import { Play, Pause, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOUNDS } from "@/constants/sounds";
import type { SoundType } from "@/types/audio";

/**
 * CompactView - 플로팅 바의 축소된 뷰 컴포넌트
 *
 * @param activeSounds - 현재 활성화된 사운드 ID들의 Set
 * @param isPlaying - 오디오 재생 상태 (true: 재생 중, false: 일시정지)
 * @param formattedTime - "MM:SS" 형식의 경과 시간 문자열
 * @param onTogglePlayPause - 재생/일시정지 토글 콜백
 * @param onExpand - 확장 모드로 전환하는 콜백
 */
interface CompactViewProps {
  activeSounds: Set<SoundType>;
  isPlaying: boolean;
  formattedTime: string;
  onTogglePlayPause: () => void;
  onExpand: () => void;
}

export function CompactView({
  activeSounds,
  isPlaying,
  formattedTime,
  onTogglePlayPause,
  onExpand,
}: CompactViewProps) {
  return (
    <>
      <button
        onClick={onTogglePlayPause}
        className="text-white/70 hover:text-white transition-colors p-0.5"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause size={12} /> : <Play size={12} />}
      </button>

      <div className="font-mono text-xs text-white/80 font-medium min-w-[36px] text-center select-none">
        {formattedTime}
      </div>

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

      <button
        onClick={onExpand}
        className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
        title="Expand"
        data-tauri-drag-region="false"
      >
        <Maximize2 size={14} />
      </button>
    </>
  );
}
