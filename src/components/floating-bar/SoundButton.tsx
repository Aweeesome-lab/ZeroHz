"use client";

import { cn } from "@/lib/utils";
import type { SoundControl, SoundType } from "@/types/audio";

/**
 * SoundButton - 개별 사운드 컨트롤 버튼 컴포넌트
 *
 * @param sound - 사운드 정보 객체 (id, icon, label, src 포함)
 * @param isActive - 현재 사운드가 활성화되어 있는지 여부
 * @param volume - 현재 볼륨 값 (0~1)
 * @param onToggle - 사운드 활성화/비활성화 토글 콜백
 * @param onVolumeChange - 볼륨 변경 콜백 (id, 0~1 값)
 */
interface SoundButtonProps {
  sound: SoundControl;
  isActive: boolean;
  volume: number;
  onToggle: (id: SoundType) => void;
  onVolumeChange: (id: SoundType, value: number) => void;
}

export function SoundButton({
  sound,
  isActive,
  volume,
  onToggle,
  onVolumeChange,
}: SoundButtonProps) {
  const Icon = sound.icon;

  return (
    <div className="relative group flex flex-col items-center">
      <button
        onClick={() => onToggle(sound.id)}
        className={cn(
          "p-2.5 rounded-full transition-all duration-300 ease-in-out border-0",
          isActive
            ? "bg-white/90 text-black shadow-[0_0_15px_rgba(255,255,255,0.5)]"
            : "bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
        )}
        title={sound.label}
        data-tauri-drag-region="false"
      >
        <Icon size={20} />
      </button>

      {/* Volume Slider (Visible on hover/active) */}
      <div
        className={cn(
          "absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 transition-all duration-200 origin-top z-50",
          isActive
            ? "opacity-0 group-hover:opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        )}
      >
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(sound.id, parseFloat(e.target.value))}
          className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          data-tauri-drag-region="false"
        />
      </div>
    </div>
  );
}
