"use client";

import { useState, useRef, useEffect } from "react";
import { Wind, CloudRain, Flame, Waves, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

type SoundType = "wind" | "rain" | "fire" | "waves";

interface SoundControl {
  id: SoundType;
  icon: React.ElementType;
  label: string;
  src: string;
}

const SOUNDS: SoundControl[] = [
  { id: "wind", icon: Wind, label: "Wind", src: "/sounds/wind.mp3" },
  { id: "rain", icon: CloudRain, label: "Rain", src: "/sounds/rain.mp3" },
  { id: "fire", icon: Flame, label: "Fire", src: "/sounds/fire.mp3" },
  { id: "waves", icon: Waves, label: "Waves", src: "/sounds/waves.mp3" },
];

export default function FloatingBar() {
  const [activeSounds, setActiveSounds] = useState<Set<SoundType>>(new Set());
  const [volumes, setVolumes] = useState<Record<SoundType, number>>({
    wind: 0.5,
    rain: 0.5,
    fire: 0.5,
    waves: 0.5,
  });
  const [isMuted, setIsMuted] = useState(false);
  const audioRefs = useRef<Record<SoundType, HTMLAudioElement | null>>({
    wind: null,
    rain: null,
    fire: null,
    waves: null,
  });

  useEffect(() => {
    // Initialize audio refs
    SOUNDS.forEach((sound) => {
      if (!audioRefs.current[sound.id]) {
        const audio = new Audio(sound.src);
        audio.loop = true;
        audioRefs.current[sound.id] = audio;
      }
    });

    const currentAudioRefs = audioRefs.current;
    return () => {
      SOUNDS.forEach((sound) => {
        const audio = currentAudioRefs[sound.id];
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      });
    };
  }, []);

  useEffect(() => {
    SOUNDS.forEach((sound) => {
      const audio = audioRefs.current[sound.id];
      if (audio) {
        if (activeSounds.has(sound.id) && !isMuted) {
          audio.volume = volumes[sound.id];
          if (audio.paused)
            audio.play().catch((e) => console.error("Play error:", e));
        } else {
          audio.pause();
        }
      }
    });
  }, [activeSounds, volumes, isMuted]);

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
  };

  const handleVolumeChange = (id: SoundType, value: number) => {
    setVolumes((prev) => ({ ...prev, [id]: value }));
    const audio = audioRefs.current[id];
    if (audio) {
      audio.volume = value;
    }
  };

  return (
    <div
      className="flex justify-center items-center w-full h-full"
      data-tauri-drag-region
    >
      <div
        className="flex items-center gap-4 p-3 rounded-full bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl transition-all hover:bg-white/15"
        data-tauri-drag-region
      >
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
                  "p-3 rounded-full transition-all duration-300 ease-in-out",
                  isActive
                    ? "bg-white/90 text-black shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    : "bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
                )}
                title={sound.label}
                data-tauri-drag-region="false"
              >
                <Icon size={24} />
              </button>

              {/* Volume Slider (Visible on hover/active) */}
              <div
                className={cn(
                  "absolute -bottom-8 left-1/2 -translate-x-1/2 w-20 transition-all duration-200 origin-top z-50",
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
                  data-tauri-drag-region="false"
                />
              </div>
            </div>
          );
        })}

        <div className="w-px h-8 bg-white/20 mx-1" />

        <button
          onClick={() => setIsMuted(!isMuted)}
          className={cn(
            "p-3 rounded-full transition-all duration-300 ease-in-out",
            isMuted
              ? "bg-red-500/80 text-white"
              : "bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
          )}
          title="Mute All"
          data-tauri-drag-region="false"
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
      </div>
    </div>
  );
}
