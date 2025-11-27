# Pricing & Licensing: Pro 기능 및 결제 시스템

> **작성일**: 2025-11
> **목적**: ZeroHz Pro 가격 정책, 라이센스 시스템, 구현 계획 문서화

## 1. 가격 정책 개요

### 1.1 티어 구조

```
┌─────────────────────────────────────────────────────────────┐
│  Free Tier                                                  │
├─────────────────────────────────────────────────────────────┤
│  ✓ 일일 1시간 플레이타임                                      │
│  ✓ 모든 사운드 접근                                          │
│  ✓ 기본 UI                                                  │
│  ✓ 타이머 3회 트라이얼                                        │
│  ✗ 무제한 플레이타임                                          │
│  ✗ 무제한 타이머                                             │
│  ✗ 데이터 분석/히스토리 (향후)                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Pro Tier (일회성 라이센스)                                   │
├─────────────────────────────────────────────────────────────┤
│  ✓ 무제한 플레이타임                                          │
│  ✓ 무제한 타이머                                             │
│  ✓ 데이터 분석/히스토리 (향후)                                 │
│  ✓ 향후 추가될 모든 Pro 기능                                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 가격

| 구분 | 가격 | 비고 |
|------|------|------|
| 정가 | $12.99 | 일회성 결제 |
| 런칭 특가 | $9.99 | 할인코드: `LAUNCH` |

**가격 결정 근거**:
- 경쟁 앱 분석: Dark Noise ($50 평생), Endel ($90 평생), Coffitivity ($9)
- 니치 타겟 (주파수/binaural beats) → 가치 인식 높음
- 인디 앱 적정 가격대
- 세일 프로모션 여지 확보

---

## 2. Free Tier 제한 사항

### 2.1 일일 플레이타임 제한

```typescript
// 제한 값
const FREE_DAILY_PLAYTIME_LIMIT = 60 * 60; // 3600초 (1시간)

// 저장 구조
interface PlaytimeData {
  dailyPlaytimeSeconds: number;  // 오늘 사용한 시간 (초)
  lastPlayDate: string;          // YYYY-MM-DD 형식
}
```

**동작 방식**:
1. 재생 시작 시 남은 시간 확인
2. 재생 중 실시간으로 시간 차감
3. 제한 도달 시 자동 정지 + Pro 유도 모달
4. 자정(로컬 타임존) 기준 리셋

**카운트 조건**:
- 오디오가 실제로 재생 중일 때만 카운트
- 일시정지 시 카운트 중지
- 앱 백그라운드 시에도 재생 중이면 카운트

### 2.2 타이머 트라이얼

```typescript
// 제한 값
const FREE_TIMER_TRIAL_COUNT = 3;

// 저장 구조
interface TimerTrialData {
  timerTrialUsed: number;  // 사용한 트라이얼 횟수 (0-3)
}
```

**동작 방식**:
1. 타이머 버튼 클릭 시 트라이얼 잔여 확인
2. 트라이얼 남음 → 타이머 사용 가능
3. 타이머 세션 완료 시 카운트 차감 (시작 시 아님)
4. 트라이얼 소진 → Pro 유도 모달

**트라이얼 차감 시점**:
- 타이머가 정상적으로 완료되었을 때
- 타이머 도중 취소 시 차감 안 함

---

## 3. 결제 시스템: LemonSqueezy

### 3.1 선택 이유

- **라이센스 키 자동 생성**: 구매 시 자동 발급 + 이메일 전송
- **검증 API 제공**: 앱에서 직접 라이센스 검증 가능
- **DB 불필요**: LemonSqueezy가 라이센스 관리
- **수수료**: 5% + 결제 수수료

### 3.2 구매 플로우

```
┌──────────────────────────────────────────────────────────────┐
│  1. 랜딩페이지                                                │
│     └── [Pro 구매하기] 버튼 클릭                               │
│                                                              │
│  2. LemonSqueezy Checkout                                    │
│     └── 결제 정보 입력 → 결제 완료                             │
│                                                              │
│  3. 이메일 수신                                               │
│     └── 라이센스 키 + 영수증 자동 발송                          │
│                                                              │
│  4. 앱에서 활성화                                              │
│     └── 설정 → 라이센스 키 입력 → 검증 → Pro 활성화            │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 LemonSqueezy 상품 설정

```yaml
Product:
  Name: "ZeroHz Pro"
  Description: "Unlock unlimited playtime, timer, and analytics for ZeroHz."

Pricing:
  Type: Single payment
  Price: $12.99

License Keys:
  Generate: true
  Activation Limit: 3  # 최대 3기기 활성화

Discount:
  Code: "LAUNCH"
  Amount: $3 off
  Type: One-time use per customer
```

### 3.4 API 검증 플로우

```typescript
// 라이센스 검증 API
const validateLicense = async (licenseKey: string): Promise<boolean> => {
  const response = await fetch(
    "https://api.lemonsqueezy.com/v1/licenses/validate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        license_key: licenseKey,
      }),
    }
  );

  const data = await response.json();
  return data.valid === true;
};
```

**응답 예시** (유효한 라이센스):
```json
{
  "valid": true,
  "error": null,
  "license_key": {
    "id": 1,
    "status": "active",
    "key": "XXXXX-XXXXX-XXXXX-XXXXX",
    "activation_limit": 3,
    "activation_usage": 1,
    "created_at": "2024-01-01T00:00:00.000Z",
    "expires_at": null
  }
}
```

---

## 4. 앱 구현 상세

### 4.1 저장소 구조

```typescript
// UserDefaults (또는 localStorage) 키
const STORAGE_KEYS = {
  // Pro 상태
  LICENSE_KEY: "zerohz_license_key",        // Keychain에 저장 권장
  IS_PRO_USER: "zerohz_is_pro",

  // Free 제한
  DAILY_PLAYTIME: "zerohz_daily_playtime",
  LAST_PLAY_DATE: "zerohz_last_play_date",
  TIMER_TRIAL_USED: "zerohz_timer_trial_used",
};
```

### 4.2 Pro 상태 관리

```typescript
interface ProState {
  isPro: boolean;
  licenseKey: string | null;

  // Free 제한 상태
  dailyPlaytimeRemaining: number;  // 초
  timerTrialRemaining: number;     // 횟수
}

// 앱 시작 시 체크
const initializeProState = async (): Promise<ProState> => {
  const licenseKey = await getFromKeychain(STORAGE_KEYS.LICENSE_KEY);

  if (licenseKey) {
    // 저장된 라이센스가 있으면 검증
    const isValid = await validateLicense(licenseKey);
    if (isValid) {
      return { isPro: true, licenseKey, ... };
    }
  }

  // Free 사용자
  return {
    isPro: false,
    licenseKey: null,
    dailyPlaytimeRemaining: calculateRemainingPlaytime(),
    timerTrialRemaining: FREE_TIMER_TRIAL_COUNT - getTimerTrialUsed(),
  };
};
```

### 4.3 플레이타임 추적

```typescript
// 재생 시작 시
const onPlaybackStart = () => {
  if (!isPro) {
    startPlaytimeTracking();
  }
};

// 1초마다 체크
const trackPlaytime = () => {
  if (!isPro && isPlaying) {
    dailyPlaytimeSeconds += 1;
    saveDailyPlaytime(dailyPlaytimeSeconds);

    if (dailyPlaytimeSeconds >= FREE_DAILY_PLAYTIME_LIMIT) {
      stopPlayback();
      showProUpgradeModal("playtime");
    }
  }
};

// 자정 리셋 체크
const checkDailyReset = () => {
  const today = new Date().toISOString().split("T")[0];
  const lastDate = getLastPlayDate();

  if (today !== lastDate) {
    resetDailyPlaytime();
    setLastPlayDate(today);
  }
};
```

### 4.4 타이머 트라이얼 관리

```typescript
// 타이머 시작 전 체크
const canUseTimer = (): boolean => {
  if (isPro) return true;
  return getTimerTrialUsed() < FREE_TIMER_TRIAL_COUNT;
};

// 타이머 버튼 클릭
const onTimerButtonClick = () => {
  if (!canUseTimer()) {
    showProUpgradeModal("timer");
    return;
  }
  startTimer();
};

// 타이머 완료 시
const onTimerComplete = () => {
  if (!isPro) {
    incrementTimerTrialUsed();
  }
  // 타이머 완료 로직...
};
```

---

## 5. UI 컴포넌트

### 5.1 Pro 업그레이드 모달

```typescript
interface ProUpgradeModalProps {
  reason: "playtime" | "timer";
  onPurchase: () => void;
  onDismiss: () => void;
}
```

**플레이타임 제한 시**:
```
┌─────────────────────────────────────────┐
│                                         │
│   오늘 무료 이용 시간이 끝났어요          │
│                                         │
│   Pro로 업그레이드하면                   │
│   무제한으로 이용할 수 있어요             │
│                                         │
│   ┌─────────────┐  ┌─────────────┐     │
│   │   나중에    │  │  Pro 구매   │     │
│   └─────────────┘  └─────────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

**타이머 트라이얼 소진 시**:
```
┌─────────────────────────────────────────┐
│                                         │
│   타이머 기능이 마음에 드셨나요?          │
│                                         │
│   Pro로 업그레이드하면                   │
│   무제한으로 타이머를 사용할 수 있어요     │
│                                         │
│   ┌─────────────┐  ┌─────────────┐     │
│   │   나중에    │  │  Pro 구매   │     │
│   └─────────────┘  └─────────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

### 5.2 라이센스 입력 UI

```
설정 화면
├── [Pro 상태: Free / Pro]
├── 라이센스 키 입력
│   └── [                              ]
│   └── [활성화] 버튼
└── [Pro 구매하기] → 랜딩페이지 이동
```

### 5.3 남은 시간/횟수 표시

```
Free 사용자 UI 예시:
├── 상단바: "오늘 남은 시간: 45분"
├── 타이머 버튼: "타이머 (2회 남음)"
```

---

## 6. 랜딩페이지 Pricing 섹션

### 6.1 구성

```
┌─────────────────────────────────────────────────────────────┐
│                      Pricing                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐      ┌─────────────────┐              │
│  │      Free       │      │       Pro       │              │
│  │                 │      │                 │              │
│  │  $0             │      │  $12.99         │              │
│  │                 │      │  $9.99 런칭특가  │              │
│  │  ✓ 1시간/일     │      │                 │              │
│  │  ✓ 모든 사운드   │      │  ✓ 무제한 시간   │              │
│  │  ✓ 타이머 3회   │      │  ✓ 무제한 타이머 │              │
│  │                 │      │  ✓ 데이터 분석   │              │
│  │                 │      │  ✓ 평생 업데이트 │              │
│  │                 │      │                 │              │
│  │  [다운로드]     │      │  [지금 구매]    │              │
│  └─────────────────┘      └─────────────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 구현 체크리스트

### 7.1 LemonSqueezy 설정
- [ ] ZeroHz Pro 상품 생성 ($12.99)
- [ ] License keys 활성화 (Activation limit: 3)
- [ ] LAUNCH 할인 코드 생성 ($3 off)
- [ ] Test mode에서 구매 플로우 테스트
- [ ] 이메일 템플릿 확인

### 7.2 랜딩페이지
- [ ] Pricing 섹션 UI 구현
- [ ] LemonSqueezy Checkout 연동
- [ ] 할인 코드 자동 적용 또는 입력 필드

### 7.3 앱 구현
- [ ] Pro 상태 관리 (Context/Store)
- [ ] 라이센스 검증 로직 (LemonSqueezy API)
- [ ] 라이센스 키 입력 UI (설정 화면)
- [ ] 일일 플레이타임 제한 로직
- [ ] 타이머 트라이얼 로직
- [ ] Pro 업그레이드 모달 UI
- [ ] 남은 시간/횟수 표시 UI

### 7.4 테스트
- [ ] Test API로 구매 → 라이센스 발급 확인
- [ ] 라이센스 검증 성공/실패 케이스
- [ ] 플레이타임 제한 동작 확인
- [ ] 자정 리셋 동작 확인
- [ ] 타이머 트라이얼 차감 확인
- [ ] 앱 재설치 후 라이센스 복구 확인

---

## 8. 향후 확장 계획

### 8.1 Pro 전용 기능 (예정)
- 데이터 분석 대시보드
- 재생 히스토리
- 커스텀 프리셋 저장 (개수 확장)
- 위젯/메뉴바 모드
- 테마 커스터마이징

### 8.2 가격 정책 변경 가능성
- 런칭 특가 종료 후 정가 $12.99
- 블랙프라이데이 등 시즌 세일
- 번들 (다른 앱과 함께)

---

## 9. 참고 자료

- [LemonSqueezy Docs - License Keys](https://docs.lemonsqueezy.com/help/licensing/license-keys)
- [LemonSqueezy API - Validate License](https://docs.lemonsqueezy.com/api/license-keys)
- [Dark Noise Pricing](https://darknoise.app/)
- [Endel Pricing](https://endel.io/)
