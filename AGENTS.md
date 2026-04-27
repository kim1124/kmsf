# KMSF 저장소 실행 계약

## 목적

이 파일은 `kmsf` 저장소에서 Codex가 따라야 하는 저장소 공통 실행 계약이다.

하위 디렉터리에 더 가까운 `AGENTS.md` 또는 `AGENTS.override.md`가 있으면 함께 적용한다. 더 구체적인 파일은 해당 범위에서 이 파일보다 우선한다.

## 프레임워크 주의

이 저장소는 legacy Next.js가 아니다. Framework behavior, routing, rendering, middleware, config를 변경하기 전에는 `node_modules/next/dist/docs/` 아래의 관련 guide를 먼저 확인한다.

## 작업 규칙

- 변경은 요청 범위 안에서 최소 수정으로 진행한다.
- `docs/codex`를 runtime instruction layer로 취급하지 않는다. 현재는 사람이 읽는 운영 참고 문서다.
- 실행 계층은 `AGENTS.md` 파일들이다.
- UI, auth, docs, verification flow를 건드리면 `.codex/skills/kmsf-delivery/SKILL.md` repo skill을 사용한다.
- Superpowers가 사용 가능하면 broad rewrite의 허가가 아니라 process guardrail로 사용한다.
- 모호한 설계 문장보다 명시적이고 검증 가능한 규칙을 우선한다.
- 아직 결정되지 않은 요구사항은 runtime rule에 섞지 말고 `docs/codex/90-open-questions.md`에 기록한다.
- `docs/reports/*`는 legacy archive로 본다. 신규 daily report는 `test-reports/` 아래에 작성한다.

## Superpowers TDD 프로세스

Feature, bugfix, refactor, UI, auth, routing, data flow, verification 변경에서는 side effect를 줄이기 위해 Superpowers TDD를 사용한다.

필수 순서:

1. 코드 변경 전에 scope와 영향 파일을 확인한다.
2. 버그 또는 실패 check가 있으면 `systematic-debugging`으로 root cause를 먼저 확인한다.
3. 동작 변경은 production code보다 먼저 `test-driven-development`를 적용한다.
   - 가장 작은 관련 실패 테스트를 먼저 추가하거나 수정한다.
   - 해당 테스트를 실행해 예상한 이유로 실패하는지 확인한다.
   - 통과에 필요한 최소 코드만 구현한다.
   - focused test를 다시 실행하고, 이후 repository verification baseline을 실행한다.
4. 새 자동화 테스트로 직접 검증하기 어려운 변경은 `test-reports/YYYY-MM-DD.md`에 사유를 기록하고 가장 가까운 검증 command로 보완한다.
5. 테스트를 통과시키는 과정에서 scope를 확장하지 않는다. 현재 요청이나 실패 테스트에 필요한 경우가 아니면 cleanup/refactor는 후속으로 분리한다.

TDD 예외:

- 문서만 변경하는 작업
- instruction-only 변경
- generated file
- 승인된 package command로 발생한 lockfile 변경
- 커밋하지 않는 조사용 임시 코드

예외가 적용되어도 completion gate와 reporting rule은 유지한다.

## 완료 Gate

아래 중 하나라도 해당하면 완료로 보고하지 않는다.

- required test 실패
- required build 실패
- required browser verification을 설명 없이 생략
- browser verification에서 visible UI breakage 발견
- browser console error, hydration error, route error가 남아 있음

검증을 실행할 수 없으면 정확한 blocker를 보고하고 residual risk로 남긴다.

## 검증 기준

- 항상 `npm run lint`를 실행한다.
- 변경 영역에 맞는 자동화 테스트를 실행한다.
- 저장소 수준 confidence를 위해 `npm run build`를 실행한다.
- rendered UI, auth flow, layout, navigation, interaction 변경은 browser verification을 실행한다.

정확한 command routing은 `apps/kmsf/tests/AGENTS.md`를 따른다.

## 보고 규칙

실질적인 작업을 마치기 전 아래 파일을 생성하거나 업데이트한다.

- `test-reports/YYYY-MM-DD.md`

보고 규칙:

- 날짜별 Markdown report는 하루에 하나만 둔다.
- 같은 날짜의 작업 결과는 같은 daily file에 append한다.
- browser/test artifact는 저장소 루트 `test-reports/` 아래에 둔다.
- active artifact를 `test-results/` 아래에 남기지 않는다.

각 report entry에는 아래 항목을 포함한다.

- timestamp
- summary
- changed files
- commands actually run
- pass/fail result
- residual risks or blockers

## 저장소 참고 문서

필요 시 아래 문서를 읽는다.

- `docs/codex/README.md`
- `docs/codex/01-instruction-architecture.md`
- `docs/codex/02-style-and-auth-rules.md`
- `docs/codex/03-verification-and-browser-gate.md`
- `docs/codex/04-plugin-and-skill-strategy.md`

## 워크스페이스 Map

- `apps/kmsf/AGENTS.md`: main app workspace rules
- `apps/kmsf/src/AGENTS.md`: frontend and App Router rules
- `apps/kmsf/src/components/auth/AGENTS.override.md`: auth form rules
- `apps/kmsf/tests/AGENTS.md`: verification matrix and browser gate
- `examples/basic-dashboard/AGENTS.md`: package-consumer example workspace rules
- `packages/*`: reusable packages and CLI workspaces
- `templates/*`: future scaffold source directories
- `apps/*`: internal docs or playground applications
