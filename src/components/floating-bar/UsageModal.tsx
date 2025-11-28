"use client";

import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Clock, Timer, Sparkles, Crown } from "lucide-react";
import { usePro } from "@/hooks";
import { FREE_DAILY_PLAYTIME_LIMIT, FREE_TIMER_TRIAL_COUNT } from "@/types/pro";

interface UsageModalProps {
  onClose: () => void;
}

const MODAL_WINDOW_SIZE = { width: 400, height: 420 };
const PURCHASE_URL =
  "https://zerohz-app.lemonsqueezy.com/buy/7f3f5f67-5a6c-4bec-8bb1-919aa1d735f3";

export function UsageModal({ onClose }: UsageModalProps) {
  const { t } = useTranslation();
  const pro = usePro();
  const originalSizeRef = useRef<{ width: number; height: number } | null>(
    null
  );
  const originalPositionRef = useRef<{ x: number; y: number } | null>(null);

  // 모달 열릴 때 윈도우 크기 확장 및 중앙 배치
  useEffect(() => {
    const expandWindow = async () => {
      try {
        const {
          getCurrentWindow,
          LogicalSize,
          PhysicalPosition,
          currentMonitor,
        } = await import("@tauri-apps/api/window");
        const appWindow = getCurrentWindow();

        // 현재 크기 및 위치 저장
        const currentSize = await appWindow.outerSize();
        const currentPos = await appWindow.outerPosition();

        originalSizeRef.current = {
          width: currentSize.width,
          height: currentSize.height,
        };
        originalPositionRef.current = {
          x: currentPos.x,
          y: currentPos.y,
        };

        // 모달 크기로 확장
        await appWindow.setSize(
          new LogicalSize(MODAL_WINDOW_SIZE.width, MODAL_WINDOW_SIZE.height)
        );

        // 화면 상단 중앙으로 이동
        const monitor = await currentMonitor();
        if (monitor) {
          const scaleFactor = monitor.scaleFactor;
          const monitorSize = monitor.size;
          const monitorPosition = monitor.position;

          const physicalWidth = MODAL_WINDOW_SIZE.width * scaleFactor;

          const x =
            monitorPosition.x +
            Math.round((monitorSize.width - physicalWidth) / 2);
          const y = monitorPosition.y + 50;

          await appWindow.setPosition(new PhysicalPosition(x, y));
        }
      } catch {
        console.log("Not in Tauri environment");
      }
    };

    expandWindow();

    return () => {
      const restoreWindow = async () => {
        if (originalSizeRef.current && originalPositionRef.current) {
          try {
            const { getCurrentWindow, PhysicalSize, PhysicalPosition } =
              await import("@tauri-apps/api/window");
            const appWindow = getCurrentWindow();

            await appWindow.setSize(
              new PhysicalSize(
                originalSizeRef.current.width,
                originalSizeRef.current.height
              )
            );

            await appWindow.setPosition(
              new PhysicalPosition(
                originalPositionRef.current.x,
                originalPositionRef.current.y
              )
            );
          } catch {
            console.log("Failed to restore window size/position");
          }
        }
      };
      restoreWindow();
    };
  }, []);

  // ESC 키로 닫기
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // 시간 포맷팅 (초 -> 시간:분 or 분)
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}${t("usage.hours")} ${minutes}${t("usage.minutes")}`;
    }
    return `${minutes}${t("usage.minutes")}`;
  };

  // Pro 구매 페이지 열기
  const handlePurchase = async () => {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(PURCHASE_URL);
    } catch (error) {
      console.error("Failed to open URL:", error);
      // 웹 환경 fallback
      window.open(PURCHASE_URL, "_blank");
    }
    onClose();
  };

  const playtimeUsed = FREE_DAILY_PLAYTIME_LIMIT - pro.dailyPlaytimeRemaining;
  const playtimePercent = (playtimeUsed / FREE_DAILY_PLAYTIME_LIMIT) * 100;

  const timerUsed = FREE_TIMER_TRIAL_COUNT - pro.timerTrialRemaining;
  const timerPercent = (timerUsed / FREE_TIMER_TRIAL_COUNT) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1A1A1A] overflow-hidden rounded-2xl border border-white/10">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <h3 className="text-white text-sm font-semibold">
            {t("usage.title")}
          </h3>
          {pro.isPro && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30">
              <Crown size={12} className="text-yellow-400" />
              <span className="text-xs font-medium text-yellow-400">Pro</span>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {pro.isPro ? (
          // Pro 사용자
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex items-center justify-center mb-4 border border-yellow-500/30">
              <Sparkles size={40} className="text-yellow-400" />
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">
              {t("usage.proUnlimited")}
            </h4>
            <p className="text-white/60 text-sm">{t("usage.proDescription")}</p>
          </div>
        ) : (
          // 무료 사용자
          <div className="space-y-6">
            {/* 오늘 재생 시간 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/80">
                <Clock size={18} />
                <span className="text-sm font-medium">
                  {t("usage.playbackTime")}
                </span>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-bold text-white">
                    {formatTime(playtimeUsed)}
                  </span>
                  <span className="text-sm text-white/50">
                    / {formatTime(FREE_DAILY_PLAYTIME_LIMIT)}
                  </span>
                </div>

                {/* 프로그레스 바 */}
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${Math.min(playtimePercent, 100)}%` }}
                  />
                </div>

                <div className="mt-2 text-xs text-white/50">
                  {pro.dailyPlaytimeRemaining > 0
                    ? t("usage.remainingTime", {
                        time: formatTime(pro.dailyPlaytimeRemaining),
                      })
                    : t("usage.limitReached")}
                </div>
              </div>
            </div>

            {/* 타이머 무료 체험 */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white/80">
                <Timer size={18} />
                <span className="text-sm font-medium">
                  {t("usage.timerTrial")}
                </span>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-bold text-white">
                    {timerUsed}
                  </span>
                  <span className="text-sm text-white/50">
                    / {FREE_TIMER_TRIAL_COUNT} {t("usage.times")}
                  </span>
                </div>

                {/* 프로그레스 바 */}
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${Math.min(timerPercent, 100)}%` }}
                  />
                </div>

                <div className="mt-2 text-xs text-white/50">
                  {pro.timerTrialRemaining > 0
                    ? t("usage.remainingTrials", {
                        count: pro.timerTrialRemaining,
                      })
                    : t("usage.trialLimitReached")}
                </div>
              </div>
            </div>

            {/* Pro 업그레이드 CTA */}
            <div className="pt-4 border-t border-white/10">
              <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl p-4 border border-yellow-500/20">
                <div className="flex items-start gap-3 mb-3">
                  <Sparkles size={20} className="text-yellow-400 mt-0.5" />
                  <div>
                    <h5 className="text-sm font-semibold text-white mb-1">
                      {t("usage.upgradeTitle")}
                    </h5>
                    <ul className="text-xs text-white/70 space-y-1">
                      <li>✓ {t("usage.unlimitedPlaytime")}</li>
                      <li>✓ {t("usage.unlimitedTimer")}</li>
                      <li>✓ {t("usage.advancedAnalytics")}</li>
                    </ul>
                  </div>
                </div>
                <button
                  onClick={handlePurchase}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-black font-semibold rounded-lg px-4 py-2.5 text-sm transition-all"
                >
                  {t("usage.upgradeButton")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
