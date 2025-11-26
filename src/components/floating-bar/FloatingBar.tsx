"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  useAudioPlayer,
  useWindowResize,
  useElapsedTime,
  usePlaybackTracking,
} from "@/hooks";
import { useAnalyticsStatus } from "../providers";
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

  // Hidden Debug Mode
  const analyticsStatus = useAnalyticsStatus();
  const [debugMode, setDebugMode] = useState(false);
  const clickCountRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  const handleDebugTrigger = () => {
    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) {
      clickCountRef.current += 1;
    } else {
      clickCountRef.current = 1;
    }
    lastClickTimeRef.current = now;

    if (clickCountRef.current >= 5) {
      setDebugMode((prev) => !prev);
      clickCountRef.current = 0;
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <div
      className={cn(
        "flex justify-center items-center w-full h-full transition-opacity duration-100 relative",
        isResizing ? "opacity-0" : "opacity-100"
      )}
      data-tauri-drag-region
      onClick={handleDebugTrigger}
    >
      {debugMode && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap z-50 pointer-events-none border border-white/10">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                analyticsStatus.isReady ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span>
              {analyticsStatus.isReady ? "Analytics Ready" : "Analytics Failed"}
            </span>
          </div>
          {analyticsStatus.error && (
            <div className="text-red-400 mt-1 max-w-[200px] truncate">
              {analyticsStatus.error}
            </div>
          )}
        </div>
      )}
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
