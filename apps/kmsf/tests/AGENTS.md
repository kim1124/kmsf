# KMSF 검증 규칙

## 범위

이 규칙은 `tests/**`와 이 저장소의 모든 검증 판단에 적용한다.

## Command Matrix

- lint: `npm run lint`
- unit tests: `npm run test:run`
- e2e tests: `npm run test:e2e`
- headed e2e checks: `npm run test:e2e:headed`
- workspace confidence: `npm run verify`

Artifact와 daily report는 저장소 루트 `test-reports/` 아래에 둔다.
Active Playwright output을 local `test-results/` directory에 남기지 않는다.

## Routing 규칙

- Schema, utility, state, isolated component behavior는 unit test를 사용한다.
- Auth flow, routing, multi-step UI, browser-integrated behavior는 e2e test를 사용한다.
- Rendered page, layout, form UX, navigation, error presentation에 영향이 있으면 browser verification을 사용한다.

Auth validation 또는 locale-sensitive error rendering을 검증할 때는 아래 spec을 포함한다.

- `tests/e2e/auth-validation-i18n.spec.ts`

## Browser Verification Gate

권장 순서:

1. 사용 가능한 경우 Codex in-app browser
2. GUI-only validation이 필요하면 computer use
3. `npm run test:e2e:headed`
4. 현재 session에서 사용 가능하면 repository-local `agent-browser` workflow

최소한 browser verification은 아래를 확인한다.

- target page load
- blocking console error 없음
- visible layout breakage 없음
- 수정한 interaction path 정상 동작

## Failure Policy

- Automated check 실패는 completion을 block한다.
- Browser verification 실패는 completion을 block한다.
- 실행하지 못한 check는 정확한 사유와 함께 보고한다.
