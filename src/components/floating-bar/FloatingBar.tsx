"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  useAudioPlayer,
  useWindowResize,
  usePlaybackTracking,
  useTimer,
  useTimerSessions,
  createSessionData,
  useAppSettings,
  usePro,
} from "@/hooks";
import { SOUNDS, ITEMS_PER_SLIDE } from "@/constants/sounds";
import { CompactView } from "./CompactView";
import { ExpandedView } from "./ExpandedView";
import { SessionHistoryModal } from "./SessionHistoryModal";
import { ProUpgradeModal } from "./ProUpgradeModal";
import { LicenseInputModal } from "./LicenseInputModal";
import { trackEvent } from "@/lib/analytics";
import {
  playTimerCompleteSound,
  playTimerWarningSound,
} from "@/lib/notification-sound";
import type { TimerPreset } from "@/types/timer";
import type { SoundType } from "@/types/audio";

function FloatingBarContent() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = Math.ceil(SOUNDS.length / ITEMS_PER_SLIDE);
  const [currentPresetId, setCurrentPresetId] = useState<string | undefined>();
  const [showSessionHistory, setShowSessionHistory] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);

  // Pro 상태 관리
  const pro = usePro();

  // Load settings from persistent storage
  const settings = useAppSettings();

  const {
    activeSounds,
    volumes,
    isMuted,
    toggleSound: audioToggleSound,
    handleVolumeChange: audioHandleVolumeChange,
    toggleMute: audioToggleMute,
  } = useAudioPlayer({
    initialVolumes: settings.isLoaded ? settings.volumes : undefined,
    initialMuted: settings.isLoaded ? settings.isMuted : undefined,
    initialActiveSounds: settings.isLoaded ? settings.activeSounds : undefined,
  });

  const { isCompact, isResizing, handleToggleCompact } = useWindowResize();

  // 세션 기록
  const { sessions, stats, addSession, clearSessions } = useTimerSessions();

  // Sync audio player state to settings
  useEffect(() => {
    if (settings.isLoaded) {
      settings.setActiveSounds(activeSounds);
    }
  }, [activeSounds, settings]);

  useEffect(() => {
    if (settings.isLoaded) {
      settings.setVolumes(volumes);
    }
  }, [volumes, settings]);

  useEffect(() => {
    if (settings.isLoaded) {
      settings.setIsMuted(isMuted);
    }
  }, [isMuted, settings]);

  const handleVolumeChange = useCallback(
    (id: SoundType, value: number) => {
      audioHandleVolumeChange(id, value);
    },
    [audioHandleVolumeChange]
  );

  const toggleMute = useCallback(() => {
    audioToggleMute();
  }, [audioToggleMute]);

  // 타이머 완료 콜백
  const handleTimerComplete = useCallback(() => {
    playTimerCompleteSound(0.7);
  }, []);

  // 타이머 경고 콜백
  const handleTimerWarning = useCallback(() => {
    playTimerWarningSound(0.5);
  }, []);

  // 타이머 훅
  const timer = useTimer({
    onComplete: handleTimerComplete,
    onWarning: handleTimerWarning,
  });

  // 소리 토글 (재생 상태와 독립적으로 동작)
  const toggleSound = useCallback(
    (id: SoundType) => {
      audioToggleSound(id);
    },
    [audioToggleSound]
  );

  // 타이머 refs (콜백에서 최신 값 참조용)
  const activeSoundsRef = useRef(activeSounds);
  const currentPresetIdRef = useRef(currentPresetId);

  useEffect(() => {
    activeSoundsRef.current = activeSounds;
  }, [activeSounds]);

  useEffect(() => {
    currentPresetIdRef.current = currentPresetId;
  }, [currentPresetId]);

  // Tauri 이벤트 리스너 (트레이 메뉴에서 세션 기록/라이센스 열기)
  useEffect(() => {
    let unlistenSessionHistory: (() => void) | undefined;
    let unlistenLicenseInput: (() => void) | undefined;

    const setupListeners = async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        unlistenSessionHistory = await listen("open-session-history", () => {
          setShowSessionHistory(true);
        });
        unlistenLicenseInput = await listen("open-license-input", () => {
          setShowLicenseModal(true);
        });
      } catch {
        // 웹 환경에서는 무시
      }
    };

    setupListeners();

    return () => {
      unlistenSessionHistory?.();
      unlistenLicenseInput?.();
    };
  }, []);

  // 타이머 완료 시 세션 기록 (카운트다운만 완료 가능)
  // useRef로 중복 실행 방지
  const completedSessionRef = useRef<number | null>(null);

  useEffect(() => {
    if (timer.isCompleted && timer.startedAt) {
      // 이미 기록된 세션인지 확인 (startedAt timestamp로 구분)
      if (completedSessionRef.current === timer.startedAt) {
        return;
      }
      completedSessionRef.current = timer.startedAt;

      addSession(
        createSessionData(
          timer.mode,
          timer.targetSeconds,
          timer.targetSeconds,
          timer.startedAt,
          true,
          Array.from(activeSoundsRef.current),
          timer.mode === "countdown" ? currentPresetIdRef.current : undefined
        )
      );

      // Analytics 이벤트
      trackEvent("timer_completed", {
        mode: timer.mode,
        target_seconds: timer.targetSeconds,
        preset:
          timer.mode === "countdown" ? currentPresetIdRef.current : undefined,
        active_sounds_count: activeSoundsRef.current.size,
      });

      // Pro: 타이머 완료 시 트라이얼 차감 (Free 사용자만)
      if (!pro.isPro) {
        pro.useTimerTrial();
      }
    }
  }, [
    timer.isCompleted,
    timer.startedAt,
    timer.mode,
    timer.targetSeconds,
    addSession,
    pro,
  ]);

  // North Star Metric: Track playback time
  // 소리가 활성화되어 있으면 추적 (타이머 유무와 관계없이)
  usePlaybackTracking(activeSounds.size > 0, activeSounds);

  // Pro: 플레이타임 추적 (1초마다)
  const playtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [upgradeReason, setUpgradeReason] = useState<"playtime" | "timer" | null>(null);

  useEffect(() => {
    // Pro 사용자가 아니고, 소리가 재생 중일 때만 추적
    if (!pro.isPro && activeSounds.size > 0) {
      playtimeIntervalRef.current = setInterval(() => {
        pro.trackPlaytime(1);

        // 제한 도달 시 모달 표시
        if (!pro.canPlay()) {
          setUpgradeReason("playtime");
          setShowUpgradeModal(true);
        }
      }, 1000);
    }

    return () => {
      if (playtimeIntervalRef.current) {
        clearInterval(playtimeIntervalRef.current);
        playtimeIntervalRef.current = null;
      }
    };
  }, [pro.isPro, activeSounds.size, pro]);

  // 미완료 세션 기록 (리셋, 모드 전환 시 호출)
  const recordIncompleteSession = useCallback(() => {
    if (timer.startedAt && (timer.isRunning || timer.currentSeconds > 0)) {
      const actualSeconds =
        timer.mode === "countdown"
          ? timer.targetSeconds - timer.currentSeconds
          : timer.currentSeconds;

      if (actualSeconds > 10) {
        addSession(
          createSessionData(
            timer.mode,
            timer.targetSeconds,
            actualSeconds,
            timer.startedAt,
            false,
            Array.from(activeSoundsRef.current),
            timer.mode === "countdown" ? currentPresetIdRef.current : undefined
          )
        );

        trackEvent("timer_abandoned", {
          mode: timer.mode,
          target_seconds: timer.targetSeconds,
          actual_seconds: actualSeconds,
          progress_percent:
            timer.mode === "countdown"
              ? Math.round(
                  ((timer.targetSeconds - timer.currentSeconds) /
                    timer.targetSeconds) *
                    100
                )
              : null,
        });
      }
    }
  }, [timer, addSession]);

  // 타이머 리셋 (미완료 세션 기록)
  const handleTimerReset = useCallback(() => {
    recordIncompleteSession();
    timer.reset();
  }, [timer, recordIncompleteSession]);

  // 모드 전환 (미완료 세션 기록 후 전환)
  const handleToggleMode = useCallback(() => {
    recordIncompleteSession();
    timer.toggleMode();
  }, [timer, recordIncompleteSession]);

  // 프리셋 설정 핸들러
  const handleSetPreset = useCallback(
    (preset: TimerPreset) => {
      setCurrentPresetId(preset.id);
      timer.setPreset(preset);

      trackEvent("timer_preset_selected", {
        preset_id: preset.id,
        preset_seconds: preset.seconds,
      });
    },
    [timer]
  );

  // 커스텀 시간 설정 핸들러
  const handleSetCustom = useCallback(
    (seconds: number) => {
      setCurrentPresetId(undefined);
      timer.setTarget(seconds);

      trackEvent("timer_custom_set", {
        seconds,
      });
    },
    [timer]
  );

  // 타이머 시작/정지 핸들러 (트라이얼 체크 포함)
  const handleTimerTogglePlayPause = useCallback(() => {
    if (timer.isRunning && !timer.isPaused) {
      timer.pause();
    } else if (timer.isPaused) {
      timer.resume();
    } else {
      // 타이머 시작 전 트라이얼 체크 (Free 사용자만)
      if (!pro.isPro && !pro.canUseTimer()) {
        setUpgradeReason("timer");
        setShowUpgradeModal(true);
        return;
      }
      timer.start();
    }
  }, [timer, pro]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  return (
    <div
      className={cn(
        "flex justify-center items-center w-full h-full transition-opacity duration-100 relative",
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
          <CompactView
            activeSounds={activeSounds}
            isPlaying={timer.isRunning && !timer.isPaused}
            formattedTime={timer.formattedTime}
            onTogglePlayPause={handleTimerTogglePlayPause}
            onExpand={handleToggleCompact}
            // 타이머 props
            timerMode={timer.mode}
            timerProgress={timer.progress}
            timerTargetSeconds={timer.targetSeconds}
            isTimerRunning={timer.isRunning}
            isTimerWarning={timer.isWarning}
            isTimerCompleted={timer.isCompleted}
            onTimerToggleMode={handleToggleMode}
            onTimerSetPreset={handleSetPreset}
            onTimerSetCustom={handleSetCustom}
          />
        ) : (
          <ExpandedView
            activeSounds={activeSounds}
            volumes={volumes}
            isMuted={isMuted}
            isPlaying={timer.isRunning && !timer.isPaused}
            currentSlide={currentSlide}
            onToggleSound={toggleSound}
            onVolumeChange={handleVolumeChange}
            onToggleMute={toggleMute}
            onTogglePlayPause={handleTimerTogglePlayPause}
            onPrevSlide={prevSlide}
            onNextSlide={nextSlide}
            onMinimize={handleToggleCompact}
            // 타이머 props
            timerMode={timer.mode}
            timerFormattedTime={timer.formattedTime}
            timerProgress={timer.progress}
            timerTargetSeconds={timer.targetSeconds}
            isTimerRunning={timer.isRunning}
            isTimerPaused={timer.isPaused}
            isTimerWarning={timer.isWarning}
            isTimerCompleted={timer.isCompleted}
            onTimerToggleMode={handleToggleMode}
            onTimerSetPreset={handleSetPreset}
            onTimerSetCustom={handleSetCustom}
            onTimerReset={handleTimerReset}
            // 세션 기록 props
            timerSessions={sessions}
            timerStats={stats}
            onClearSessions={clearSessions}
          />
        )}
      </div>

      {/* 세션 히스토리 모달 (트레이 메뉴에서 열기) */}
      {showSessionHistory && (
        <SessionHistoryModal
          sessions={sessions}
          stats={stats}
          onClose={() => setShowSessionHistory(false)}
          onClear={clearSessions}
        />
      )}

      {/* Pro 업그레이드 모달 */}
      {showUpgradeModal && upgradeReason && (
        <ProUpgradeModal
          reason={upgradeReason}
          onPurchase={() => {
            setShowUpgradeModal(false);
            trackEvent("pro_upgrade_clicked", { reason: upgradeReason });
          }}
          onDismiss={() => {
            setShowUpgradeModal(false);
            trackEvent("pro_upgrade_dismissed", { reason: upgradeReason });
          }}
          onActivateLicense={() => {
            setShowUpgradeModal(false);
            setShowLicenseModal(true);
          }}
        />
      )}

      {/* 라이센스 입력 모달 */}
      {showLicenseModal && (
        <LicenseInputModal
          onActivate={pro.activateLicenseKey}
          onClose={() => setShowLicenseModal(false)}
        />
      )}
    </div>
  );
}

export { FloatingBarContent as FloatingBar };
