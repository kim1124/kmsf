# 스타일 및 인증 규칙

## 목적

기존 Codex 문서의 약점이었던 추상적 설명을 줄이고, Gemini 결과에서 효과적이었던 "즉시 실행 가능한 규칙"을 명확한 운영 규칙으로 정리한다.

## 작성 원칙

- 추상 표현보다 명령형 표현 사용
- `해야 함 / 금지 / 예외 / 확인 파일` 구조 유지
- 스타일과 인증 규칙을 구현 가능한 수준으로 구체화

## UI 규칙

### 해야 함

- 스타일 변경 전, 영향을 받는 실제 컴포넌트 경로를 먼저 확인한다.
- 폼 수정 시 spacing, field error, disabled state, pending state를 함께 본다.
- Dialog, Drawer, full-height overlay는 overflow와 세로 잘림을 브라우저에서 확인한다.

### 금지

- "더 예쁘게", "더 자연스럽게" 같은 추상 표현만으로 변경하지 않는다.
- 기존 light/mint visual direction을 요청 없이 바꾸지 않는다.
- UI 파일만 보고 submit/action/schema 경로를 생략하지 않는다.

### 예외

- 사용자가 디자인 방향을 명시적으로 변경하라고 요청한 경우
- 기존 UI가 이미 명백히 깨져 있어 구조 수정이 필요한 경우

### 확인 파일

- `apps/kmsf/src/app/**`
- `apps/kmsf/src/components/**`
- `apps/kmsf/src/lib/**`

## 폼 규칙

### 해야 함

- 버튼의 `type`을 명시적으로 확인한다.
- inline error 위치를 필드와 함께 확인한다.
- 실시간 검증이 필요한 경우 입력 중 피드백이 업데이트되는지 확인한다.
- submit 이후 서버 액션 반환 shape와 UI read shape를 함께 검토한다.

### 금지

- Zod schema만 보고 submit bug를 판단하지 않는다.
- field error key와 UI 바인딩 key를 다르게 두고 완료 처리하지 않는다.

## 인증 규칙

### 해야 함

- `ID/PW UI`와 `Supabase Auth backend`의 관계를 분리해서 이해한다.
- username 기반 로그인 수정 시 `manager.username -> email -> signInWithPassword` 흐름을 함께 본다.
- Google OAuth, password sign-in, initial admin setup이 서로 회귀하지 않는지 확인한다.

### 금지

- `ID/PW 로그인`과 `Supabase 로그인`을 별도 인증 백엔드 두 개로 가정하지 않는다.
- 인증 변경 후 브라우저 검증 없이 완료 처리하지 않는다.

### 확인 파일

- `apps/kmsf/src/components/auth/**`
- `apps/kmsf/src/app/sign-in/**`
- `apps/kmsf/src/app/sign-up/**`
- `apps/kmsf/src/app/setup/initial-admin/**`
- `apps/kmsf/src/app/[locale]/(public)/sign-in/actions.ts`
- `apps/kmsf/src/lib/auth/**`
- `apps/kmsf/src/lib/security/**`
- `apps/kmsf/src/lib/supabase/**`
