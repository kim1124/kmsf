# KMSF Charts Package Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the initial `@kmsf/charts` package structure, documentation, and verification contract before chart component implementation.

**Architecture:** Keep this package framework-agnostic by exposing React components only, isolate ECharts lifecycle logic under `src/common`, and validate pure data/option helpers with Vitest while validating rendered behavior with Playwright.

**Tech Stack:** React, ECharts, TypeScript, Vite, Vitest, Playwright, Day.js, echarts-wordcloud

---

### Task 1: Confirm package boundary

**Files:**
- Read: `package.json`
- Read: `src/index.ts`
- Create: `AGENTS.md`

- [x] **Step 1: Inspect current package files**

Run:

```bash
find . -maxdepth 3 -type f | sort
```

Expected: current package files are limited enough to scaffold safely.

- [x] **Step 2: Add package-local execution contract**

Create `AGENTS.md` with React-only, ECharts-only, package-local testing, and reporting rules.

### Task 2: Add build and test configuration

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`

- [x] **Step 1: Add package scripts**

Add scripts for `dev`, `build`, `typecheck`, `lint`, `test`, `test:run`, `test:e2e`, and `verify`.

- [x] **Step 2: Add TypeScript config**

Use strict TypeScript settings and `react-jsx`.

- [x] **Step 3: Add Vite library config**

Use `src/index.ts` as the library entry and externalize React, React DOM, ECharts, Day.js, and `echarts-wordcloud`.

- [x] **Step 4: Add Vitest and Playwright config**

Keep Vitest focused on helpers and Playwright focused on browser rendering.

### Task 3: Add documentation drafts

**Files:**
- Create: `README.md`
- Create: `docs/README.md`
- Create: `docs/01-requirements.md`
- Create: `docs/02-architecture.md`
- Create: `docs/03-component-api-draft.md`
- Create: `docs/04-verification-strategy.md`
- Create: `docs/05-open-questions.md`

- [x] **Step 1: Document package purpose**

Write the package README with target components and local commands.

- [x] **Step 2: Capture requirements**

Convert the request into package-level requirements.

- [x] **Step 3: Draft API and architecture**

Record common props, component-specific props, and planned source responsibilities.

- [x] **Step 4: Record verification policy**

Split Vitest, Playwright, build, and browser gates.

### Task 4: Add directory markers

**Files:**
- Create: `src/common/README.md`
- Create: `src/components/README.md`
- Create: component README files
- Create: `example/README.md`
- Create: `test/README.md`
- Create: `test/vitest/README.md`
- Create: `test/playwright/README.md`
- Create: `test/playwright/specs/README.md`
- Create: `test/reports/2026-04-25.md`

- [x] **Step 1: Add source directory notes**

Add README files that state each directory responsibility without adding behavior.

- [x] **Step 2: Add test directory notes**

Add package-local test artifact directories and report file.

### Task 5: Verify scaffold

**Files:**
- Read: package tree
- Run: package lint/test/build where possible

- [x] **Step 1: Verify file tree**

Run:

```bash
find . -maxdepth 4 -type f | sort
```

Expected: scaffold files exist under package-local paths.

- [x] **Step 2: Run lightweight validation**

Run:

```bash
npm --workspace=@kmsf/charts run lint
npm --workspace=@kmsf/charts run test:run
npm --workspace=@kmsf/charts run build
```

Expected: pass if dependencies are installed. If dependencies are missing because lockfile was intentionally not updated, record the blocker in `test/reports/2026-04-25.md`.
