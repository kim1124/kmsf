# CHANGELOG_AI

## 2026-04-23 System Font Migration

- `examples/basic-dashboard/src/app/layout.tsx`에서 `next/font/google` 제거
- 한글/영문 공용 시스템 폰트 스택을 `src/lib/theme/font-stacks.ts`로 분리
- 본문/헤드라인/코드 폰트를 각각 시스템 sans, 시스템 sans, 시스템 mono 조합으로 통일
- 폰트 스택 검증용 `Vitest` 테스트 추가
- 외부 Google Fonts fetch 없이 `build`와 Playwright 브라우저 검증 통과 확인

## 2026-04-23 Workspace 1A And Locale Toggle

- 저장소 구조를 `packages / templates / examples / apps` 중심의 `1안`으로 재편
- 메인 실행 앱을 `examples/basic-dashboard`로 이동하고 루트 스크립트를 새 경로로 재배선
- `packages/create-kmsf`, `packages/generator-core` placeholder 추가
- `templates/next-app-base`, `templates/next-app-auth`, `templates/next-monorepo`, `templates/backend-base` placeholder 추가
- `apps/docs`, `apps/playground` placeholder 추가
- 헤더 테마 버튼 왼쪽에 `ko / en` 언어 토글 추가
- 루트 라우트가 `NEXT_LOCALE` 쿠키를 직접 읽도록 locale resolver 추가
- sign-in success 문구를 번역 메시지로 이동
- `Vitest` alias 해석 보강 및 `language-toggle` unit test 추가
- `Playwright` 언어 토글 e2e 시나리오 추가 및 통과 확인

## 2026-04-23 Monorepo Step

- 루트를 `npm workspaces` 기반 monorepo orchestration 패키지로 전환
- 메인 앱을 `frontend/apps/kmsf`로 이동
- `frontend/packages/charts`, `frontend/packages/data-table`, `frontend/packages/gridstack` workspace 추가
- package name을 각각 `@kmsf/charts`, `@kmsf/data-table`, `@kmsf/gridstack`로 설정
- `backend` workspace placeholder 추가
- 루트 `README.md`와 `AGENTS.md`를 monorepo 기준으로 재작성
- root `dev` 스크립트의 인자 전달 방식 수정
- root `verify`와 root `dev` + 브라우저 smoke check로 workspace 위임 동작 확인

## 2026-04-23

- `AGENTS.md` 계층을 루트, `src`, `src/components/auth`, `tests` 기준으로 재구성
- `docs/codex`를 운영 문서 중심 구조로 전면 개편
- 기존 템플릿 설계 문서를 `docs/codex/reference/`로 분리
- repo-local skill `kmsf-delivery` 추가
- `Vitest`와 `Playwright` 실행 경계를 분리
- `README.md`에 새 검증 경로와 브라우저 확인 절차 추가
- `playwright.config.ts` 추가 및 `verify` 스크립트 신설
- 브라우저 smoke check 결과와 샌드박스 네트워크 제약을 보고 체계에 반영
