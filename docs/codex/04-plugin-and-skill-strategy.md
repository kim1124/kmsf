# 플러그인 및 Skill 전략

## 목적

`kmsf` 개발 과정에서 사용할 수 있는 plugin과 skill의 역할을 정리한다.

## 현재 우선 조합

### Superpowers

사용 목적:

- 설계 정리
- 실행 계획 수립
- 디버깅 프로세스 표준화
- 완료 전 검증 강제

적합한 skill:

- `brainstorming`
- `writing-plans`
- `systematic-debugging`
- `verification-before-completion`
- `requesting-code-review`

### Repo skill: `kmsf-delivery`

사용 목적:

- 저장소 고유 규칙 재사용
- 스타일/인증/보고/검증 규칙을 짧게 반복 호출

### Browser 도구

사용 목적:

- 브라우저에서만 보이는 회귀 발견
- 콘솔 오류 확인
- submit/redirect/interactive flow 확인

## 외부 리포팅 확장

현재 범위에서는 저장소 내부 리포트를 우선 사용한다.

- `test-reports/YYYY-MM-DD.md`
- `test-reports/playwright/**`

후속 확장 후보:

- Notion 플러그인으로 외부 작업 리포트 자동화

## TDD 적합성

Superpowers의 `test-driven-development` skill은 다음 범위에서 적용 가치가 높다.

- UI 동작이나 라우팅처럼 명확한 기대 결과가 있는 변경
- 인증, 세션, 입력 검증처럼 회귀 위험이 큰 변경
- 보고 경로나 출력 규칙처럼 테스트 가능한 계약 변경

반대로, 대규모 디렉터리 이동이나 workspace 재배선처럼 구조 변경 비중이 높은 작업은 TDD만으로 충분하지 않다. 이 경우에는 `writing-plans`와 `verification-before-completion`을 함께 쓰고, 이동 후 `lint`, `test:run`, `build`, 브라우저 검증으로 회귀를 잡는 편이 더 현실적이다.

## KMSF TDD 프로세스

목표는 Superpowers의 강한 TDD 규칙을 `kmsf`의 최소 수정 원칙과 결합해, Codex 작업 후 발생하는 사이드 이펙트와 회귀를 줄이는 것이다.

### 적용 대상

아래 작업은 기본적으로 TDD 대상으로 본다.

- 기능 추가 또는 동작 변경
- 버그 수정
- 인증, 세션, 권한, 폼 제출, validation 변경
- 라우팅, middleware, locale, redirect 변경
- 상태 관리, 데이터 변환, 유틸리티 로직 변경
- 테스트/검증 스크립트의 동작 변경

아래 작업은 TDD 예외로 둘 수 있다.

- 문서만 변경하는 작업
- `AGENTS.md`, `docs/codex/*` 같은 instruction-only 변경
- 자동 생성물 또는 승인된 패키지 명령으로 생긴 lockfile 변경
- 커밋하지 않는 조사용 임시 코드

예외를 적용해도 `lint`, `test:run`, `build`와 작업 리포트 기록은 유지한다.

### 실행 순서

1. 루트와 작업 범위의 `AGENTS.md`를 읽고, 실제 변경 파일과 영향 범위를 확인한다.
2. 버그, 실패 테스트, 예기치 않은 동작이면 `systematic-debugging`으로 root cause를 먼저 확인한다.
3. 새 동작 또는 변경 동작을 가장 작은 테스트로 표현한다.
4. 해당 테스트를 먼저 실행해 기대한 이유로 실패하는지 확인한다.
5. 실패 테스트를 통과시키는 최소 구현만 반영한다.
6. focused test를 다시 실행한다.
7. `npm run lint`, `npm run test:run`, `npm run build`를 실행한다.
8. 렌더링, auth, form, navigation 변경이면 브라우저 검증 또는 e2e를 추가한다.
9. `test-reports/YYYY-MM-DD.md`에 실행 명령, 결과, 미실행 항목, 잔여 리스크를 기록한다.

### 사이드 이펙트 억제 규칙

- 실패 테스트가 요구하지 않는 리팩터링은 하지 않는다.
- 테스트를 통과시키기 위해 public contract를 바꿔야 하면 먼저 영향 범위를 보고한다.
- snapshot이나 e2e는 넓은 회귀 검출용으로 사용하고, 원인 격리는 unit/component 수준 테스트를 우선한다.
- flaky test로 의심되면 재실행만 반복하지 않고 실패 조건과 환경 제약을 리포트에 남긴다.
- Superpowers 지침과 저장소 지침이 충돌하면 `AGENTS.md`를 우선한다.

## 권장 운영

- 복잡한 변경: Superpowers + repo skill
- UI/auth 변경: repo skill + browser verification
- 문서/지침 변경: repo skill + 기본 검증
- 외부 공유가 필요한 경우: 후속으로 Notion 연계 검토

## Superpowers 사용 순서

실무에서는 아래 순서가 가장 안정적이다.

1. `brainstorming`
   - 요구사항을 구현 가능한 단위로 분해한다.
   - 해석 여지가 큰 항목과 리스크를 먼저 정리한다.
2. `writing-plans`
   - 수정 순서, 영향 범위, 검증 경로를 짧은 계획으로 고정한다.
   - 구조 변경이 있으면 이 단계가 특히 중요하다.
3. `test-driven-development`
   - UI, 세션, 인증, 라우팅처럼 기대 결과가 분명한 작업에서 먼저 실패 테스트를 추가한다.
   - 모든 작업에 강제하기보다, 회귀 위험이 높은 기능 변경에 우선 적용한다.
4. 구현
   - repo skill과 `AGENTS.md` 규칙을 따라 최소 수정으로 반영한다.
5. `verification-before-completion`
   - `lint`, `test:run`, `build`, 필요 시 `test:e2e`까지 실제로 통과한 뒤에만 완료로 보고한다.

`kmsf`에서는 위 순서를 기본값으로 두고, 브라우저에서 보이는 변경이 있으면 Playwright 또는 사용 가능한 브라우저 도구를 함께 돌리는 방식을 권장한다.
