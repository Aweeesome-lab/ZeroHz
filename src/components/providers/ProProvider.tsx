"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import type { ProSettingsData, UpgradeReason } from "@/types/pro";
import {
  FREE_DAILY_PLAYTIME_LIMIT,
  FREE_TIMER_TRIAL_COUNT,
} from "@/types/pro";
import { validateLicense, activateLicense } from "@/lib/license";

// 저장소 키
const STORE_FILE = "pro-settings.json";
const STORE_KEY = "pro";

// Tauri 환경 체크
const isTauri =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

// 오늘 날짜 (YYYY-MM-DD)
const getTodayDate = () => new Date().toISOString().split("T")[0];

interface ProContextValue {
  // Pro 상태
  isPro: boolean;
  isValidating: boolean;
  licenseKey: string | null;

  // Free 제한 상태
  dailyPlaytimeRemaining: number;
  timerTrialRemaining: number;

  // 액션
  activateLicenseKey: (key: string) => Promise<{ success: boolean; error?: string }>;
  removeLicense: () => void;

  // 플레이타임 추적
  trackPlaytime: (seconds: number) => void;
  useTimerTrial: () => boolean;

  // 업그레이드 필요 여부
  canPlay: () => boolean;
  canUseTimer: () => boolean;
  getUpgradeReason: () => UpgradeReason | null;

  // 로딩 상태
  isLoaded: boolean;
}

const ProContext = createContext<ProContextValue | null>(null);

export function ProProvider({ children }: { children: React.ReactNode }) {
  // Pro 상태
  const [isPro, setIsPro] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);

  // Free 제한 상태
  const [dailyPlaytimeUsed, setDailyPlaytimeUsed] = useState(0);
  const [lastPlayDate, setLastPlayDate] = useState(getTodayDate());
  const [timerTrialUsed, setTimerTrialUsed] = useState(0);

  const [isLoaded, setIsLoaded] = useState(false);
  const storeRef = useRef<unknown>(null);

  // 계산된 값
  const dailyPlaytimeRemaining = Math.max(
    0,
    FREE_DAILY_PLAYTIME_LIMIT - dailyPlaytimeUsed
  );
  const timerTrialRemaining = Math.max(
    0,
    FREE_TIMER_TRIAL_COUNT - timerTrialUsed
  );

  // 저장
  const saveSettings = useCallback(
    async (data: ProSettingsData) => {
      try {
        if (isTauri && storeRef.current) {
          const store = storeRef.current as {
            set: (key: string, value: unknown) => Promise<void>;
            save: () => Promise<void>;
          };
          await store.set(STORE_KEY, data);
          await store.save();
        } else {
          localStorage.setItem("zerohz_pro_settings", JSON.stringify(data));
        }
      } catch (error) {
        console.error("Failed to save pro settings:", error);
      }
    },
    []
  );

  // 초기 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        let saved: ProSettingsData | null = null;

        if (isTauri) {
          const { load } = await import("@tauri-apps/plugin-store");
          const store = await load(STORE_FILE, { autoSave: true, defaults: {} });
          storeRef.current = store;
          saved = (await store.get<ProSettingsData>(STORE_KEY)) ?? null;
        } else {
          const raw = localStorage.getItem("zerohz_pro_settings");
          if (raw) saved = JSON.parse(raw);
        }

        if (saved) {
          setLicenseKey(saved.licenseKey);
          setTimerTrialUsed(saved.timerTrialUsed);

          // 날짜 체크 - 다른 날이면 플레이타임 리셋
          const today = getTodayDate();
          if (saved.lastPlayDate === today) {
            setDailyPlaytimeUsed(saved.dailyPlaytimeUsed);
            setLastPlayDate(saved.lastPlayDate);
          } else {
            setDailyPlaytimeUsed(0);
            setLastPlayDate(today);
          }

          // 저장된 라이센스 키가 있으면 검증
          if (saved.licenseKey) {
            setIsValidating(true);
            const result = await validateLicense(saved.licenseKey);
            setIsPro(result.valid);
            setIsValidating(false);

            // 유효하지 않으면 키 제거
            if (!result.valid) {
              setLicenseKey(null);
              await saveSettings({
                licenseKey: null,
                dailyPlaytimeUsed: 0,
                lastPlayDate: today,
                timerTrialUsed: saved.timerTrialUsed,
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to load pro settings:", error);
      }
      setIsLoaded(true);
    };

    loadSettings();
  }, [saveSettings]);

  // 라이센스 활성화
  const activateLicenseKey = useCallback(
    async (key: string): Promise<{ success: boolean; error?: string }> => {
      setIsValidating(true);

      try {
        const result = await activateLicense(key);

        if (result.valid) {
          setIsPro(true);
          setLicenseKey(key);
          await saveSettings({
            licenseKey: key,
            dailyPlaytimeUsed,
            lastPlayDate,
            timerTrialUsed,
          });
          setIsValidating(false);
          return { success: true };
        } else {
          setIsValidating(false);
          return {
            success: false,
            error: result.error || "Invalid license key",
          };
        }
      } catch (error) {
        setIsValidating(false);
        return {
          success: false,
          error: "Failed to validate license",
        };
      }
    },
    [dailyPlaytimeUsed, lastPlayDate, timerTrialUsed, saveSettings]
  );

  // 라이센스 제거
  const removeLicense = useCallback(() => {
    setIsPro(false);
    setLicenseKey(null);
    saveSettings({
      licenseKey: null,
      dailyPlaytimeUsed,
      lastPlayDate,
      timerTrialUsed,
    });
  }, [dailyPlaytimeUsed, lastPlayDate, timerTrialUsed, saveSettings]);

  // 플레이타임 추적
  const trackPlaytime = useCallback(
    (seconds: number) => {
      if (isPro) return;

      const today = getTodayDate();
      let newUsed = dailyPlaytimeUsed;
      let newDate = lastPlayDate;

      if (lastPlayDate !== today) {
        newUsed = 0;
        newDate = today;
        setLastPlayDate(today);
      }

      newUsed = Math.min(newUsed + seconds, FREE_DAILY_PLAYTIME_LIMIT);
      setDailyPlaytimeUsed(newUsed);

      saveSettings({
        licenseKey,
        dailyPlaytimeUsed: newUsed,
        lastPlayDate: newDate,
        timerTrialUsed,
      });
    },
    [isPro, dailyPlaytimeUsed, lastPlayDate, licenseKey, timerTrialUsed, saveSettings]
  );

  // 타이머 트라이얼 사용
  const useTimerTrial = useCallback((): boolean => {
    if (isPro) return true;
    if (timerTrialUsed >= FREE_TIMER_TRIAL_COUNT) return false;

    const newUsed = timerTrialUsed + 1;
    setTimerTrialUsed(newUsed);

    saveSettings({
      licenseKey,
      dailyPlaytimeUsed,
      lastPlayDate,
      timerTrialUsed: newUsed,
    });

    return true;
  }, [isPro, timerTrialUsed, licenseKey, dailyPlaytimeUsed, lastPlayDate, saveSettings]);

  // 재생 가능 여부
  const canPlay = useCallback((): boolean => {
    if (isPro) return true;
    return dailyPlaytimeRemaining > 0;
  }, [isPro, dailyPlaytimeRemaining]);

  // 타이머 사용 가능 여부
  const canUseTimer = useCallback((): boolean => {
    if (isPro) return true;
    return timerTrialRemaining > 0;
  }, [isPro, timerTrialRemaining]);

  // 업그레이드 필요 이유
  const getUpgradeReason = useCallback((): UpgradeReason | null => {
    if (isPro) return null;
    if (dailyPlaytimeRemaining <= 0) return "playtime";
    return null;
  }, [isPro, dailyPlaytimeRemaining]);

  const value: ProContextValue = {
    isPro,
    isValidating,
    licenseKey,
    dailyPlaytimeRemaining,
    timerTrialRemaining,
    activateLicenseKey,
    removeLicense,
    trackPlaytime,
    useTimerTrial,
    canPlay,
    canUseTimer,
    getUpgradeReason,
    isLoaded,
  };

  return <ProContext.Provider value={value}>{children}</ProContext.Provider>;
}

export function usePro() {
  const context = useContext(ProContext);
  if (!context) {
    throw new Error("usePro must be used within a ProProvider");
  }
  return context;
}
