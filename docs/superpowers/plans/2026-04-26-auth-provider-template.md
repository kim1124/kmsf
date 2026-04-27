# 인증 Provider 템플릿 구현 계획

> **Agent 작업자 필수 지침:** 이 계획은 task 단위로 실행한다. 필요한 경우 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`를 사용한다. 진행 상태는 checkbox(`- [ ]`) 형식으로 추적한다.

**목표:** local-json을 테스트 전용 인증에서 명시적인 starter provider 옵션으로 승격하고, Supabase Google OAuth 및 local DB 커스터마이징 방법을 문서화한다.

**아키텍처:** Supabase를 기본 provider로 유지한다. `KMSF_AUTH_PROVIDER=local-json`이면 모든 환경에서 local provider를 선택한다. 런타임 DB와 secret은 계속 ignore하면서 문서와 복사 가능한 DB 예시를 추가한다.

**기술 스택:** Next.js App Router, Vitest, Playwright, Markdown 문서, Node local JSON auth provider.

---

### 작업 1: Provider 선택 정책

**파일:**
- 수정: `apps/kmsf/src/lib/auth/providers/auth-provider.ts`
- 수정: `apps/kmsf/src/lib/auth/providers/auth-provider.test.ts`

- [ ] `NODE_ENV=production`에서도 `KMSF_AUTH_PROVIDER=local-json`이면 local-json이 선택됨을 증명하는 실패 테스트를 작성한다.
- [ ] focused test를 실행해 RED를 확인한다.
- [ ] provider selection 구현을 수정한다.
- [ ] focused test를 다시 실행해 GREEN을 확인한다.

### 작업 2: 인증 가이드와 템플릿 예시

**파일:**
- 생성: `docs/auth-guide.md`
- 수정: `README.md`
- 수정: `templates/next-app-auth/README.md`
- 생성: `templates/next-app-auth/.local/auth.db.example.json`

- [ ] 실제 credential 없이 Supabase Google OAuth 설정 가이드를 추가한다.
- [ ] local-json provider 설정 및 커스터마이징 가이드를 추가한다.
- [ ] 빈 `accounts` 배열을 가진 템플릿 DB 예시를 추가한다.
- [ ] 루트 README와 템플릿 README에서 가이드를 연결한다.

### 작업 3: 검증과 보고

**파일:**
- 수정: `test-reports/2026-04-26.md`

- [ ] Run `npm run lint`.
- [ ] Run `npm run test:run`.
- [ ] Run `npm run build`.
- [ ] local-json e2e를 실행한다.
- [ ] 결과와 잔여 리스크를 기록한다.
