"use client";

/**
 * Notification Sound Generator
 * Web Audio API를 사용하여 알림 사운드를 생성합니다.
 * 외부 파일 의존성 없이 프로그래밍 방식으로 사운드를 생성합니다.
 */

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

/**
 * 타이머 완료 사운드 재생
 * 밝고 긍정적인 완료 알림음 (2음 상승 멜로디)
 */
export function playTimerCompleteSound(volume: number = 0.7): void {
  try {
    const ctx = getAudioContext();

    // 첫 번째 음 (C5 - 523Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 523.25;
    gain1.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);

    // 두 번째 음 (G5 - 784Hz) - 0.15초 후
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 783.99;
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(volume * 0.5, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.5);

    // 세 번째 음 (C6 - 1047Hz) - 0.3초 후
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.value = 1046.5;
    gain3.gain.setValueAtTime(0, ctx.currentTime);
    gain3.gain.setValueAtTime(volume * 0.6, ctx.currentTime + 0.3);
    gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(ctx.currentTime + 0.3);
    osc3.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.error("[NotificationSound] Failed to play complete sound:", e);
  }
}

/**
 * 타이머 경고 사운드 재생
 * 부드러운 경고 알림음 (단일 비프)
 */
export function playTimerWarningSound(volume: number = 0.5): void {
  try {
    const ctx = getAudioContext();

    // 경고음 (A4 - 440Hz)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 440;
    gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);

    // 두 번째 비프 (0.2초 후)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 440;
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(volume * 0.4, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("[NotificationSound] Failed to play warning sound:", e);
  }
}
