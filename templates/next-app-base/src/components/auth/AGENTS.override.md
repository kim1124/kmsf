# KMSF Auth Override

## 범위

SCOPE: `src/components/auth/**`에 적용하며, auth form 작업에서는 더 넓은 frontend guidance보다 우선한다.

## 상세 지침

- MUST: 인증 상세 정책은 `docs/codex/08-auth-rules.md`를 따른다.
- MUST: 선택된 auth provider를 진실의 원천으로 취급한다.

## 함께 확인할 파일

CHECK: `docs/codex/08-auth-rules.md`, `src/components/auth/**`, `src/app/sign-in/**`, `src/app/sign-up/**`, `src/app/setup/initial-admin/**`, `src/app/[locale]/(public)/sign-in/actions.ts`, `src/lib/auth/**`, `src/lib/security/**`, `src/lib/supabase/**`.

## 완료 Gate

- BLOCK: sign-in, sign-up, initial admin, profile-update flow를 검증하지 않음
- BLOCK: browser verification에서 console error 또는 broken form rendering 발견
- BLOCK: 수정한 flow의 submit path를 end-to-end로 확인하지 않음
