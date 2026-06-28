# KMSF 저장소 실행 계약

## 목적

- ROLE: 이 파일은 `kmsf` 저장소에서 Codex가 따라야 하는 공통 실행 계약이다.
- MUST: 하위 `AGENTS.md` 또는 `AGENTS.override.md`가 있으면 함께 적용하며, 더 가까운 파일이 해당 범위에서 우선한다.
- EXPECT: `AGENTS.override.md`는 공식 Codex discovery 대상이며, 같은 디렉터리의 `AGENTS.md`보다 우선한다.
- SCOPE: 이 계약은 `apps/*`, `packages/*`, `examples/*`, `templates/*`에 모두 적용된다.
- DO NOT: 하위 `AGENTS.md`에 공통 규칙을 반복하지 않는다. 해당 범위의 특이 규칙만 추가한다.
- MUST: 독립 실행/배포 단위가 확정될 때만 `apps/*` 하위에 새 workspace를 둔다. 현재 실행 앱은 `apps/kmsf` 하나다.

## 프레임워크 주의

- CONTEXT: 이 저장소는 legacy Next.js가 아니다.
- MUST: Framework behavior, routing, rendering, middleware, config를 변경하기 전에는 `node_modules/next/dist/docs/` 아래의 관련 guide를 먼저 확인한다.

## 작업 규칙

- MUST: 변경은 요청 범위 안에서 최소 수정으로 진행한다.
- MUST: 현재 프로젝트의 기술 스택과 디렉터리 구조를 먼저 확인한다.
- DO NOT: Next.js와 Nuxt.js 패턴을 혼용하지 않는다.
- MUST: `docs/codex`는 runtime instruction layer가 아니라 사람이 읽는 운영 참고 문서다.
- MUST: 실행 계층은 `AGENTS.md` 파일들이다.
- USE WHEN: UI, auth, docs, verification flow를 건드리면 `.agents/skills/delivery/SKILL.md`를 사용한다.
- MUST: 모호한 설계 문장보다 명시적이고 검증 가능한 규칙을 우선한다.
- DO NOT: 아직 결정되지 않은 요구사항을 runtime rule에 섞지 않는다. `docs/codex/90-open-questions.md`에 기록한다.
- REPORT: 완료 판단에 필요한 신규 작업 결과 report는 작업 scope의 `reports/YYYY-MM-DD.md`에 작성한다.

## Skill Routing

적용 범위: `apps/*`, `packages/*`, `examples/*`, `templates/*`.

- USE WHEN: `ask-research` for `research.md`, `plan.md`, 설계 문서, 구현 계획, 최신 정보 비교, 외부 공식 문서 확인 전에 repo/공식문서/웹 조사 범위를 정리한다.
- USE WHEN: `ask-question` for 신규/수정/삭제 작업이 사용자 결정을 고정할 수 있으면 파일 쓰기 전에 질문 gate를 수행한다.
- USE WHEN: `delivery` for UI, auth, docs, verification, reporting, release readiness 작업 라우터.
- USE WHEN: `md-maintainer` for `AGENTS.md`, `GUIDE.md`, `docs/codex`, report policy 정리.
- USE WHEN: `code-review` for local diff, PR, generated code, public API, security, accessibility, missing test 검토.
- USE WHEN: `code-health` for lint, typecheck, refactor, performance, memory, lifecycle, package compatibility 검토.
- USE WHEN: `test-gate` for Vitest, Playwright, browser verification, app/package verify, final test reporting.

## Supervisor Workflow

- ROLE: 사람은 supervisor, AI는 coder 역할을 맡는다.
- MUST: 요청이 모호하거나 영향 범위가 불명확하면 구현 전에 질문하고 답변을 받아 계획을 확정한다.
- DO NOT: Supervisor 승인 전 production code를 작성하지 않는다. 조사, 파일 읽기, 영향 범위 분석, 계획 문서 작성은 가능하다.
- DO NOT: Supervisor가 명시적으로 승인하기 전에는 Git commit, push, PR 생성 작업을 하지 않는다.
- EXPECT: Codex Plan Mode UI를 사용할 수 없거나 사용자가 신뢰하기 어렵다고 판단한 경우, 일반 채팅에서 동일한 질문 loop와 승인 흐름을 수행한다.
- MUST: Plan Mode fallback에서도 사용자 결정사항이 남아 있으면 구현 계획을 확정하지 않고, production code 변경 직전에 승인 여부를 확인한다.
- MUST: 보통 이상 기능은 `docs/superpowers/plans/YYYY-MM-DD-<topic>/` 아래에 `research.md`, `spec.md`, `plan.md`, `tasks.md`, `report.md` 역할을 분리한다.
- EXCEPT: 작은 수정은 scope-local `reports/YYYY-MM-DD.md`만 기록할 수 있다.
- REPORT: compact가 필요하면 같은 topic 폴더의 `memory.md`에 핵심 결정, 진행 상태, 실행한 검증, 잔여 리스크를 남긴다.

## 결정 Gate

- MUST: repo/공식문서/웹/최신 정보 조사가 필요하면 계획 전에 `ask-research`를 사용한다.
- MUST: 신규/수정/삭제가 제품 동작, public API, 데이터 모델/흐름, 권한/auth/security, migration, 운영/release 정책, UX 흐름, 검증 정책을 고정할 수 있으면 `.agents/skills/ask-question/SKILL.md`를 사용한다.
- MUST: repo 규칙, 기존 코드 패턴, 검증 명령처럼 코드베이스에서 확인 가능한 사실은 직접 확인한다.
- DO NOT: 사용자 결정이 필요한 항목을 답변 없이 `research.md`, `spec.md`, `plan.md`, `tasks.md`, 구현 파일, 지침 파일에 확정 기재하지 않는다.
- EXCEPT: 승인된 계획의 단순 이행, 순수 기계적 수정, generated file, repo-verifiable fact 반영에는 질문 gate를 생략할 수 있다.
- REPORT: 질문 gate가 필요 없으면 plan 또는 report에 `ask gate clear`를 기록한다.

## Superpowers TDD

USE WHEN: Feature, bugfix, refactor, UI, auth, routing, data flow, verification 변경에서는 Superpowers TDD를 process guardrail로 사용한다.

- MUST: 코드 변경 전 scope와 영향 파일을 확인한다.
- USE WHEN: 버그 또는 실패 check가 있으면 `systematic-debugging`으로 root cause를 먼저 확인한다.
- USE WHEN: 동작 변경은 `test-driven-development`를 적용한다.
- MUST: 관련 실패 테스트를 먼저 추가/수정하고, 통과에 필요한 최소 코드만 구현한 뒤 focused test와 baseline을 실행한다.
- REPORT: 테스트 보강이 어려운 변경은 `reports/YYYY-MM-DD.md`에 사유와 대체 검증을 기록한다.
- DO NOT: 현재 요청이나 실패 테스트에 필요하지 않은 cleanup/refactor를 섞지 않는다.

EXCEPT: 문서 only, instruction only, generated file, 승인된 package command로 발생한 lockfile 변경, 커밋하지 않는 조사용 임시 코드.

## 완료 Gate

아래 중 하나라도 해당하면 완료로 보고하지 않는다.

- BLOCK: required test 실패
- BLOCK: required build 실패
- BLOCK: required browser verification을 설명 없이 생략
- BLOCK: browser verification에서 visible UI breakage 발견
- BLOCK: browser console error, hydration error, route error가 남아 있음

REPORT: 검증을 실행할 수 없으면 정확한 blocker를 보고하고 residual risk로 남긴다.

## 검증 기준

- RUN: 항상 `npm run lint`를 실행한다.
- RUN: 변경 영역에 맞는 자동화 테스트를 실행한다.
- RUN: 저장소 수준 confidence를 위해 `npm run build`를 실행한다.
- VERIFY: rendered UI, auth flow, layout, navigation, interaction 변경은 browser verification을 실행한다.
- EXPECT: 루트 `npm run verify`는 기본적으로 `apps/kmsf` 단일 app baseline만 검증한다.
- RUN: 패키지는 각 workspace에서 `npm --workspace=<package> run verify`로 개별 검증한다.
- RUN: 전체 package 검증은 명시 요청이 있을 때 `npm run verify:packages` 또는 `npm run verify:all`로 실행한다.
- MUST: 정확한 command routing은 app 변경은 `apps/kmsf/tests/AGENTS.md`, package 변경은 각 package의 `AGENTS.md`와 `test/AGENTS.md`를 따른다.

## 작업 경로 기준

- MUST: 모든 Codex 개발 작업은 사용자가 지정한 현재 workspace root를 기준으로 수행한다.
- MUST: KMSF 작업은 이 저장소의 Git root를 실제 작업 root로 사용한다.
- MUST: 한글 `개발` 디렉터리 또는 Unicode 정규화 변형 경로는 legacy alias로만 취급한다.

## 보고 규칙

REPORT: 실질적인 작업을 마치기 전 scope-local report를 생성하거나 업데이트한다. 위치는 root `reports/YYYY-MM-DD.md`, app `apps/<app>/reports/YYYY-MM-DD.md`, package `packages/<package>/reports/YYYY-MM-DD.md`, example `examples/<example>/reports/YYYY-MM-DD.md`다.

REPORT: 각 report entry에는 timestamp, summary, changed files, commands actually run, pass/fail result, residual risks or blockers를 포함한다.
REPORT: E2E, browser, DB, 배포 검증은 실패 원인, 수정 후 재실행 결과, artifact path를 가능한 범위에서 남긴다.
MUST: Browser/test artifact는 해당 workspace의 `reports/artifacts/` 아래에 둔다. DO NOT: active artifact를 `test-results/` 아래에 남기지 않는다.

## 저장소 참고 문서

필요 시 `docs/codex/README.md`와 `docs/codex/01-*.md`부터 `docs/codex/07-*.md`를 읽는다.

## 워크스페이스 Map

- `apps/kmsf/AGENTS.md`: main app workspace rules
- `apps/kmsf/src/AGENTS.md`: frontend and App Router rules
- `apps/kmsf/src/components/auth/AGENTS.override.md`: auth form rules
- `apps/kmsf/tests/AGENTS.md`: verification matrix and browser gate
- `examples/basic-dashboard/AGENTS.md`: package-consumer example workspace rules
- `packages/*`: reusable packages and CLI workspaces
- `templates/*`: future scaffold source directories
- `apps/*`: executable applications only; currently `apps/kmsf` is the main app
