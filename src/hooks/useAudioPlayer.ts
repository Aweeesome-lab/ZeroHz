"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SoundType, SoundVolumes } from "@/types/audio";
import { SOUNDS, DEFAULT_VOLUMES } from "@/constants/sounds";

/**
 * useAudioPlayer - Web Audio API를 사용한 오디오 재생 관리 훅
 *
 * @returns activeSounds - 현재 활성화된 사운드 ID들의 Set
 * @returns volumes - 각 사운드별 볼륨 값 (0~1)을 담은 객체
 * @returns isMuted - 전체 음소거 상태
 * @returns isPlaying - 오디오 재생 상태 (true: 재생 중, false: 일시정지)
 * @returns toggleSound - 특정 사운드 활성화/비활성화 토글 함수
 * @returns handleVolumeChange - 특정 사운드의 볼륨 변경 함수
 * @returns toggleMute - 전체 음소거 토글 함수
 * @returns togglePlayPause - 재생/일시정지 토글 함수 (AudioContext suspend/resume)
 */
interface UseAudioPlayerReturn {
  activeSounds: Set<SoundType>;
  volumes: SoundVolumes;
  isMuted: boolean;
  isPlaying: boolean;
  toggleSound: (id: SoundType) => void;
  handleVolumeChange: (id: SoundType, value: number) => void;
  toggleMute: () => void;
  togglePlayPause: () => Promise<void>;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [activeSounds, setActiveSounds] = useState<Set<SoundType>>(new Set());
  const [volumes, setVolumes] = useState<SoundVolumes>(DEFAULT_VOLUMES);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodesRef = useRef<Record<SoundType, GainNode | null>>({
    rain: null,
    wind: null,
    waves: null,
    forest: null,
    stream: null,
    fire: null,
    flight: null,
    train: null,
    night: null,
    keyboard: null,
    thunder: null,
  });
  const sourceNodesRef = useRef<
    Record<SoundType, AudioBufferSourceNode | null>
  >({
    rain: null,
    wind: null,
    waves: null,
    forest: null,
    stream: null,
    fire: null,
    flight: null,
    train: null,
    night: null,
    keyboard: null,
    thunder: null,
  });
  const audioBuffersRef = useRef<Record<SoundType, AudioBuffer | null>>({
    rain: null,
    wind: null,
    waves: null,
    forest: null,
    stream: null,
    fire: null,
    flight: null,
    train: null,
    night: null,
    keyboard: null,
    thunder: null,
  });

  // Keep track of active sounds in a ref for async access
  const activeSoundsRef = useRef<Set<SoundType>>(new Set());

  // Update ref when state changes
  useEffect(() => {
    activeSoundsRef.current = activeSounds;
  }, [activeSounds]);

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
    const loadAudio = async (sound: (typeof SOUNDS)[number]) => {
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
  }, []);

  // Handle active sounds changes
  useEffect(() => {
    SOUNDS.forEach((sound) => {
      const isPlayingNode = sourceNodesRef.current[sound.id] !== null;
      const shouldPlay = activeSounds.has(sound.id);

      if (shouldPlay && !isPlayingNode) {
        // Resume context if suspended (browser policy) AND we are currently playing
        if (isPlaying && audioContextRef.current?.state === "suspended") {
          audioContextRef.current.resume();
        }
        playSound(sound.id);
      } else if (!shouldPlay && isPlayingNode) {
        stopSound(sound.id);
      }
    });
  }, [activeSounds, playSound, stopSound, isPlaying]);

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

  const toggleSound = useCallback(
    (id: SoundType) => {
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
        audioContextRef.current?.resume();
        setIsPlaying(true);
      }
    },
    [activeSounds.size, isPlaying]
  );

  const handleVolumeChange = useCallback((id: SoundType, value: number) => {
    setVolumes((prev) => ({ ...prev, [id]: value }));
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!audioContextRef.current) return;

    if (isPlaying) {
      await audioContextRef.current.suspend();
      setIsPlaying(false);
    } else {
      await audioContextRef.current.resume();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  return {
    activeSounds,
    volumes,
    isMuted,
    isPlaying,
    toggleSound,
    handleVolumeChange,
    toggleMute,
    togglePlayPause,
  };
}
