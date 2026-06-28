# KMSF 프론트엔드 규칙

## 범위

이 규칙은 `src/` 아래 모든 파일에 적용한다.

## 핵심 기대사항

- MUST: 이 저장소의 기존 Next.js App Router pattern을 따른다.
- MUST: 정상 동작 중인 코드를 구조 변경하기보다 안전한 최소 수정을 우선한다.
- MUST: Server/client boundary는 의도적으로 유지한다.
- DO NOT: 확정된 규칙과 open question을 implementation code에 섞지 않는다.

## 변경 검토 경로

동작에 영향을 주는 변경은 단일 component만 보지 말고 전체 경로를 함께 확인한다.

- auth 또는 form behavior: `src/app`, `src/components/auth`, `src/lib/auth`, `src/lib/security`, `src/lib/supabase`
- layout 또는 navigation: `src/app`, `src/components/layout`, `src/components/theme`
- validation 또는 submit behavior: form component, server action, schema, button semantics

## UI 규칙

- MUST: 요청이 명시적으로 바꾸지 않는 한 기존 visual direction을 유지한다.
- MUST: 추상적인 styling note보다 직접 확인 가능한 UI rule을 우선한다.
- VERIFY: Form은 label spacing, field error placement, submit trigger, pending state, focus order를 확인한다.
- VERIFY: Dialog나 fixed-height overlay는 browser에서 overflow behavior를 확인한다.

## Auth와 Form 안전 규칙

- DO NOT: Validation 문제를 schema 문제로만 단정하지 않는다. 전체 submit path를 확인한다.
- DO NOT: Form 내부 button이 기본 submit이라고 가정하지 않는다. 필요하면 명시적 `type="submit"`을 확인한다.
- MUST: Loading/disabled state는 submit lifecycle과 일관되게 유지한다.

## 검증 Trigger

Rendered UI, form, auth flow, routing behavior를 변경한 후에는 아래를 수행한다.

- RUN: `apps/kmsf/tests/AGENTS.md`의 자동화 check를 실행한다.
- VERIFY: 환경이 막지 않으면 browser verification을 실행한다.

Browser verification이 막히면 final report에 정확한 blocker를 기록한다.
