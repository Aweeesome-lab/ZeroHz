"use client";

import { useEffect } from "react";
import { X, Clock, Timer, Sparkles } from "lucide-react";
import type { UpgradeReason } from "@/types/pro";
import { useTranslation } from "react-i18next";

interface ProUpgradeModalProps {
  reason: UpgradeReason;
  onPurchase: () => void;
  onDismiss: () => void;
  onActivateLicense: () => void;
}

const PURCHASE_URL =
  "https://zerohz-app.lemonsqueezy.com/buy/7f3f5f67-5a6c-4bec-8bb1-919aa1d735f3"; // LemonSqueezy Checkout
const MODAL_WINDOW_WIDTH = 700;
const MODAL_WINDOW_HEIGHT = 500;

export function ProUpgradeModal({
  reason,
  onPurchase,
  onDismiss,
  onActivateLicense,
}: ProUpgradeModalProps) {
  const { t } = useTranslation();

  // 모달 열릴 때 윈도우 크기 확장 및 중앙 배치
  useEffect(() => {
    let originalSize: { width: number; height: number } | null = null;
    let originalPosition: { x: number; y: number } | null = null;

    const resizeWindow = async () => {
      try {
        const {
          getCurrentWindow,
          LogicalSize,
          PhysicalPosition,
          currentMonitor,
        } = await import("@tauri-apps/api/window");
        const window = getCurrentWindow();

        // 현재 크기 및 위치 저장
        const size = await window.outerSize();
        const position = await window.outerPosition();
        originalSize = { width: size.width, height: size.height };
        originalPosition = { x: position.x, y: position.y };

        // 모달 크기로 변경 (LogicalSize 사용)
        await window.setSize(
          new LogicalSize(MODAL_WINDOW_WIDTH, MODAL_WINDOW_HEIGHT)
        );

        // 화면 상단 중앙으로 이동
        const monitor = await currentMonitor();
        if (monitor) {
          const scaleFactor = monitor.scaleFactor;
          const monitorSize = monitor.size;
          const monitorPosition = monitor.position;

          const physicalWidth = MODAL_WINDOW_WIDTH * scaleFactor;

          const x =
            monitorPosition.x +
            Math.round((monitorSize.width - physicalWidth) / 2);
          const y = monitorPosition.y + 50;

          await window.setPosition(new PhysicalPosition(x, y));
        }
      } catch {
        // 웹 환경에서는 무시
      }
    };

    resizeWindow();

    return () => {
      const restoreWindow = async () => {
        if (originalSize && originalPosition) {
          try {
            const { getCurrentWindow, PhysicalSize, PhysicalPosition } =
              await import("@tauri-apps/api/window");
            const window = getCurrentWindow();

            // 크기 및 위치 복원
            await window.setSize(
              new PhysicalSize(originalSize.width, originalSize.height)
            );
            await window.setPosition(
              new PhysicalPosition(originalPosition.x, originalPosition.y)
            );
          } catch {
            // 웹 환경에서는 무시
          }
        }
      };
      restoreWindow();
    };
  }, []);

  const content = {
    playtime: {
      icon: Clock,
      title: t("pro.playtimeLimitTitle"),
      description: t("pro.playtimeLimitDescription"),
    },
    timer: {
      icon: Timer,
      title: t("pro.timerTrialTitle"),
      description: t("pro.timerTrialDescription"),
    },
  };

  const { icon: Icon, title, description } = content[reason];

  const handlePurchase = async () => {
    // 외부 브라우저에서 구매 페이지 열기
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      console.log("Opening URL:", PURCHASE_URL);
      await openUrl(PURCHASE_URL);
      console.log("URL opened successfully");
    } catch (error) {
      console.error("Failed to open URL:", error);
      // 웹 환경 fallback
      window.open(PURCHASE_URL, "_blank");
    }
    onPurchase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <Icon size={32} className="text-white" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>

          {/* Description */}
          <p className="text-white/60 text-sm mb-6 leading-relaxed">
            {description}
          </p>

          {/* Pro features */}
          <div className="w-full bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-white/80 text-sm mb-3">
              <Sparkles size={16} className="text-white" />
              <span className="font-medium">{t("pro.featuresTitle")}</span>
            </div>
            <ul className="text-left text-white/60 text-sm space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-white">✓</span>
                {t("pro.featureUnlimitedPlaytime")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-white">✓</span>
                {t("pro.featureUnlimitedTimer")}
              </li>
              <li className="flex items-center gap-2">
                <span className="text-white">✓</span>
                {t("pro.featureAnalytics")}
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            <button
              onClick={onDismiss}
              className="flex-1 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
            >
              {t("pro.later")}
            </button>
            <button
              onClick={handlePurchase}
              className="flex-1 px-4 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              {t("pro.getPro")}
            </button>
          </div>

          {/* Already have a license */}
          <button
            onClick={onActivateLicense}
            className="mt-4 text-white/40 hover:text-white/60 text-xs transition-colors"
          >
            {t("pro.haveLicense")}
          </button>
        </div>
      </div>
    </div>
  );
}
