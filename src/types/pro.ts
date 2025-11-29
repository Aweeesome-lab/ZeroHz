/**
 * Pro 기능 관련 타입 정의
 */

// Pro 상태
export interface ProState {
  isPro: boolean;
  licenseKey: string | null;
  isValidating: boolean;
}

// Free 티어 제한 상태
export interface FreeLimits {
  dailyPlaytimeUsed: number; // 오늘 사용한 시간 (초)
  dailyPlaytimeRemaining: number; // 남은 시간 (초)
  lastPlayDate: string; // YYYY-MM-DD
  timerTrialUsed: number; // 사용한 타이머 트라이얼 횟수
  timerTrialRemaining: number; // 남은 타이머 트라이얼 횟수
}

// 라이센스 검증 응답 (LemonSqueezy API)
export interface LicenseValidationResponse {
  valid: boolean;
  error: string | null;
  license_key?: {
    id: number;
    status: "active" | "inactive" | "expired" | "disabled";
    key: string;
    activation_limit: number;
    activation_usage: number;
    created_at: string;
    expires_at: string | null;
  };
  instance?: {
    id: string;
    name: string;
    created_at: string;
  };
  meta?: {
    store_id: number;
    product_id: number;
    product_name: string;
    variant_id: number;
    variant_name: string;
    customer_id: number;
    customer_name: string;
    customer_email: string;
  };
}

// Pro 업그레이드 모달 이유
export type UpgradeReason = "playtime" | "timer";

// 저장되는 Pro 설정 데이터
export interface ProSettingsData {
  licenseKey: string | null;
  dailyPlaytimeUsed: number;
  lastPlayDate: string;
  timerTrialUsed: number;
}

// 상수 (개발 모드에서는 짧은 값 사용)
const IS_DEV = process.env.NODE_ENV === "development";
export const FREE_DAILY_PLAYTIME_LIMIT = IS_DEV ? 1 * 60 * 60 : 3 * 60 * 60; // 개발: 1시간, 프로덕션: 3시간
export const FREE_TIMER_TRIAL_COUNT = IS_DEV ? 5 : 5; // 개발: 5회, 프로덕션: 5회
