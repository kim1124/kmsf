# 인증 Provider 확장 구현 계획

> **Agent 작업자 필수 지침:** 이 계획은 task 단위로 실행한다. 필요한 경우 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`를 사용한다. 진행 상태는 checkbox(`- [ ]`) 형식으로 추적한다.

**목표:** Supabase 인증과 Google OAuth를 주요 경로로 유지하면서, local JSON provider를 통해 ID/PW 인증을 추가한다.

**아키텍처:** Supabase Auth를 기본 provider로 유지한다. `KMSF_AUTH_PROVIDER=local-json`으로 선택되는 server-only `local-json` provider를 추가하고, `apps/kmsf/.local/auth.db.json`을 backing store로 사용한다. Local session cookie는 server-side에서 resolve한다.

**기술 스택:** Next.js App Router, Server Actions, Vitest, Node `fs/promises`, Node `crypto.scrypt`, Supabase SSR.

---

### 작업 1: Provider 선택과 Local Store

**파일:**
- 생성: `apps/kmsf/src/lib/auth/providers/auth-provider.ts`
- 생성: `apps/kmsf/src/lib/auth/providers/local-json-auth-store.ts`
- 테스트: `apps/kmsf/src/lib/auth/providers/local-json-auth-store.test.ts`
- 테스트: `apps/kmsf/src/lib/auth/providers/auth-provider.test.ts`
- 수정: `.gitignore`

- [ ] **단계 1: 실패하는 local store test 작성**

계정 생성, duplicate rejection, username/email password verification, wrong password rejection, deletion, provider selection을 다룬다.

- [ ] **단계 2: focused test를 실행하고 RED 확인**

실행:

```bash
npm --workspace=apps/kmsf run test:run -- src/lib/auth/providers/local-json-auth-store.test.ts src/lib/auth/providers/auth-provider.test.ts
```

예상: provider module이 아직 없어서 실패한다.

- [ ] **단계 3: 최소 provider selection과 local store 구현**

`scrypt`, random salt, atomic JSON read/write, test용 `KMSF_LOCAL_AUTH_DB_PATH` override를 사용한다.

- [ ] **단계 4: focused test를 다시 실행하고 GREEN 확인**

같은 focused command를 실행하고 통과를 확인한다.

### 작업 2: Local Session과 Current User

**파일:**
- 생성: `apps/kmsf/src/lib/auth/local-session.server.ts`
- 수정: `apps/kmsf/src/lib/auth/session.ts`
- 테스트: `apps/kmsf/src/lib/auth/local-session.server.test.ts`

- [ ] **단계 1: 실패하는 session test 작성**

Signed local session cookie value의 parse/verify와 tamper rejection을 server-side user lookup과 함께 검증한다.

- [ ] **단계 2: focused test를 실행하고 RED 확인**

실행:

```bash
npm --workspace=apps/kmsf run test:run -- src/lib/auth/local-session.server.test.ts
```

예상: local session module이 아직 없어서 실패한다.

- [ ] **단계 3: local session helper 구현 및 `getCurrentUser()` 조정**

local-json이 enabled이면 local session cookie를 읽고 local store에서 user를 resolve한다. 그 외에는 Supabase 동작을 유지한다.

- [ ] **단계 4: focused test를 다시 실행하고 GREEN 확인**

같은 focused command를 실행하고 통과를 확인한다.

### 작업 3: Server Action과 Route 연결

**파일:**
- 수정: `apps/kmsf/src/app/[locale]/(public)/sign-in/actions.ts`
- 수정: `apps/kmsf/src/app/[locale]/(public)/sign-in/page.tsx`
- 수정: `apps/kmsf/src/app/[locale]/(public)/sign-up/page.tsx`
- 수정: `apps/kmsf/src/app/[locale]/(protected)/layout.tsx`
- 수정: `apps/kmsf/src/app/[locale]/(protected)/actions.ts`
- 수정: `apps/kmsf/messages/ko.json`
- 수정: `apps/kmsf/messages/en.json`

- [ ] **단계 1: 가능한 범위에서 실패하는 action test 작성**

넓은 Server Action mock은 피하고, local sign-in/sign-up 동작은 focused provider-level test를 우선한다.

- [ ] **단계 2: 기존 action에 local-json 연결**

Local mode는 sign-up, sign-in, sign-out, delete account, protected layout, settings auth mode display를 지원한다. Supabase와 Google action은 기존 동작을 유지한다.

- [ ] **단계 3: focused test와 기본 검증 실행**

`npm run lint`, `npm run test:run`, `npm run build`를 실행한다.

### 작업 4: Browser/E2E 검증과 보고

**파일:**
- 수정: `test-reports/2026-04-25.md`

- [ ] **단계 1: auth flow에 대한 browser 또는 e2e 검증 실행**

환경이 허용하면 `npm run test:e2e` 또는 browser verification을 사용한다.

- [ ] **단계 2: daily report 업데이트**

실행한 command, 결과, blocker, residual risk를 기록한다.
