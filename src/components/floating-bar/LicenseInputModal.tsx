"use client";

import { useState, useEffect } from "react";
import { X, Key, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isValidLicenseKeyFormat } from "@/lib/license";

interface LicenseInputModalProps {
  onActivate: (key: string) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

const MODAL_WINDOW_WIDTH = 700;
const MODAL_WINDOW_HEIGHT = 400;

export function LicenseInputModal({
  onActivate,
  onClose,
}: LicenseInputModalProps) {
  const { t } = useTranslation();
  const [licenseKey, setLicenseKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedKey = licenseKey.trim();

    // 형식 검증
    if (!isValidLicenseKeyFormat(trimmedKey)) {
      setError(t("pro.invalidLicense"));
      return;
    }

    setIsLoading(true);

    const result = await onActivate(trimmedKey);

    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
      // 1.5초 후 모달 닫기
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setError(result.error || t("pro.invalidLicense"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/70 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <Key size={32} className="text-white" />
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-white mb-2">
            {t("pro.activateLicense")}
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full mt-4">
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => {
                setLicenseKey(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder={t("pro.enterLicenseKey")}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/30 font-mono text-sm"
              disabled={isLoading || success}
              autoFocus
            />

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 mt-3 text-red-400 text-sm">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Success message */}
            {success && (
              <div className="flex items-center gap-2 mt-3 text-white text-sm">
                <CheckCircle size={16} />
                <span>{t("pro.activated")}</span>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || success || !licenseKey.trim()}
              className="w-full mt-4 px-4 py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Validating...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle size={18} />
                  <span>{t("pro.activated")}</span>
                </>
              ) : (
                t("pro.activate")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
