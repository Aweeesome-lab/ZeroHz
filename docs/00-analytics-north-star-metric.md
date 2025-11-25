# Analytics: North Star Metric - Playback Time Tracking

> **작성일**: 2025-11
> **목적**: 북극성 지표 정의 및 트래킹 구현 아카이빙

## 1. 왜 재생 시간이 북극성 지표인가?

### 1.1 북극성 지표(North Star Metric)란?

- 제품의 핵심 가치를 가장 잘 나타내는 **단일 지표**
- 모든 팀이 공통으로 집중해야 할 방향성 제시
- 성장의 선행 지표(Leading Indicator) 역할

### 1.2 ZeroHz의 북극성 지표: 총 재생 시간

```
사용자가 앱을 통해 백색소음을 재생한 총 시간
```

**이유:**

1. **핵심 가치 반영**: 사용자가 실제로 집중/휴식에 앱을 활용하는 정도
2. **참여도 측정**: 다운로드나 DAU보다 실질적인 제품 사용량
3. **예측력**: 재생 시간 ↑ → 리텐션 ↑ → 추천 ↑ → 성장
4. **개선 가능**: UI/UX, 사운드 품질, 기능 개선의 효과를 직접 측정 가능

### 1.3 관련 보조 지표

| 지표                  | 설명                           | 용도               |
| --------------------- | ------------------------------ | ------------------ |
| 세션당 평균 재생 시간 | 한 번 사용 시 평균 재생 시간   | 사용 깊이 측정     |
| 일간 활성 사용자(DAU) | 하루에 1회 이상 재생한 유저 수 | 도달 범위          |
| 사운드 조합 패턴      | 자주 사용되는 사운드 조합      | 제품 개선 인사이트 |

---

## 2. PostHog 설정

### 2.1 PostHog 선택 이유

- **무료 티어 충분**: 월 100만 이벤트 무료
- **프라이버시 친화적**: EU GDPR 준수, 셀프호스팅 가능
- **기능 풍부**: 이벤트 분석, 퍼널, 코호트, 세션 리플레이
- **React 통합**: `posthog-js/react` 공식 지원

### 2.2 설정 구조

#### 데스크톱 앱 (`src/components/providers.tsx`)

```typescript
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  person_profiles: "identified_only",
  persistence: "localStorage", // Tauri 앱에서 필수
});
```

#### 웹 랜딩페이지 (`web/src/app/providers.tsx`)

```typescript
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  person_profiles: "identified_only",
  persistence: "localStorage+cookie", // 크로스세션 추적
  capture_pageview: true,
  capture_pageleave: true, // 페이지 이탈 시 자동 이벤트
});
```

### 2.3 핵심 설정 옵션 설명

| 옵션                | 값                  | 설명                                              |
| ------------------- | ------------------- | ------------------------------------------------- |
| `persistence`       | `"localStorage"`    | 브라우저 종료 후에도 distinct_id 유지             |
| `person_profiles`   | `"identified_only"` | 익명 유저의 Person 프로필 미생성 (비용 절감)      |
| `capture_pageleave` | `true`              | 페이지 이탈 시 자동으로 duration 포함 이벤트 전송 |

---

## 3. 이벤트 스키마

### 3.1 데스크톱 앱 이벤트

#### `playback_session_start`

재생 시작 시 발생

```typescript
{
  event: "playback_session_start",
  properties: {
    active_sounds: ["rain", "forest"],  // 활성 사운드 배열
    sound_count: 2,                      // 활성 사운드 개수
    timestamp: "2024-11-25T10:30:00Z"   // ISO 타임스탬프
  }
}
```

#### `playback_session_end` ⭐ 핵심 이벤트

재생 종료 시 발생 (일시정지, 사운드 모두 끔, 앱 종료)

```typescript
{
  event: "playback_session_end",
  properties: {
    session_duration_seconds: 1800,     // 이번 세션 재생 시간 (초)
    total_playback_seconds: 7200,       // 앱 실행 이후 누적 재생 시간
    active_sounds: ["rain", "forest"],
    sound_count: 2,
    reason: "page_close" | undefined,   // 종료 사유 (앱 종료 시에만)
    timestamp: "2024-11-25T11:00:00Z"
  }
}
```

#### `playback_heartbeat`

재생 중 1분마다 발생 (장시간 세션 추적)

```typescript
{
  event: "playback_heartbeat",
  properties: {
    session_duration_seconds: 60,       // 현재 세션 경과 시간
    total_playback_seconds: 5460,
    active_sounds: ["rain"],
    sound_count: 1,
    timestamp: "2024-11-25T10:31:00Z"
  }
}
```

#### `sound_toggled`

개별 사운드 on/off 시 발생 (사운드별로 개별 이벤트 전송)

```typescript
{
  event: "sound_toggled",
  properties: {
    sound_id: "rain",                   // 토글된 사운드 ID
    action: "on" | "off",               // 켜기/끄기 구분
    all_active_sounds: ["rain", "forest"],
    sound_count: 2
  }
}
```

**PostHog 분석 예시:**
- Breakdown by `sound_id` → 인기 사운드 순위
- Filter by `action: "on"` → 사운드별 활성화 횟수

### 3.2 웹 랜딩페이지 이벤트

#### `download_clicked`

다운로드 버튼 클릭

```typescript
{
  event: "download_clicked",
  properties: {
    platform: "mac" | "win"            // 플랫폼 구분
  }
}
```

---

## 4. 유저별 추적 (익명 유저)

### 4.1 PostHog의 익명 유저 추적 방식

> **중요**: 아래 내용은 PostHog SDK가 **자동으로 처리**합니다. 별도 구현 불필요.

PostHog은 `distinct_id`를 사용하여 익명 유저를 추적합니다:

```
로그인 없이도 유저 구분 가능!
```

1. **첫 방문 시**: 랜덤 UUID 생성 (예: `018c4a2b-...`)
2. **저장 위치**:
   - 데스크톱: `localStorage` (Tauri WebView)
   - 웹: `localStorage` + `cookie`
3. **재방문 시**: 저장된 `distinct_id` 재사용 → 동일 유저로 인식

### 4.2 유저 식별 흐름

```
┌──────────────────────────────────────────────────────────┐
│  첫 방문                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ 앱/웹 접속  │ -> │ UUID 생성   │ -> │ 저장소 저장 │  │
│  └─────────────┘    │ (distinct_id)│    │ localStorage│  │
│                     └─────────────┘    └─────────────┘  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  재방문                                                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ 앱/웹 접속  │ -> │ 저장소 확인 │ -> │ 기존 ID 사용│  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### 4.3 제한사항

| 상황                 | 영향                 | 대응             |
| -------------------- | -------------------- | ---------------- |
| 브라우저 데이터 삭제 | 새로운 유저로 인식됨 | 불가피           |
| 다른 기기 사용       | 별개 유저로 인식됨   | 로그인 기능 필요 |
| 시크릿 모드          | 세션 종료 시 ID 삭제 | 웹에서만 해당    |

---

## 5. 구현 세부사항

### 5.1 중앙화된 Analytics 모듈

**위치**: `src/lib/analytics.ts`

모든 이벤트를 한 곳에서 관리합니다. 이벤트 추가/수정 시 이 파일만 수정하면 됩니다.

```typescript
import { analytics } from "@/lib/analytics";

// 사용 예시
analytics.playbackSessionStart({ activeSounds: ["rain"], soundCount: 1 });
analytics.playbackSessionEnd({ sessionDurationSeconds: 300, ... });
analytics.soundToggled({ soundId: "rain", action: "on", ... });
```

### 5.2 트래킹 훅: `usePlaybackTracking`

**위치**: `src/hooks/usePlaybackTracking.ts`

```typescript
export function usePlaybackTracking(
  isPlaying: boolean,
  activeSounds: Set<SoundType>
) {
  // analytics 모듈을 사용하여:
  // - 세션 시작/종료 감지
  // - 1분마다 heartbeat 전송
  // - 사운드 변경 추적
  // - 페이지 종료 시 세션 종료 이벤트 전송
}
```

### 5.3 주요 구현 포인트

#### 페이지 종료 시 이벤트 전송 신뢰성

```typescript
// ❌ 일반 capture - 페이지 종료 시 전송 실패 가능
posthog?.capture("playback_session_end", { ... });

// ✅ sendBeacon 사용 - 페이지 종료 시에도 신뢰성 있는 전송
posthog?.capture(
  "playback_session_end",
  { ... },
  { transport: "sendBeacon" }
);
```

**`sendBeacon` API란?**

- 브라우저가 페이지 종료 시에도 비동기 요청을 완료하도록 보장
- `beforeunload` 이벤트에서 사용 시 데이터 손실 방지

#### 세션 관리

```typescript
// 세션 상태 추적 (ref 사용으로 렌더링 최적화)
const sessionStartTimeRef = useRef<number | null>(null);
const isActiveRef = useRef<boolean>(false);

// 실제 재생 중인지 판단
const isActivelyPlaying = isPlaying && activeSounds.size > 0;
```

---

## 6. PostHog 대시보드 설정 가이드

### 6.1 핵심 Insight 생성

#### 1) 일간 총 재생 시간 (북극성 지표)

```
Event: playback_session_end
Aggregation: Sum of session_duration_seconds
Breakdown: Day
```

#### 2) 세션당 평균 재생 시간

```
Event: playback_session_end
Aggregation: Average of session_duration_seconds
Breakdown: Day
```

#### 3) 인기 사운드 조합

```
Event: playback_session_start
Aggregation: Count
Breakdown: active_sounds
```

### 6.2 Funnel 분석

**다운로드 전환 퍼널**

```
Step 1: demo_playback_start (데모 체험)
Step 2: download_clicked (다운로드 클릭)
```

### 6.3 권장 Dashboard 구성

1. **Overview**: 일간 총 재생 시간, DAU, 세션 수
2. **Engagement**: 평균 세션 길이, 세션당 사운드 개수
3. **Acquisition**: 다운로드 클릭 by platform, 전환율
4. **Product**: 인기 사운드, 사운드 조합 패턴

---

## 7. 구현 검증 체크리스트

### 7.1 이벤트 전송 확인

- [x] `playback_session_start` - 재생 시작 시 발생
- [x] `playback_session_end` - 재생 종료 시 발생
- [x] `playback_heartbeat` - 1분마다 발생
- [x] `sound_toggled` - 사운드 on/off 시 개별 이벤트 (sound_id로 구분)
- [x] `download_clicked` - 다운로드 클릭 시 발생 (mac/win 구분)

### 7.2 신뢰성 확인

- [x] 페이지 종료 시 `sendBeacon` 사용
- [x] `persistence: localStorage` 설정 (세션 간 유저 추적)
- [x] 중복 세션 시작 방지 (`isActiveRef` 체크)

### 7.3 데이터 정확성

- [x] `session_duration_seconds` 초 단위 정확성
- [x] 일시정지 시 세션 종료 이벤트 발생
- [x] 사운드 전체 끄면 세션 종료

---

## 8. 알려진 제한사항 및 향후 개선

### 8.1 현재 제한사항

1. **앱 충돌 시 데이터 손실**: 비정상 종료 시 마지막 세션 데이터 누락 가능
2. **오프라인 사용**: 네트워크 없으면 이벤트 전송 실패
3. **다중 기기 통합 불가**: 로그인 없이는 기기 간 유저 연결 불가

### 8.2 향후 개선 아이디어

1. **앱 실행 이벤트**: `app_launched` 이벤트 추가
2. **오프라인 큐잉**: 오프라인 시 이벤트 로컬 저장 후 재연결 시 전송
3. **Super Properties**: 앱 버전, OS 정보 등 자동 첨부

---

## 9. 참고 자료

- [PostHog Docs - JavaScript SDK](https://posthog.com/docs/libraries/js)
- [PostHog Docs - Identifying Users](https://posthog.com/docs/product-analytics/identify)
- [MDN - Navigator.sendBeacon()](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)
- [북극성 지표란?](https://amplitude.com/blog/north-star-metric)
