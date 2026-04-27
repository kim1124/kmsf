# Codex MD Renewal Review

작성일:
- 2026-04-22

## 작업 요약

- `kmsf` 프로젝트의 Codex용 MD 문서 구조를 검토했다.
- 현재 `docs/codex/` 문서와 `docs/antigravity/` 문서를 비교했다.
- 실제 프로젝트의 검증 수단(`lint`, `vitest`, `build`)과 인증 구현 상태를 함께 확인했다.
- 문서 리뉴얼의 핵심 원인이 `문서 길이`보다는 `문서 계층`, `자동 로드 여부`, `실행 강제력 부족`에 있음을 정리했다.

## 검토 대상

- `AGENTS.md`
- `docs/codex/README.md`
- `docs/codex/01-product-goals.md`
- `docs/codex/02-tech-stack-decisions.md`
- `docs/codex/03-architecture-layout.md`
- `docs/codex/04-auth-security-supabase.md`
- `docs/codex/05-roadmap-open-questions.md`
- `docs/antigravity/*.gemini.md`
- `package.json`
- `vitest.config.ts`
- `src/app/[locale]/(public)/sign-in/actions.ts`
- `tests/e2e/supabase-auth.spec.ts`

## 확인 결과

### 1. 현재 Codex 문서는 참고 문서로는 유효하지만, 실행 계약 문서는 아니다.

- `docs/codex/`는 템플릿 목표, 아키텍처, 인증 방향, 로드맵을 정리한 설계 문서다.
- 하지만 "스타일 수정 요청을 받았을 때 어떤 파일을 먼저 보고 무엇을 반드시 지켜야 하는지", "수정 후 어떤 검증을 반드시 실행해야 하는지", "완료 보고는 어떤 형식으로 해야 하는지" 같은 실행 규칙은 강하게 드러나지 않는다.
- 즉 현재 문서는 `무엇을 만들지`에는 강하지만, `어떻게 작업할지`에 대한 강제력이 약하다.

### 2. 자동 로드되는 지침 계층이 약하다.

- 현재 루트 `AGENTS.md`에는 Next.js 주의 문구만 있다.
- `docs/codex/` 문서를 Codex가 항상 읽는 구조는 아니다.
- 따라서 실제 작업 시 Codex가 `docs/codex/`를 참조하지 않고 진행할 여지가 충분하다.
- 이번 문제의 핵심은 문서 분량보다도 `항상 읽히는 문서`와 `참고용 문서`가 분리되어 있지 않은 점에 가깝다.

### 3. Gemini 문서는 더 짧아서 잘 동작한 것이 아니라, 더 직접적인 규칙을 담고 있다.

- `docs/antigravity/README.gemini.md`에는 폼 간격, 실시간 검증, 다이얼로그 스크롤, 로딩 처리처럼 즉시 실행 가능한 UI 규칙이 있다.
- 반면 `docs/codex/`는 상대적으로 아키텍처 설명 중심이다.
- 즉 차이는 단순한 분량보다 `행동으로 바로 변환 가능한 규칙의 밀도`에 있다.

### 4. 테스트 자산은 이미 존재하지만, 실행 경로가 강제되어 있지 않다.

- `package.json`에는 `lint`, `test`, `test:run`, `build` 스크립트가 있다.
- `src/lib/auth/*.test.ts` 기준의 Vitest 단위 테스트가 존재한다.
- `tests/e2e/supabase-auth.spec.ts` 기준의 Playwright E2E 시나리오도 존재한다.
- 그러나 `vitest.config.ts`에는 E2E 경로 제외 설정이 없다.
- 실제 실행 결과 `npm run test:run`은 Playwright 테스트 파일까지 Vitest로 읽어 실패했다.
- 즉 "테스트를 하라"는 지침만 추가해서는 부족하고, `어떤 테스트를 어떤 명령으로 돌릴지`까지 문서와 설정에서 분리해야 한다.

### 5. 인증 요구사항 표현이 해석 여지를 남긴다.

- 현재 구현은 `ID/PW UI`를 제공하되, 내부 인증은 `Supabase Auth`의 이메일/비밀번호로 매핑하는 구조다.
- 실제 코드에서도 `manager.username -> email` 조회 후 `signInWithPassword`를 수행한다.
- 따라서 "ID/PW 기반 인증"과 "Supabase 기반 인증"을 완전히 별개의 두 인증 체계로 이해하면 현재 문서와 구현은 어긋나게 읽힌다.
- 이후 문서에는 아래 둘 중 어느 의미인지 명시해야 한다.
- `옵션 A`: 자체 로컬 인증 저장소 + Supabase 인증을 둘 다 지원
- `옵션 B`: 화면 입력은 ID/PW지만, 실제 인증 백엔드는 Supabase 하나만 사용

### 6. 문서 라인 길이는 주원인으로 보기 어렵다.

- 현재 측정 기준으로 `docs/codex/*`보다 `docs/antigravity/*`가 더 긴 라인을 가진 파일도 많았다.
- 따라서 "라인이 길어서 Codex가 못 읽었다"는 가설은 우선순위가 낮다.
- 문제는 길이 자체보다 `우선순위 높은 규칙이 어디에 있는지`, `규칙과 참고 문서가 섞여 있는지`, `체크리스트가 실행 가능한지`에 있다.

## 검증 결과

### 실행한 검증

- `npm run lint`
- `npm run test:run`
- `npm run build`

### 결과

- `npm run lint`
  - 실패는 아니고 warning 4건 확인
  - unused variable 경고 중심
- `npm run test:run`
  - 실패
  - 원인: `tests/e2e/supabase-auth.spec.ts`를 Vitest가 읽으면서 Playwright `test()` 호출 오류 발생
- `npm run build`
  - 성공
  - Next.js 16.2.4 production build 완료

### 해석

- 현재 저장소는 "검증 수단이 전혀 없는 상태"는 아니다.
- 다만 unit test와 e2e test의 실행 경계가 아직 정리되지 않았다.
- 따라서 Codex MD 리뉴얼에는 `검증 명령의 표준화`와 `검증 실패 시 완료 금지`를 반드시 포함해야 한다.

## 문제 원인 정리

우선순위 기준으로 보면 아래 순서가 더 설득력 있다.

1. `docs/codex/`가 자동 로드되는 핵심 지침이 아니라 참고 문서로 남아 있다.
2. 실행 규칙보다 설계 설명 비중이 높아, 작업 시 행동으로 연결되는 지시가 약하다.
3. 테스트 게이트가 "있다" 수준이지 "언제 무엇을 반드시 돌린다" 수준으로 강제되지 않는다.
4. 인증 요구사항이 옵션 정의 없이 서술되어, 구현자가 서로 다른 의미로 해석할 수 있다.
5. 스타일 규칙이 아키텍처 문서에 흩어져 있거나 Codex 문서에는 약하고 Gemini 문서에만 상대적으로 강하다.
6. 문서 길이와 라인 길이는 보조 요인일 수는 있어도 핵심 원인으로 보이지 않는다.

## 권장 리뉴얼 원칙

### 1. 항상 읽히는 문서와 참고 문서를 분리한다.

- 루트 `AGENTS.md`: 작업 시 반드시 지켜야 하는 핵심 계약만 둔다.
- `docs/codex/runtime/*`: Codex가 작업 시작 시 선택적으로 읽을 세부 규칙을 둔다.
- `docs/codex/reference/*`: 현재의 템플릿 아키텍처/기술 결정 문서는 참고용으로 유지한다.

### 2. 실행 가능한 규칙만 상단에 둔다.

- "가능하면 테스트" 같은 문구는 제거한다.
- 대신 "UI 수정 시 `npm run lint` + 관련 unit test + build를 기본 수행"처럼 명령형으로 쓴다.
- "실패 시 완료 보고 금지", "미실행 검증은 남은 리스크로 보고"를 상단 고정 규칙으로 둔다.

### 3. 스타일 규칙은 추상 설명이 아니라 체크 가능한 규칙으로 쓴다.

- spacing, dialog scroll, loading, form validation, theme tone 등 반복 수정되는 항목은 별도 문서로 고정한다.
- 필요하면 `해야 함 / 금지 / 예외` 구조로 적는다.
- 디자인 취향 설명보다 "이 컴포넌트에서 무엇을 쓰는지"가 더 중요하다.

### 4. 인증 문서는 "지원 모드 정의"를 먼저 적는다.

- `지원 인증 모드`
- `각 모드의 진실의 원천`
- `화면 입력 방식`
- `세션 발급 주체`
- `함께 지원하는지 / 배타적인지`
- 이 다섯 항목이 먼저 고정되어야 한다.

### 5. Open Question은 구현 규칙과 분리한다.

- 현재 `05-roadmap-open-questions.md`는 유용하지만, 작업 규칙과 섞이면 에이전트가 미확정 항목을 확정값처럼 사용할 수 있다.
- 미확정 항목은 별도 문서에서만 관리하는 편이 안전하다.

## 권장 문서 구조

### A안. 최소 수정형 리뉴얼

- 기존 `docs/codex/01~05`는 유지
- 루트 `AGENTS.md`를 보강
- 아래 문서만 추가

추가 권장 파일:
- `docs/codex/runtime/01-core-execution-rules.md`
- `docs/codex/runtime/02-style-rules.md`
- `docs/codex/runtime/03-verification-gate.md`
- `docs/codex/runtime/04-auth-mode-definition.md`

장점:
- 기존 문서를 거의 버리지 않는다.
- 현재 구조를 크게 흔들지 않는다.
- 빠르게 적용 가능하다.

단점:
- 문서가 이원화되므로 `README` 라우팅이 약하면 다시 누락될 수 있다.

### B안. 구조 재편형 리뉴얼

- 현재 `docs/codex/01~05`를 `reference/`로 이동
- `docs/codex/` 루트는 실행 문서 중심으로 재편

예시:
- `docs/codex/README.md`
- `docs/codex/00-runtime-contract.md`
- `docs/codex/01-style-rules.md`
- `docs/codex/02-verification-matrix.md`
- `docs/codex/03-auth-mode-spec.md`
- `docs/codex/90-open-questions.md`
- `docs/codex/reference/*`

장점:
- Codex 기준 문서의 성격이 명확해진다.
- 참고 문서와 실행 문서의 경계를 분명히 할 수 있다.

단점:
- 기존 링크와 문서 경로를 함께 정리해야 한다.

## 권장안

현재는 `A안`으로 먼저 정리한 뒤, 필요 시 `B안`으로 넘어가는 단계적 접근이 가장 안전하다.

이유:
- 현재 문서 자산 자체는 버릴 수준이 아니다.
- 문제의 본질은 구조 전체 부재보다 `핵심 지침의 우선순위`와 `검증 강제력` 부족이다.
- 따라서 1차로는 `AGENTS.md + runtime 문서 추가 + README 라우팅 강화`만 해도 개선 효과가 클 가능성이 높다.

## 제안 리뉴얼 순서

1. 루트 `AGENTS.md`를 작업 계약 중심으로 보강한다.
2. `docs/codex/README.md`를 "작업 종류별로 어떤 문서를 읽어야 하는지" 안내하는 인덱스로 축약한다.
3. `docs/codex/runtime/` 아래에 실행 규칙, 스타일 규칙, 검증 게이트, 인증 모드 정의 문서를 추가한다.
4. 현재 `docs/codex/01~05`는 아키텍처 참고 문서로 유지하되, 미확정 항목 표기를 더 분명히 한다.
5. `package.json` 및 테스트 설정에서 unit/e2e 분리 작업을 후속으로 진행한다.

## 다음 작업 제안

이번 리뷰를 기준으로 실제 리뉴얼 작업에 들어갈 경우, 우선순위는 아래가 적절하다.

1. `AGENTS.md` 개편 초안 작성
2. `docs/codex/runtime/` 신설
3. `docs/codex/README.md` 라우팅 문구 재작성
4. 테스트 명령 분리 초안 작성
5. 인증 모드 정의 문서 확정

## 변경 파일

- `docs/reports/2026-04-22-codex-md-renewal-review.md`

## 잔여 이슈 및 후속 작업

- 아직 실제 `AGENTS.md` 및 `docs/codex/*` 리뉴얼은 수행하지 않았다.
- `npm run test:run` 실패 원인 해결은 이번 범위에 포함하지 않았다.
- `playwright.config.ts` 부재 상태이므로 E2E 실행 표준도 후속 정리가 필요하다.

## 후속 산출물

- `docs/superpowers/specs/2026-04-23-kmsf-codex-guidance-renewal-design.md`
- `docs/superpowers/plans/2026-04-23-kmsf-codex-guidance-renewal.md`
