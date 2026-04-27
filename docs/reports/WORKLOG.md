# WORKLOG

## 2026-04-23 01:41

- 작업 요약
  - Google Fonts 의존성을 제거
  - 한글/영문 공용 시스템 폰트 스택으로 교체
  - 폰트 스택 상수를 분리하고 테스트 추가
- 변경 파일
  - `examples/basic-dashboard/src/app/layout.tsx`
  - `examples/basic-dashboard/src/lib/theme/font-stacks.ts`
  - `examples/basic-dashboard/src/lib/theme/font-stacks.test.ts`
- 검증
  - `npm run lint`
  - `npm run test:run`
  - `npm run build`
  - `npx playwright test tests/e2e/language-toggle.spec.ts --config=playwright.config.ts`
- 결과
  - `next/font/google` 제거 완료
  - 한글/영문 화면을 시스템 폰트 기준으로 렌더링
  - build가 sandbox에서도 외부 Google Fonts fetch 없이 통과
  - Playwright 브라우저 검증 통과
- 잔여 이슈
  - 시스템 폰트 기반이므로 OS별 미세한 자간과 굵기 차이는 남을 수 있음

## 2026-04-23 01:37

- 작업 요약
  - 저장소를 `1안` 기준의 CLI·템플릿 지향 구조로 재편
  - 현재 Next.js 앱을 `examples/basic-dashboard` 예제 앱으로 이동
  - `packages/create-kmsf`, `packages/generator-core`, `templates/*`, `apps/*` placeholder 추가
  - 대시보드 헤더에 `ko / en` 언어 토글 추가
  - 루트 라우트가 `NEXT_LOCALE` 쿠키를 직접 반영하도록 locale resolver 추가
  - 언어 토글에 대한 unit test와 Playwright e2e 검증 추가
- 변경 파일
  - `package.json`
  - `package-lock.json`
  - `README.md`
  - `AGENTS.md`
  - `.codex/skills/kmsf-delivery/SKILL.md`
  - `docs/codex/01-instruction-architecture.md`
  - `docs/codex/02-style-and-auth-rules.md`
  - `examples/basic-dashboard/**`
  - `packages/create-kmsf/**`
  - `packages/generator-core/**`
  - `templates/**`
  - `apps/**`
- 검증
  - `npm install`
  - `npm run lint`
  - `npm run test:run`
  - `npm run build`
  - `npx playwright test tests/e2e/language-toggle.spec.ts --config=playwright.config.ts`
- 결과
  - 루트 스크립트가 `examples/basic-dashboard`로 정상 위임됨
  - `1안` 기준 디렉터리 구조 반영 완료
  - `ko / en` 버튼 클릭 시 같은 경로(`/dashboard`)를 유지한 채 대시보드 문구가 즉시 전환됨
  - `lint`, `unit test`, `build`, Playwright e2e 모두 통과
- 잔여 이슈
  - `npm run verify`는 sandbox에서 Google Fonts 네트워크 제한이 걸릴 수 있어, 최종 build는 권한 상향으로 확인함
  - 루트와 `[locale]` 경로가 병존하는 구조는 유지 중이며, 향후 라우팅 단일화는 별도 작업으로 분리하는 편이 안전함

## 2026-04-23 01:05

- 작업 요약
  - 저장소를 `npm workspaces` 기반 모노레포로 재구성
  - 메인 앱을 `frontend/apps/kmsf`로 이동
  - 공용 React 패키지 placeholder를 `frontend/packages/*`에 추가
  - backend workspace placeholder를 추가
  - 루트 스크립트를 workspace 위임 방식으로 정리
- 변경 파일
  - `package.json`
  - `package-lock.json`
  - `README.md`
  - `AGENTS.md`
  - `frontend/apps/kmsf/**`
  - `frontend/packages/charts/**`
  - `frontend/packages/data-table/**`
  - `frontend/packages/gridstack/**`
  - `backend/**`
- 검증
  - `npm install`
  - `npm run verify`
  - `npm run dev -- --hostname 127.0.0.1 --port 3000`
  - Playwright 기반 브라우저 smoke check
- 결과
  - root workspace 스크립트에서 `frontend/apps/kmsf`로 정상 위임 확인
  - `npm run verify`: 통과
  - 브라우저 smoke check: `http://127.0.0.1:3000/sign-in` 로드, console error 없음
- 잔여 이슈
  - `frontend/packages/*`와 `backend`는 현재 placeholder 상태이며, 실제 구현은 후속 작업 필요
  - 일부 기존 문서는 pre-monorepo 기준 경로 예시를 포함할 수 있어 후속 정리가 필요

## 2026-04-23 00:21

- 작업 요약
  - `kmsf` 저장소의 Codex 지침 체계를 공식 AGENTS 계층 중심으로 재구성
  - `docs/codex`를 운영 문서 구조로 전면 개편
  - repo-local skill, 테스트 스크립트, 브라우저 검증 기준 정비
- 변경 파일
  - `AGENTS.md`
  - `src/AGENTS.md`
  - `src/components/auth/AGENTS.override.md`
  - `tests/AGENTS.md`
  - `docs/codex/*`
  - `.codex/skills/kmsf-delivery/SKILL.md`
  - `package.json`
  - `vitest.config.ts`
  - `playwright.config.ts`
  - `.gitignore`
  - `README.md`
- 검증
  - `npm run lint`
  - `npm run test:run`
  - `PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test --list`
  - `npm run build`
  - `npm run dev -- --hostname 127.0.0.1 --port 3000`
  - Playwright 기반 브라우저 smoke check
  - `npm run verify`
- 결과
  - `npm run lint`: 통과
  - `npm run test:run`: 통과
  - Playwright 목록 확인: `tests/e2e/supabase-auth.spec.ts` 1건 인식
  - `npm run build`: 통과
  - 브라우저 smoke check: `http://127.0.0.1:3000/sign-in` 로드, console error 없음
  - `npm run verify`: 샌드박스 내 빌드는 Google Fonts 네트워크 제한으로 실패, 권한 상향 재실행에서는 통과
- 잔여 이슈
  - `agent-browser` 실행 파일은 현재 셸에 없어, 브라우저 검증 기본 경로는 Codex app browser, computer use, Playwright headed 중심으로 정리함
