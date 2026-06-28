# KMSF 검증 규칙

## 범위

SCOPE: `tests/**`와 이 저장소의 app 검증 판단에 적용한다.

## Command Matrix

- RUN: lint: `npm run lint`
- RUN: unit tests: `npm run test:run`
- RUN: e2e tests: `npm run test:e2e`
- RUN: headed e2e checks: `npm run test:e2e:headed`
- RUN: app baseline: `npm run verify` from repo root or `npm --workspace=apps/kmsf run verify`
- RUN: app full browser gate: `npm run verify:full` when browser gate is required

REPORT: Artifact와 신규 작업 report는 `apps/kmsf/reports/` 아래에 둔다.
DO NOT: Active Playwright output을 local `test-results/` directory에 남기지 않는다.

## Routing 규칙

- USE WHEN: Schema, utility, state, isolated component behavior는 unit test를 사용한다.
- USE WHEN: Auth flow, routing, multi-step UI, browser-integrated behavior는 e2e test를 사용한다.
- VERIFY: Rendered page, layout, form UX, navigation, error presentation에 영향이 있으면 browser verification을 사용한다.
- VERIFY: GNB layout 변경 시 페이지 메뉴 목록은 Left Side에만 출력되는지 확인한다. TOP/Footer는 페이지 메뉴 목록을 그대로 중복 출력하지 않아야 한다.

MUST: Auth validation 또는 locale-sensitive error rendering을 검증할 때 `tests/e2e/auth-validation-i18n.spec.ts`를 포함한다.

## Browser Verification Gate

CHECK: browser verification 순서는 Codex in-app browser, GUI-only computer use, `npm run test:e2e:headed`, repository-local `agent-browser` workflow 순으로 선택한다.

VERIFY: browser verification은 target page load, blocking console error 없음, visible layout breakage 없음, 수정한 interaction path 정상 동작을 확인한다.

## Failure Policy

- BLOCK: Automated check 실패는 completion을 block한다.
- BLOCK: Browser verification 실패는 completion을 block한다.
- REPORT: 실행하지 못한 check는 정확한 사유와 함께 보고한다.
