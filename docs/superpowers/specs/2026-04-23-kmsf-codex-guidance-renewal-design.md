# KMSF Codex 지침 리뉴얼 설계

## 목적

`kmsf` 저장소의 Codex 지침 체계를 전면 재구성하여 아래 문제를 줄인다.

- 스타일 수정 요청이 누락되거나 추상적으로 반영되는 문제
- 테스트와 브라우저 검증 없이 완료 처리되어 사이드 이펙트가 발생하는 문제
- 인증/폼/레이아웃처럼 규칙이 많은 영역에서 요구사항이 흐려지는 문제
- `docs/codex` 참고 문서와 실제 실행 규칙이 섞여, Codex가 우선순위를 잘못 해석하는 문제

이번 리뉴얼의 목표는 "문서를 많이 쓰는 것"이 아니라 "Codex가 작업 전에 자동으로 읽는 실행 계약을 분명히 만들고, 반복 규칙을 repo skill로 재사용 가능하게 분리하는 것"이다.

## 배경과 핵심 판단

### 1. 공식 Codex 권장 구조

OpenAI Codex 공식 문서에 따르면 Codex는 작업 전에 `AGENTS.md` 체인을 자동으로 읽는다. 프로젝트 루트부터 현재 작업 디렉터리까지 내려오며, 각 디렉터리에서 `AGENTS.override.md`, `AGENTS.md`, fallback 파일명 순서로 최대 1개만 읽는다. 현재 작업 디렉터리에 가까운 파일일수록 뒤에 병합되어 우선한다.

따라서 실행 규칙의 중심은 `docs/codex`가 아니라 `AGENTS.md` 계층이어야 한다. `docs/codex`는 참고 가능한 설계·운영 문서로 남기고, 실제 작업 계약은 `AGENTS.md` 계층과 repo skill에 둔다.

### 2. Gemini 문서가 더 정확했던 이유

기존 비교 결과, Gemini 문서는 더 짧아서가 아니라 "바로 행동으로 옮길 수 있는 규칙"을 더 직접적으로 담고 있었다.

예시:

- 폼 간격을 어떤 값으로 맞출지
- 실시간 검증을 어떤 이벤트 기준으로 처리할지
- Dialog overflow를 어떤 클래스로 처리할지
- 로딩 중 어떤 UI 차단을 적용할지

반면 기존 `docs/codex`는 아키텍처 설명 비중이 높아, 실행 단계에서 "어떤 파일을 보고 무엇을 반드시 지켜야 하는지"가 약했다.

이번 리뉴얼에서는 Gemini식 장점을 아래 방식으로 흡수한다.

- 추상 문장보다 명령형 문장 사용
- "해야 함 / 금지 / 예외 / 확인 파일" 구조 사용
- 스타일 규칙을 UI, 폼, 인증, 브라우저 검증 규칙으로 세분화
- 완료 조건을 선언이 아니라 체크리스트로 전환

### 3. 현재 저장소의 검증 체계 문제

현재 저장소에는 `lint`, `Vitest`, `Playwright` 자산이 이미 존재한다. 하지만 `package.json`과 `vitest.config.ts`가 unit/e2e 경계를 명확히 분리하지 않아 `npm run test:run`이 `tests/e2e/supabase-auth.spec.ts`를 Vitest로 읽어 실패한다.

즉 문제는 "테스트 도구 부재"보다 "테스트 실행 계약 부재"에 가깝다.

이번 리뉴얼은 아래를 포함해야 한다.

- unit test 명령과 e2e 명령 분리
- 브라우저 검증 명령 또는 절차 명시
- 테스트 실패, 빌드 실패, 브라우저 콘솔 오류 시 완료 금지

## 목표 상태

### 1. 실행 규칙과 참고 문서 분리

실행 규칙:

- 루트 `AGENTS.md`
- `src/AGENTS.md`
- `src/components/auth/AGENTS.override.md`
- `tests/AGENTS.md`
- `.codex/skills/kmsf-delivery/`

참고 문서:

- `docs/codex/README.md`
- `docs/codex/01-instruction-architecture.md`
- `docs/codex/02-style-and-auth-rules.md`
- `docs/codex/03-verification-and-browser-gate.md`
- `docs/codex/04-plugin-and-skill-strategy.md`
- `docs/codex/90-open-questions.md`

### 2. 완료 조건의 명문화

아래 중 하나라도 충족하지 못하면 완료 처리하지 않는다.

- 지시된 변경 범위 반영
- `npm run lint` 통과
- 관련 unit test 통과
- `npm run build` 통과
- UI 영향 변경의 경우 브라우저 검증 수행
- 브라우저 콘솔 오류, hydration 오류, 주요 화면 렌더링 오류 없음
- 미수행 검증은 명확히 리스크로 보고

### 3. 브라우저 검증을 개발 흐름에 편입

Codex 공식 문서는 로컬 웹 앱은 in-app browser를 우선 사용하고, GUI 검증이 파일/명령 출력만으로 부족할 때는 computer use를 사용하라고 안내한다.

현재 저장소 범위에서는 아래를 채택한다.

- 저장소 문서에는 Codex app의 in-app browser / computer use 우선 원칙을 명시
- 현재 세션의 실제 실행 경로는 `agent-browser` skill 기반으로 문서화
- 필요 시 `@Computer Use` 또는 브라우저 플러그인 검증 절차를 후속 확장 포인트로 둔다

## 정보 구조 설계

### A. AGENTS 계층

#### `/AGENTS.md`

역할:

- 저장소 공통 계약
- 문서와 검증의 우선순위
- 완료 처리 금지 조건
- 보고서 작성 위치
- plugin/skill 활용 기본 원칙

포함 내용:

- 작업 시작 전 읽을 문서 우선순위
- 테스트/브라우저 검증 실패 시 완료 금지
- 문서/설정 변경 시에도 검증 필요
- 변경 후 `docs/reports/WORKLOG.md`, `docs/reports/CHANGELOG_AI.md` 갱신 원칙

#### `/src/AGENTS.md`

역할:

- 프론트엔드 전반 공통 규칙
- Next.js App Router, 폼, 레이아웃, 상태, 접근성, i18n, auth 흐름의 기본 규칙

포함 내용:

- server/client 경계
- UI 수정 시 확인 파일
- 스타일 변경 시 규칙
- 폼/버튼/submit 경로 점검 기준

#### `/src/components/auth/AGENTS.override.md`

역할:

- 인증 폼 계열 특수 규칙의 우선 적용

포함 내용:

- 라벨/필드 spacing
- 실시간 validation
- submit trigger
- field error 표시 위치
- 보안과 CSRF 확인
- ID/PW UI vs Supabase Auth 진실의 원천

#### `/tests/AGENTS.md`

역할:

- 테스트 종류별 실행 규칙
- 어떤 변경에서 어떤 검증을 추가로 수행하는지

포함 내용:

- lint/unit/e2e/build/browser verification 매트릭스
- "테스트 불가" 보고 규칙

### B. `docs/codex` 전면 재편

`docs/codex`는 이제 "Codex가 자동으로 읽는 실행 규칙 모음"이 아니라, 사람과 Codex가 함께 참고하는 운영 문서 모음으로 재정의한다.

#### `docs/codex/README.md`

- 문서 목적
- `AGENTS.md` 계층과의 관계
- 작업 유형별 참고 문서 안내

#### `docs/codex/01-instruction-architecture.md`

- 최종 지침 구조 설명
- 공식 Codex 문서와 매핑
- 왜 `docs`가 아니라 `AGENTS` 계층이 실행의 중심인지 설명

#### `docs/codex/02-style-and-auth-rules.md`

- Gemini 결과에서 효과적이었던 규칙 추출
- 스타일/인증/폼 규칙을 명확한 명령문으로 정리

#### `docs/codex/03-verification-and-browser-gate.md`

- 테스트 매트릭스
- 브라우저 검증 기준
- 브라우저 에러 시 완료 금지 원칙

#### `docs/codex/04-plugin-and-skill-strategy.md`

- Superpowers, repo skill, browser tool, Notion 연계 전략
- 어떤 문제를 어떤 도구로 푸는지 정리

#### `docs/codex/90-open-questions.md`

- 아직 합의되지 않은 사항만 별도 관리

### C. Repo Skill

경로:

- `.codex/skills/kmsf-delivery/SKILL.md`

역할:

- `kmsf` 저장소에서 자주 반복되는 delivery 규칙을 재사용 가능한 workflow로 제공

주요 내용:

- 언제 트리거되는지
- 작업 시작 시 우선 확인 파일
- 스타일/폼/인증 수정 체크리스트
- 테스트/브라우저 검증 체크리스트
- 보고서 작성 형식
- 완료 조건

이 skill은 전역 플러그인이 아니라 저장소 전용 workflow이므로, 현재 저장소에서만 강하게 적용된다.

## 개발 환경 재설정 설계

### 1. 테스트 스크립트 재정비

`package.json`

- `test`: unit test만 실행
- `test:run`: unit CI 모드
- `test:e2e`: Playwright 전용
- `test:e2e:headed`: 시각 확인용
- `verify`: lint + unit + build

### 2. Vitest 경계 수정

`vitest.config.ts`

- `tests/e2e/**` 제외
- unit test 경로 명시

### 3. Playwright 설정 추가

`playwright.config.ts`

- 기본 baseURL 설정
- webServer 또는 수동 dev server 연동 정책
- 콘솔 오류/페이지 오류를 실패로 취급할 수 있는 기본 방향

### 4. 브라우저 검증 문서화

저장소 내 문서에는 다음 원칙을 포함한다.

- 로컬 웹 앱 검증은 in-app browser 또는 agent-browser 우선
- GUI에서만 보이는 회귀는 브라우저 확인까지 끝나야 완료
- 브라우저 콘솔 오류는 미해결 상태로 완료 금지

## 리포팅 설계

이번 리뉴얼은 저장소 내부 리포팅 품질 향상까지 포함한다.

추가/정비 대상:

- `docs/reports/WORKLOG.md`
- `docs/reports/CHANGELOG_AI.md`

원칙:

- 작업 일시
- 작업 요약
- 변경 파일
- 수행한 검증
- 결과
- 잔여 이슈 및 후속 작업

## 플러그인 및 스킬 전략

### Superpowers

적합한 용도:

- 복잡한 작업의 설계 문서화
- 실행 계획 수립
- 디버깅 절차 표준화
- 완료 전 검증 강제

한계:

- 자체적으로 외부 리포트 시스템에 결과를 적재하는 도구는 아님

### Repo Skill

적합한 용도:

- `kmsf` 고유 규칙 재사용
- 문서 길이 증가 없이 반복 규칙 유지

### Browser 검증 도구

적합한 용도:

- 화면 렌더링 확인
- 브라우저 오류 재현
- 시각 회귀 체크

### 후속 확장

- Notion 플러그인으로 외부 리포팅 자동화
- 필요 시 project-level plugin으로 승격

## 수용 기준

이번 리뉴얼 완료 기준은 아래와 같다.

1. `AGENTS.md` 계층이 공식 Codex 경로 기준으로 재배치되어 있다.
2. `docs/codex`가 새 구조로 전면 개편되어 있다.
3. `kmsf-delivery` repo skill이 추가되어 있다.
4. 테스트 스크립트가 unit/e2e/browser 용도로 분리되어 있다.
5. `Vitest`가 Playwright e2e 파일을 읽지 않는다.
6. 보고서 체계가 정비되어 있다.
7. `lint`, unit test, build가 통과한다.
8. 가능한 범위의 브라우저 검증을 수행하고, 실패 시 완료 처리하지 않는다.

## 리스크

- 실제 브라우저 검증은 로컬 dev server 실행 가능성, 권한, UI 환경에 영향을 받을 수 있다.
- Codex app in-app browser는 현재 세션에서 직접 제어하는 도구가 제한될 수 있으므로, 당장은 `agent-browser` 기반 절차를 병행 문서화해야 한다.
- `AGENTS` 계층이 과도하게 많아지면 오히려 관리 비용이 증가하므로 최소 개수만 유지해야 한다.

## 이번 작업의 권장 실행 순서

1. 설계 문서 저장
2. 실행 계획 문서 저장
3. 루트 `AGENTS.md` 작성
4. `src/AGENTS.md`, `src/components/auth/AGENTS.override.md`, `tests/AGENTS.md` 작성
5. `docs/codex` 전면 개편
6. repo skill 추가
7. 테스트/브라우저 검증 설정 변경
8. 리포팅 문서 정비
9. 검증 수행
