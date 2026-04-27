---
name: kmsf-delivery
description: KMSF 저장소에서 UI, auth, docs, verification behavior를 변경할 때 사용한다. 완료 보고 전에 KMSF 전용 delivery rule을 적용한다.
---

# KMSF Delivery Skill

## 사용 시점

`kmsf` 작업이 아래 항목 중 하나를 건드리면 이 skill을 사용한다.

- rendered UI
- auth 또는 form behavior
- repository instruction 또는 delivery docs
- testing 또는 verification script
- reporting workflow

관련 없는 저장소에는 이 skill을 사용하지 않는다.

## 먼저 읽을 파일

파일을 변경하기 전에 가장 가까운 active instruction file을 읽는다.

- `AGENTS.md`
- main app 작업이면 `apps/kmsf/AGENTS.md`
- main app source 아래 작업이면 `apps/kmsf/src/AGENTS.md`
- auth form 작업이면 `apps/kmsf/src/components/auth/AGENTS.override.md`
- verification routing은 `apps/kmsf/tests/AGENTS.md`
- package-consumer example 작업이면 `examples/basic-dashboard/AGENTS.md`

필요 시 운영 참고 문서를 추가로 확인한다.

- `docs/codex/README.md`
- `docs/codex/02-style-and-auth-rules.md`
- `docs/codex/03-verification-and-browser-gate.md`
- `docs/codex/04-plugin-and-skill-strategy.md`

## Workflow

1. Visible component만 보지 말고 실제 change path를 확인한다.
2. UI 또는 auth 작업은 관련 `apps/kmsf/src/app`, `apps/kmsf/src/components`, `apps/kmsf/src/lib` 파일을 함께 확인한다.
3. 최소 수정으로 반영한다.
4. 필요한 verification command를 실행한다.
5. Rendered change는 환경이 막지 않는 한 browser verification을 실행한다.
6. 완료 전 repository report를 업데이트한다.

## UI/Auth Checklist

- submit trigger path 확인
- field error rendering path 확인
- pending 또는 disabled state 확인
- dialog 또는 constrained surface의 layout overflow 확인
- auth truth of system 확인: username UI가 Supabase email auth에 매핑될 수 있다.

## Verification Checklist

항상 실행한다.

- `npm run lint`
- `npm run test:run`
- `npm run build`

관련 있을 때 실행한다.

- `npm run test:e2e`
- Codex in-app browser, computer use, `agent-browser` 중 사용 가능한 browser verification

## Completion Gate

아래에 해당하면 완료로 보고하지 않는다.

- required automated check 실패
- browser verification에서 visible breakage 발견
- console error가 남아 있음
- required check를 written blocker 없이 생략

## Reporting

Daily report를 업데이트한다.

- `test-reports/YYYY-MM-DD.md`

각 entry에는 아래를 포함한다.

- timestamp
- summary
- changed files
- commands actually run
- result
- residual risk
