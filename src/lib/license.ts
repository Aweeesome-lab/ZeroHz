/**
 * LemonSqueezy 라이센스 검증 모듈
 */

import type { LicenseValidationResponse } from "@/types/pro";

const LEMONSQUEEZY_API_URL = "https://api.lemonsqueezy.com/v1/licenses";

// 어드민 테스트 키 (환경변수로 관리)
const ADMIN_LICENSE_KEY = process.env.NEXT_PUBLIC_ADMIN_LICENSE_KEY || "";

/**
 * 라이센스 키 검증
 * @param licenseKey - 검증할 라이센스 키
 * @returns 검증 결과
 */
export async function validateLicense(
  licenseKey: string
): Promise<LicenseValidationResponse> {
  try {
    const response = await fetch(`${LEMONSQUEEZY_API_URL}/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        license_key: licenseKey,
      }),
    });

    const data = await response.json();
    return data as LicenseValidationResponse;
  } catch (error) {
    console.error("License validation error:", error);
    return {
      valid: false,
      error: "Network error during license validation",
    };
  }
}

/**
 * 라이센스 키 활성화 (기기 등록)
 * @param licenseKey - 활성화할 라이센스 키
 * @param instanceName - 기기 이름 (옵션)
 * @returns 활성화 결과
 */
export async function activateLicense(
  licenseKey: string,
  instanceName?: string
): Promise<LicenseValidationResponse> {
  // 어드민 키 허용
  if (licenseKey === ADMIN_LICENSE_KEY) {
    return {
      valid: true,
      license_key: {
        id: 0,
        status: "active",
        key: ADMIN_LICENSE_KEY,
        activation_limit: 999,
        activation_usage: 1,
        created_at: new Date().toISOString(),
        expires_at: null,
      },
      error: null,
    };
  }

  try {
    const response = await fetch(`${LEMONSQUEEZY_API_URL}/activate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        license_key: licenseKey,
        instance_name: instanceName || `ZeroHz-${Date.now()}`,
      }),
    });

    const data = await response.json();
    return data as LicenseValidationResponse;
  } catch (error) {
    console.error("License activation error:", error);
    return {
      valid: false,
      error: "Network error during license activation",
    };
  }
}

/**
 * 라이센스 키 비활성화 (기기 해제)
 * @param licenseKey - 비활성화할 라이센스 키
 * @param instanceId - 해제할 기기 인스턴스 ID
 * @returns 비활성화 결과
 */
export async function deactivateLicense(
  licenseKey: string,
  instanceId: string
): Promise<{ deactivated: boolean; error: string | null }> {
  try {
    const response = await fetch(`${LEMONSQUEEZY_API_URL}/deactivate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        license_key: licenseKey,
        instance_id: instanceId,
      }),
    });

    const data = await response.json();
    return {
      deactivated: data.deactivated === true,
      error: data.error || null,
    };
  } catch (error) {
    console.error("License deactivation error:", error);
    return {
      deactivated: false,
      error: "Network error during license deactivation",
    };
  }
}

/**
 * 라이센스 키 형식 검증 (기본 체크)
 * @param licenseKey - 검증할 라이센스 키
 * @returns 형식이 유효한지 여부
 */
export function isValidLicenseKeyFormat(licenseKey: string): boolean {
  const trimmed = licenseKey.trim();

  // 어드민 키 허용
  if (trimmed === ADMIN_LICENSE_KEY) {
    return true;
  }

  // UUID 형식 체크 (예: E62A381A-EBD9-4280-97B7-6E47A2AE4532)
  const uuidRegex =
    /^[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}$/i;
  return uuidRegex.test(trimmed);
}
