"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useAudioPlayer,
  useWindowResize,
  useElapsedTime,
  usePlaybackTracking,
} from "@/hooks";
import { SOUNDS, ITEMS_PER_SLIDE } from "@/constants/sounds";
import { CompactView } from "./CompactView";
import { ExpandedView } from "./ExpandedView";

export function FloatingBar() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = Math.ceil(SOUNDS.length / ITEMS_PER_SLIDE);

  const {
    activeSounds,
    volumes,
    isMuted,
    isPlaying,
    toggleSound,
    handleVolumeChange,
    toggleMute,
    togglePlayPause,
  } = useAudioPlayer();

  const { isCompact, isResizing, handleToggleCompact } = useWindowResize();

  const { formattedTime } = useElapsedTime(activeSounds.size > 0, isPlaying);

  // North Star Metric: Track playback time
  usePlaybackTracking(isPlaying, activeSounds);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <div
      className={cn(
        "flex justify-center items-center w-full h-full transition-opacity duration-100",
        isResizing ? "opacity-0" : "opacity-100"
      )}
      data-tauri-drag-region
    >
      <div
        className={cn(
          "flex items-center gap-3 p-2.5 rounded-full bg-[#1A1A1A]/95 transition-all duration-300 ease-in-out hover:bg-[#242424]/90",
          isCompact ? "px-3 py-1.5 gap-2" : "border border-white/20"
        )}
        data-tauri-drag-region
      >
        {isCompact ? (
          <CompactView
            activeSounds={activeSounds}
            isPlaying={isPlaying}
            formattedTime={formattedTime}
            onTogglePlayPause={togglePlayPause}
            onExpand={handleToggleCompact}
          />
        ) : (
          <ExpandedView
            activeSounds={activeSounds}
            volumes={volumes}
            isMuted={isMuted}
            isPlaying={isPlaying}
            currentSlide={currentSlide}
            onToggleSound={toggleSound}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
            onTogglePlayPause={togglePlayPause}
            onPrevSlide={prevSlide}
            onNextSlide={nextSlide}
            onMinimize={handleToggleCompact}
          />
        )}
      </div>
    </div>
  );
}
