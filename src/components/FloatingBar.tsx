"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Wind,
  CloudRain,
  Flame,
  Waves,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SoundType = "wind" | "rain" | "fire" | "waves";

interface SoundControl {
  id: SoundType;
  icon: React.ElementType;
  label: string;
  src: string;
}

const SOUNDS: SoundControl[] = [
  { id: "wind", icon: Wind, label: "Wind", src: "/sounds/wind.ogg" },
  { id: "rain", icon: CloudRain, label: "Rain", src: "/sounds/rain.ogg" },
  { id: "fire", icon: Flame, label: "Fire", src: "/sounds/fire.ogg" },
  { id: "waves", icon: Waves, label: "Waves", src: "/sounds/waves.ogg" },
];

export default function FloatingBar() {
  const [activeSounds, setActiveSounds] = useState<Set<SoundType>>(new Set());
  const [volumes, setVolumes] = useState<Record<SoundType, number>>({
    wind: 0.5,
    rain: 0.5,
    fire: 0.5,
    waves: 0.5,
  });
  const [isCompact, setIsCompact] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeSounds.size > 0) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => clearInterval(interval);
  }, [activeSounds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodesRef = useRef<Record<SoundType, GainNode | null>>({
    wind: null,
    rain: null,
    fire: null,
    waves: null,
  });
  const sourceNodesRef = useRef<
    Record<SoundType, AudioBufferSourceNode | null>
  >({
    wind: null,
    rain: null,
    fire: null,
    waves: null,
  });
  const audioBuffersRef = useRef<Record<SoundType, AudioBuffer | null>>({
    wind: null,
    rain: null,
    fire: null,
    waves: null,
  });

  // Initialize AudioContext
  useEffect(() => {
    const AudioContextClass =
      window.AudioContext ||
      (
        window as unknown as Window & {
          webkitAudioContext: typeof AudioContext;
        }
      ).webkitAudioContext;
    audioContextRef.current = new AudioContextClass();

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Keep track of active sounds in a ref for async access
  const activeSoundsRef = useRef<Set<SoundType>>(new Set());

  // Update ref when state changes
  useEffect(() => {
    activeSoundsRef.current = activeSounds;
  }, [activeSounds]);

  const playSound = useCallback(
    (id: SoundType) => {
      if (!audioContextRef.current || !audioBuffersRef.current[id]) return;

      // Stop existing source if any
      if (sourceNodesRef.current[id]) {
        try {
          sourceNodesRef.current[id]?.stop();
        } catch {
          // Ignore error if already stopped
        }
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffersRef.current[id];
      source.loop = true;

      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = isMuted ? 0 : volumes[id];

      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      source.start(0);

      sourceNodesRef.current[id] = source;
      gainNodesRef.current[id] = gainNode;
    },
    [isMuted, volumes]
  );

  const stopSound = useCallback((id: SoundType) => {
    if (sourceNodesRef.current[id]) {
      try {
        sourceNodesRef.current[id]?.stop();
      } catch {
        // Ignore
      }
      sourceNodesRef.current[id] = null;
      gainNodesRef.current[id] = null;
    }
  }, []);

  // Load audio buffers - Run only ONCE
  useEffect(() => {
    const loadAudio = async (sound: SoundControl) => {
      try {
        const response = await fetch(sound.src);
        const arrayBuffer = await response.arrayBuffer();
        if (audioContextRef.current) {
          const audioBuffer = await audioContextRef.current.decodeAudioData(
            arrayBuffer
          );
          audioBuffersRef.current[sound.id] = audioBuffer;

          // Check the REF to see if we should play this sound now that it's loaded
          if (activeSoundsRef.current.has(sound.id)) {
            playSound(sound.id);
          }
        }
      } catch (error) {
        console.error(`Failed to load sound ${sound.id}:`, error);
      }
    };

    SOUNDS.forEach(loadAudio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once

  // Handle active sounds changes
  useEffect(() => {
    SOUNDS.forEach((sound) => {
      const isPlaying = sourceNodesRef.current[sound.id] !== null;
      const shouldPlay = activeSounds.has(sound.id);

      if (shouldPlay && !isPlaying) {
        // Resume context if suspended (browser policy)
        if (audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume();
        }
        playSound(sound.id);
      } else if (!shouldPlay && isPlaying) {
        stopSound(sound.id);
      }
    });
  }, [activeSounds, playSound, stopSound]);

  // Handle volume/mute changes
  useEffect(() => {
    SOUNDS.forEach((sound) => {
      const gainNode = gainNodesRef.current[sound.id];
      if (gainNode) {
        // Smooth volume transition
        const targetVolume = isMuted ? 0 : volumes[sound.id];
        gainNode.gain.setTargetAtTime(
          targetVolume,
          audioContextRef.current!.currentTime,
          0.1
        );
      }
    });
  }, [volumes, isMuted]);

  const [isResizing, setIsResizing] = useState(false);

  // Resize and center window on mode change
  useEffect(() => {
    const updateWindowSize = async () => {
      // Only trigger resize logic if we are already "resizing" (faded out)
      // or if it's the initial mount (optional, but good for safety)
      if (!isResizing) return;

      try {
        // Dynamic import to avoid SSR issues
        const {
          getCurrentWindow,
          LogicalSize,
          PhysicalPosition,
          currentMonitor,
        } = await import("@tauri-apps/api/window");
        const appWindow = getCurrentWindow();

        // Get current monitor to calculate center position
        const monitor = await currentMonitor();

        if (monitor) {
          const monitorSize = monitor.size;
          const monitorPosition = monitor.position;

          let width, height;

          if (isCompact) {
            width = 250;
            height = 60;
          } else {
            width = 400;
            height = 100;
          }

          // Resize first
          await appWindow.setSize(new LogicalSize(width, height));

          // Calculate new center X position
          const scaleFactor = monitor.scaleFactor;
          const physicalWidth = width * scaleFactor;

          const x =
            monitorPosition.x +
            Math.round((monitorSize.width - physicalWidth) / 2);

          // Keep Y position fixed (top of screen)
          const currentPos = await appWindow.outerPosition();
          const y = currentPos.y;

          await appWindow.setPosition(new PhysicalPosition(x, y));
        }
      } catch (error) {
        console.error("Failed to resize/reposition window:", error);
      } finally {
        // Small delay to ensure window resize is rendered before showing content
        setTimeout(() => setIsResizing(false), 50);
      }
    };

    updateWindowSize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCompact]); // Run when isCompact changes

  const handleToggleCompact = () => {
    if (isResizing) return; // Prevent double clicks
    setIsResizing(true);
    // Wait for fade out animation (100ms) before changing state
    setTimeout(() => {
      setIsCompact((prev) => !prev);
    }, 100);
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
  };

  const handleVolumeChange = (id: SoundType, value: number) => {
    setVolumes((prev) => ({ ...prev, [id]: value }));
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
          // Compact Mode UI
          <>
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
              data-tauri-drag-region="false"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
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
          onClick={handleToggleCompact}
          className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
          title={isCompact ? "Expand" : "Compact Mode"}
          data-tauri-drag-region="false"
        >
          {isCompact ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        </button>
      </div>
    </div>
  );
}
