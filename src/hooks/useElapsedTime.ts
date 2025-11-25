"use client";

import { useState, useEffect } from "react";

/**
 * useElapsedTime - 경과 시간을 추적하는 훅
 *
 * @param isActive - 타이머 활성화 여부 (활성 사운드가 있을 때 true)
 * @param isPlaying - 재생 상태 (일시정지 시 타이머도 정지)
 * @returns elapsedTime - 경과된 초 단위 시간
 * @returns formattedTime - "MM:SS" 형식의 시간 문자열
 */
export function useElapsedTime(isActive: boolean, isPlaying: boolean) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && isPlaying) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    elapsedTime,
    formattedTime: formatTime(elapsedTime),
  };
}
