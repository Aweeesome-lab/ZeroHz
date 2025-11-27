import type { SoundType, SoundVolumes } from "./audio";

/**
 * 앱 설정 타입
 */
export interface AppSettings {
  // 오디오 설정
  activeSounds: SoundType[];
  volumes: SoundVolumes;
  isMuted: boolean;

  // 언어 설정
  language: string;
}

/**
 * 기본 앱 설정
 */
export const DEFAULT_APP_SETTINGS: AppSettings = {
  activeSounds: [],
  volumes: {
    rain: 0.5,
    wind: 0.5,
    waves: 0.5,
    forest: 0.5,
    stream: 0.5,
    fire: 0.5,
    flight: 0.5,
    train: 0.5,
    night: 0.5,
    keyboard: 0.5,
    thunder: 0.5,
    "glass-fruit": 0.5,
  },
  isMuted: false,
  language: "en",
};
