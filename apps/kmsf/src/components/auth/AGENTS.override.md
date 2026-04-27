# KMSF Auth Override 규칙

## 범위

이 규칙은 `src/components/auth/**`에 적용하며, auth form 작업에서는 더 넓은 frontend guidance보다 우선한다.

## 시스템의 진실

- UI는 ID처럼 보이는 username을 받을 수 있지만, persisted auth backend는 기본적으로 Supabase Auth다.
- Username 기반 sign-in은 `manager.username -> email -> signInWithPassword` flow와 일치해야 한다.
- Google sign-in과 password sign-in은 모두 auth surface에 포함되며 서로 회귀시키면 안 된다.

## Form 규칙

- 즉시 feedback이 있는 field의 real-time validation은 입력 중 업데이트되어야 한다.
- Field error는 inline으로 표시하고 해당 field와 정렬을 유지한다.
- Submit button은 문서화된 예외가 없으면 명시적 `type="submit"`을 사용한다.
- Pending state는 duplicate submission을 막고 error state를 읽기 쉽게 유지해야 한다.

## Visual 규칙

- Auth form spacing과 error placement는 sign-in, sign-up, initial admin, profile update flow 사이에서 일관되게 유지한다.
- Dialog scroll, overflow, vertical clipping은 단순 style 문제가 아니라 browser verification 대상이다.

## 함께 확인할 파일

- `src/components/auth/**`
- `src/app/sign-in/**`
- `src/app/sign-up/**`
- `src/app/setup/initial-admin/**`
- `src/app/[locale]/(public)/sign-in/actions.ts`
- `src/lib/auth/**`
- `src/lib/security/**`
- `src/lib/supabase/**`

## 완료 Gate

아래에 해당하면 auth 변경을 완료로 보고하지 않는다.

- sign-in, sign-up, initial admin, profile-update flow를 검증하지 않음
- browser verification에서 console error 또는 broken form rendering 발견
- 수정한 flow의 submit path를 end-to-end로 확인하지 않음
