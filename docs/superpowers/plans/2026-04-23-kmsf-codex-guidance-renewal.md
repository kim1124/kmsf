# KMSF Codex 지침 리뉴얼 구현 계획

> **Agent 작업자 필수 지침:** 이 계획은 task 단위로 실행한다. 필요한 경우 `superpowers:subagent-driven-development` 또는 `superpowers:executing-plans`를 사용한다. 진행 상태는 checkbox(`- [ ]`) 형식으로 추적한다.

**목표:** KMSF 저장소의 지침 체계를 공식 Codex `AGENTS.md` discovery 구조, 명확한 repo-scoped 규칙, 강한 검증 gate, browser-aware 완료 기준 중심으로 재구성한다.

**아키텍처:** 실행에 중요한 지침은 최소 AGENTS 계층으로 이동한다. `docs/codex`는 사람이 읽는 운영 참고 문서로 재작성한다. 반복 delivery workflow는 repo-scoped `kmsf-delivery` skill로 분리한다. Unit/e2e/browser 검증 경로를 나누어, 완료 판단이 설명이 아니라 실제 check 결과에 의존하도록 만든다.

**기술 스택:** Markdown, `AGENTS.md`, `.codex/skills` repo skill, Next.js 16, Vitest, Playwright, Codex browser/computer-use guidance.

---

### 작업 1: 승인된 설계와 기준 파일 기록

**파일:**
- 생성: `docs/superpowers/specs/2026-04-23-kmsf-codex-guidance-renewal-design.md`
- 생성: `docs/superpowers/plans/2026-04-23-kmsf-codex-guidance-renewal.md`
- 수정: `docs/reports/2026-04-22-codex-md-renewal-review.md`

- [ ] **단계 1: 설계 문서 저장**

승인된 설계를 spec 파일에 저장한다. 포함 항목:

```md
## 목적
## 배경과 핵심 판단
## 목표 상태
## 정보 구조 설계
## 개발 환경 재설정 설계
## 수용 기준
```

- [ ] **단계 2: 구현 계획 저장**

이 계획 파일에 정확한 task 범위와 검증 command를 기록한다.

- [ ] **단계 3: review report에 후속 산출물 링크 추가**

기존 report에 실행 spec과 plan이 생성되었음을 짧게 추가한다.

```md
## 후속 산출물

- `docs/superpowers/specs/2026-04-23-kmsf-codex-guidance-renewal-design.md`
- `docs/superpowers/plans/2026-04-23-kmsf-codex-guidance-renewal.md`
```

- [ ] **단계 4: 파일 존재 확인**

실행:

```bash
test -f docs/superpowers/specs/2026-04-23-kmsf-codex-guidance-renewal-design.md
test -f docs/superpowers/plans/2026-04-23-kmsf-codex-guidance-renewal.md
```

예상: 출력 없이 exit status 0.

### 작업 2: AGENTS 지침 계층 재구성

**파일:**
- 수정: `AGENTS.md`
- 생성: `apps/kmsf/src/AGENTS.md`
- 생성: `apps/kmsf/src/components/auth/AGENTS.override.md`
- 생성: `apps/kmsf/tests/AGENTS.md`

- [ ] **단계 1: 저장소 루트 AGENTS 재작성**

루트 파일에는 아래 내용을 포함한다.

```md
## Purpose
- This file is the repository-wide execution contract.

## Completion Gate
- Do not mark work complete if required tests fail.
- Do not mark work complete if browser verification shows visible UI errors or console errors.
- Report unrun checks as residual risk.

## Required Outputs
- Update `test-reports/YYYY-MM-DD.md`.
```

- [ ] **단계 2: `apps/kmsf/src/AGENTS.md` 추가**

구체적인 frontend 규칙을 포함한다.

```md
## UI Change Rules
- Prefer minimal edits over structural rewrites.
- When a form changes, verify submit trigger path, field error rendering, and loading state.
- Check `src/app`, `src/components`, and `src/lib` together when auth or layout behavior changes.
```

- [ ] **단계 3: `apps/kmsf/src/components/auth/AGENTS.override.md` 추가**

Auth form 전용 규칙을 포함한다.

```md
## Auth Form Rules
- Keep ID/PW UI rules aligned with Supabase-backed auth flow.
- Real-time validation must update while typing.
- Button semantics must keep explicit `type="submit"` for submit buttons.
- Do not complete work if sign-in/sign-up/initial-admin/profile flows have browser errors.
```

- [ ] **단계 4: `apps/kmsf/tests/AGENTS.md` 추가**

검증 routing을 포함한다.

```md
## Verification Matrix
- Use `npm run test:run` for unit tests.
- Use `npm run test:e2e` for Playwright scenarios.
- Use browser verification when a UI path or rendered state changed.
```

- [ ] **단계 5: AGENTS discovery layout 확인**

실행:

```bash
find . -name 'AGENTS.md' -o -name 'AGENTS.override.md' | sort
```

예상: root, app source, auth override, tests, package/example scope의 AGENTS 파일만 의도한 위치에 존재한다.

### 작업 3: `docs/codex`를 운영 문서로 재작성

**파일:**
- 수정: `docs/codex/README.md`
- 생성: `docs/codex/01-instruction-architecture.md`
- 생성: `docs/codex/02-style-and-auth-rules.md`
- 생성: `docs/codex/03-verification-and-browser-gate.md`
- 생성: `docs/codex/04-plugin-and-skill-strategy.md`
- 생성: `docs/codex/90-open-questions.md`

- [ ] **단계 1: docs/codex README를 index로 교체**

새 README는 아래를 설명한다.

```md
- AGENTS.md is the execution layer.
- docs/codex is the reference/operating layer.
- Use document X for instruction architecture.
- Use document Y for style/auth rules.
- Use document Z for verification and browser gating.
```

- [ ] **단계 2: instruction architecture 문서 추가**

Codex 지침 구조 mapping을 문서화한다.

```md
- Root `AGENTS.md`
- Nested `AGENTS.md` or `AGENTS.override.md`
- Repo skill under `.codex/skills`
- docs/codex as human-readable reference
```

- [ ] **단계 3: style/auth rules 문서 추가**

Gemini식 실행 규칙을 명령형 문장으로 전환한다.

```md
### Must
### 금지
### 예외
### 먼저 확인할 파일
```

- [ ] **단계 4: verification/browser gate 문서 추가**

아래 내용을 문서화한다.

```md
- lint/unit/build/e2e/browser verification matrix
- completion-blocking browser error policy
- preferred browser verification order
```

- [ ] **단계 5: plugin/skill strategy 문서 추가**

아래 내용을 설명한다.

```md
- when to use Superpowers
- when to use repo skill
- when browser/computer-use checks are needed
- when Notion could be used later for external reporting
```

- [ ] **단계 6: open question 통합**

확정되지 않은 사항은 `docs/codex/90-open-questions.md`로 이동해 runtime 규칙과 섞이지 않게 한다.

- [ ] **단계 7: docs/codex inventory 확인**

실행:

```bash
find docs/codex -maxdepth 1 -type f | sort
```

예상: README와 신규 operating docs, 필요한 reference docs만 남는다.

### 작업 4: Repo-scoped `kmsf-delivery` skill 추가

**파일:**
- 생성: `.codex/skills/kmsf-delivery/SKILL.md`

- [ ] **단계 1: skill definition 작성**

`SKILL.md`에는 frontmatter와 trigger boundary를 포함한다.

```md
---
name: kmsf-delivery
description: Use for kmsf repository changes that affect UI, auth, docs, or delivery verification. Do not use for unrelated repos.
---
```

- [ ] **단계 2: workflow 지침 작성**

포함 항목:

```md
- Check AGENTS hierarchy first.
- For UI/auth changes, inspect `src/app`, `src/components/auth`, and `src/lib`.
- Run lint + relevant tests + build.
- Run browser verification for rendered changes.
- Update reporting docs before completion.
```

- [ ] **단계 3: skill path 확인**

실행:

```bash
test -f .codex/skills/kmsf-delivery/SKILL.md
```

예상: exit status 0.

### 작업 5: 검증 script와 test boundary 재구성

**파일:**
- 수정: `package.json`
- 수정: `vitest.config.ts`
- 생성: `playwright.config.ts`

- [ ] **단계 1: package script 재작성**

아래 구조로 script를 추가하거나 수정한다.

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint .",
    "test": "vitest",
    "test:run": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "verify": "npm run lint && npm run test:run && npm run build"
  }
}
```

- [ ] **단계 2: Vitest에서 e2e spec 제외**

`vitest.config.ts`에 exclusion을 추가한다.

```ts
test: {
  environment: "jsdom",
  globals: true,
  setupFiles: ["./src/test/setup.ts"],
  exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
}
```

- [ ] **단계 3: Playwright config 추가**

`playwright.config.ts`에 최소 설정을 둔다.

```ts
testDir: "./tests/e2e"
use: {
  baseURL: "http://127.0.0.1:3000",
  trace: "on-first-retry",
}
```

Sandbox에서 `webServer`가 안정적일 때만 포함한다. 불안정하면 manual startup을 주석이나 문서로 남긴다.

- [ ] **단계 4: unit test routing 확인**

실행:

```bash
npm run test:run
```

예상: Playwright `test()` registration error 없이 unit test만 실행된다.

### 작업 6: 보고 구조와 browser verification guidance 추가

**파일:**
- 생성 또는 수정: `test-reports/YYYY-MM-DD.md`
- 수정: `.gitignore`
- 수정: `README.md`

- [ ] **단계 1: daily report 형식 확정**

`test-reports/YYYY-MM-DD.md`에는 아래 항목을 남긴다.

```md
## HH:mm KST - 작업 제목
- 작업 요약
- 변경 파일
- 검증
- 결과
- 잔여 이슈
```

- [ ] **단계 2: local browser artifact ignore 추가**

필요한 경우 아래 항목을 추가한다.

```gitignore
.superpowers/
playwright-report/
test-results/
```

- [ ] **단계 3: README 업데이트**

새 검증 command와 AGENTS/repo skill 지침 존재를 문서화한다.

- [ ] **단계 4: report 파일 확인**

실행:

```bash
test -f test-reports/$(date +%F).md
```

예상: exit status 0.

### 작업 7: 검증 실행과 잔여 리스크 정리

**파일:**
- 수정: `test-reports/YYYY-MM-DD.md`

- [ ] **단계 1: 저장소 검증 실행**

실행:

```bash
npm run lint
npm run test:run
npm run build
```

예상:

- lint 통과 또는 알려진 warning만 남고 report에 기록
- unit test 통과
- build 성공

- [ ] **단계 2: 가능한 경우 browser-aware 검증 실행**

권장 순서:

```bash
npm run dev
agent-browser open http://127.0.0.1:3000
agent-browser wait --load networkidle
agent-browser snapshot -i
```

Sandbox나 환경 제한으로 막히면 정확한 blocker를 기록하고 browser verification을 통과했다고 말하지 않는다.

- [ ] **단계 3: report에 실제 결과 기록**

아래 내용을 기록한다.

```md
- Actual commands run
- Pass/fail state
- Browser verification status
- Residual risk
```

- [ ] **단계 4: 최종 consistency check**

실행:

```bash
git diff --stat
```

예상: 변경 범위가 지침, 문서, skill, 검증 설정에 맞게 제한되어 있다.
