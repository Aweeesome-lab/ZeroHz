"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { SoundType, SoundVolumes } from "@/types/audio";
import type { AppSettings } from "@/types/app";
import { DEFAULT_APP_SETTINGS } from "@/types/app";

// Tauri Store 설정
const STORE_FILE = "app-settings.json";
const STORE_KEY = "settings";

// Tauri 환경 체크
const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

interface UseAppSettingsReturn {
  // Audio settings
  activeSounds: Set<SoundType>;
  volumes: SoundVolumes;
  isMuted: boolean;
  language: string;

  // Setters
  setActiveSounds: (sounds: Set<SoundType>) => void;
  setVolumes: (volumes: SoundVolumes) => void;
  setIsMuted: (muted: boolean) => void;
  setLanguage: (lang: string) => void;

  // Utils
  isLoaded: boolean;
}

/**
 * useAppSettings - 앱 설정 저장/불러오기 훅
 * Tauri 환경에서는 파일 기반 Store, 웹에서는 LocalStorage 사용
 */
export function useAppSettings(): UseAppSettingsReturn {
  const [activeSounds, setActiveSoundsState] = useState<Set<SoundType>>(
    new Set(DEFAULT_APP_SETTINGS.activeSounds)
  );
  const [volumes, setVolumesState] = useState<SoundVolumes>(
    DEFAULT_APP_SETTINGS.volumes
  );
  const [isMuted, setIsMutedState] = useState(DEFAULT_APP_SETTINGS.isMuted);
  const [language, setLanguageState] = useState(DEFAULT_APP_SETTINGS.language);
  const [isLoaded, setIsLoaded] = useState(false);

  const storeRef = useRef<unknown>(null);

  // Tauri Store 또는 LocalStorage에서 불러오기
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (isTauri) {
          // Tauri Store 사용
          const { load } = await import("@tauri-apps/plugin-store");
          const store = await load(STORE_FILE, {
            autoSave: true,
            defaults: {},
          });
          storeRef.current = store;

          const saved = await store.get<AppSettings>(STORE_KEY);
          if (saved) {
            setActiveSoundsState(new Set(saved.activeSounds));
            setVolumesState(saved.volumes);
            setIsMutedState(saved.isMuted);
            setLanguageState(saved.language);
          }
        } else {
          // 웹 환경: LocalStorage 사용
          const saved = localStorage.getItem("zerohz_app_settings");
          if (saved) {
            const settings = JSON.parse(saved) as AppSettings;
            setActiveSoundsState(new Set(settings.activeSounds));
            setVolumesState(settings.volumes);
            setIsMutedState(settings.isMuted);
            setLanguageState(settings.language);
          }
        }
      } catch (error) {
        console.error("Failed to load app settings:", error);
      }
      setIsLoaded(true);
    };

    loadSettings();
  }, []);

  // 설정 저장
  const saveSettings = useCallback(
    async (settings: AppSettings) => {
      if (!isLoaded) return;

      try {
        if (isTauri && storeRef.current) {
          const store = storeRef.current as {
            set: (key: string, value: unknown) => Promise<void>;
            save: () => Promise<void>;
          };
          await store.set(STORE_KEY, settings);
          await store.save();
        } else {
          localStorage.setItem("zerohz_app_settings", JSON.stringify(settings));
        }
      } catch (error) {
        console.error("Failed to save app settings:", error);
      }
    },
    [isLoaded]
  );

  // Wrapped setters that trigger save
  const setActiveSounds = useCallback(
    (sounds: Set<SoundType>) => {
      setActiveSoundsState(sounds);
      saveSettings({
        activeSounds: Array.from(sounds),
        volumes,
        isMuted,
        language,
      });
    },
    [volumes, isMuted, language, saveSettings]
  );

  const setVolumes = useCallback(
    (newVolumes: SoundVolumes) => {
      setVolumesState(newVolumes);
      saveSettings({
        activeSounds: Array.from(activeSounds),
        volumes: newVolumes,
        isMuted,
        language,
      });
    },
    [activeSounds, isMuted, language, saveSettings]
  );

  const setIsMuted = useCallback(
    (muted: boolean) => {
      setIsMutedState(muted);
      saveSettings({
        activeSounds: Array.from(activeSounds),
        volumes,
        isMuted: muted,
        language,
      });
    },
    [activeSounds, volumes, language, saveSettings]
  );

  const setLanguage = useCallback(
    (lang: string) => {
      setLanguageState(lang);
      saveSettings({
        activeSounds: Array.from(activeSounds),
        volumes,
        isMuted,
        language: lang,
      });
    },
    [activeSounds, volumes, isMuted, saveSettings]
  );

  return {
    activeSounds,
    volumes,
    isMuted,
    language,
    setActiveSounds,
    setVolumes,
    setIsMuted,
    setLanguage,
    isLoaded,
  };
}
