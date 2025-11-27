"use client";

import { useState, useEffect, useCallback } from "react";

interface WindowDimensions {
  compact: { width: number; height: number };
  expanded: { width: number; height: number };
}

const DEFAULT_DIMENSIONS: WindowDimensions = {
  compact: { width: 280, height: 60 },
  expanded: { width: 700, height: 100 },
};

/**
 * useWindowResize - Tauri 윈도우 크기 조절 및 모드 전환 관리 훅
 *
 * @param dimensions - 컴팩트/확장 모드의 윈도우 크기 설정 (선택사항)
 * @returns isCompact - 현재 컴팩트 모드 여부
 * @returns isResizing - 리사이징 애니메이션 진행 중 여부 (fade-out 효과에 사용)
 * @returns handleToggleCompact - 컴팩트/확장 모드 토글 함수
 */
interface UseWindowResizeReturn {
  isCompact: boolean;
  isResizing: boolean;
  handleToggleCompact: () => void;
}

export function useWindowResize(
  dimensions: WindowDimensions = DEFAULT_DIMENSIONS
): UseWindowResizeReturn {
  const [isCompact, setIsCompact] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Resize and center window on mode change
  useEffect(() => {
    const updateWindowSize = async () => {
      // Only trigger resize logic if we are already "resizing" (faded out)
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

          const { width, height } = isCompact
            ? dimensions.compact
            : dimensions.expanded;

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
  }, [isCompact]);

  const handleToggleCompact = useCallback(() => {
    if (isResizing) return; // Prevent double clicks
    setIsResizing(true);
    // Wait for fade out animation (100ms) before changing state
    setTimeout(() => {
      setIsCompact((prev) => !prev);
    }, 100);
  }, [isResizing]);

  return {
    isCompact,
    isResizing,
    handleToggleCompact,
  };
}
