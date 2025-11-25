"use client";

import { useState, useEffect, useRef } from "react";
import {
  Wind,
  CloudRain,
  Flame,
  Waves,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SoundType = "wind" | "rain" | "fire" | "waves";

interface SoundControl {
  id: SoundType;
  icon: React.ElementType;
  label: string;
}

const SOUNDS: SoundControl[] = [
  { id: "wind", icon: Wind, label: "Wind" },
  { id: "rain", icon: CloudRain, label: "Rain" },
  { id: "fire", icon: Flame, label: "Fire" },
  { id: "waves", icon: Waves, label: "Waves" },
];

export default function DemoPlayer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [activeSounds, setActiveSounds] = useState<Set<SoundType>>(
    new Set(["rain"])
  );
  const [volumes, setVolumes] = useState<Record<SoundType, number>>({
    wind: 0.5,
    rain: 0.5,
    fire: 0.5,
    waves: 0.5,
  });
  const [isCompact, setIsCompact] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // Audio refs
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({
    wind: null,
    rain: null,
    fire: null,
    waves: null,
  });

  // Initialize audio elements
  useEffect(() => {
    SOUNDS.forEach((sound) => {
      const audio = new Audio(`/sounds/${sound.id}.ogg`);
      audio.loop = true;
      audioRefs.current[sound.id] = audio;
    });

    const refs = audioRefs.current; // Capture ref for cleanup

    return () => {
      SOUNDS.forEach((sound) => {
        const audio = refs[sound.id];
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      });
    };
  }, []);

  // Handle active sounds changes
  useEffect(() => {
    SOUNDS.forEach((sound) => {
      const audio = audioRefs.current[sound.id];
      if (!audio) return;

      const shouldPlay = activeSounds.has(sound.id);

      if (shouldPlay) {
        // Only play if global isPlaying is true
        if (isPlaying && audio.paused) {
          audio.play().catch(() => {
            // Auto-play policy might block this without user interaction
            console.log("Playback prevented by browser policy");
            setIsPlaying(false);
          });
        }
      } else {
        if (!audio.paused) {
          audio.pause();
          audio.currentTime = 0;
        }
      }
    });
  }, [activeSounds, isPlaying]);

  // Handle volume/mute changes
  useEffect(() => {
    SOUNDS.forEach((sound) => {
      const audio = audioRefs.current[sound.id];
      if (audio) {
        audio.volume = isMuted ? 0 : volumes[sound.id];
      }
    });
  }, [volumes, isMuted]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeSounds.size > 0 && isPlaying) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [activeSounds, isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleSound = (id: SoundType) => {
    setActiveSounds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });

    // If we are adding the first sound, ensure we are playing
    if (activeSounds.size === 0 && !isPlaying) {
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (id: SoundType, value: number) => {
    setVolumes((prev) => ({ ...prev, [id]: value }));
  };

  const togglePlayPause = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);

    // Manually sync audio elements
    SOUNDS.forEach((sound) => {
      const audio = audioRefs.current[sound.id];
      if (!audio) return;

      if (activeSounds.has(sound.id)) {
        if (newIsPlaying) {
          audio.play().catch(console.error);
        } else {
          audio.pause();
        }
      }
    });
  };

  return (
    <div
      className={cn("flex justify-center items-center w-full py-12", className)}
      {...props}
    >
      <div
        className={cn(
          "flex items-center gap-3 p-2.5 rounded-full bg-[#1A1A1A] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out border border-white/10 hover:scale-105 hover:shadow-[0_30px_60px_rgba(0,0,0,0.6)]",
          isCompact ? "px-3 py-1.5 gap-2" : ""
        )}
      >
        {isCompact ? (
          // Compact Mode UI
          <>
            <button
              onClick={togglePlayPause}
              className="text-white/70 hover:text-white transition-colors p-0.5"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>

            <div className="font-mono text-xs text-white/80 font-medium min-w-[36px] text-center select-none">
              {formatTime(elapsedTime)}
            </div>

            {activeSounds.size > 0 && (
              <>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-1.5">
                  {SOUNDS.filter((s) => activeSounds.has(s.id)).map((sound) => {
                    const Icon = sound.icon;
                    return (
                      <Icon
                        key={sound.id}
                        size={12}
                        className="text-white/70"
                      />
                    );
                  })}
                </div>
              </>
            )}
          </>
        ) : (
          // Full Mode UI
          <>
            {SOUNDS.map((sound) => {
              const isActive = activeSounds.has(sound.id);
              const Icon = sound.icon;

              return (
                <div
                  key={sound.id}
                  className="relative group flex flex-col items-center"
                >
                  <button
                    onClick={() => toggleSound(sound.id)}
                    className={cn(
                      "p-2.5 rounded-full transition-all duration-300 ease-in-out border-0",
                      isActive
                        ? "bg-white/90 text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                        : "bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
                    )}
                    title={sound.label}
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
                      value={volumes[sound.id]}
                      onChange={(e) =>
                        handleVolumeChange(sound.id, parseFloat(e.target.value))
                      }
                      className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                    />
                  </div>
                </div>
              );
            })}

            <div className="w-px h-6 bg-white/20 mx-1" />

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "p-2.5 rounded-full transition-all duration-300 ease-in-out border-0",
                isMuted
                  ? "bg-red-500/80 text-white"
                  : "bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
              )}
              title="Mute All"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            <button
              onClick={togglePlayPause}
              className={cn(
                "p-2.5 rounded-full transition-all duration-300 ease-in-out border-0",
                !isPlaying
                  ? "bg-amber-500/80 text-white"
                  : "bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
              )}
              title={isPlaying ? "Pause All" : "Resume All"}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
          </>
        )}

        {/* Toggle Mode Button */}
        <div
          className={cn(
            "w-px h-6 bg-white/20 mx-1",
            isCompact && activeSounds.size === 0 ? "hidden" : ""
          )}
        />

        <button
          onClick={() => setIsCompact(!isCompact)}
          className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
          title={isCompact ? "Expand" : "Compact Mode"}
        >
          {isCompact ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        </button>
      </div>
    </div>
  );
}
