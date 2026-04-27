# KMSF Charts Consumer Usability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@kmsf/charts` easier for other React developers to import, understand, and render through stable aliases, data helpers, complete examples, and focused tests.

**Architecture:** Preserve existing component implementation and add a thin compatibility/public API layer. Keep data-shaping helpers in `src/common` and validate public API behavior with Vitest, while the Vite example remains the Playwright-rendered consumer contract.

**Tech Stack:** React, ECharts, TypeScript, Vite, Vitest, Playwright

---

### Task 1: Public API RED tests

**Files:**
- Create: `test/vitest/public-api.test.ts`

- [x] **Step 1: Add failing tests**

Write tests that import `GaugeChart`, `GuageChart`, `SunburstChart`, `SunbustChart`, `createTrendRows`, and `createTopRows` from `src/index.ts`.

- [x] **Step 2: Run focused test**

Run:

```bash
npm --workspace=@kmsf/charts run test:run -- test/vitest/public-api.test.ts
```

Expected: fail before implementation because new exports do not exist.

### Task 2: Public API implementation

**Files:**
- Create: `src/common/data-builders.ts`
- Modify: `src/index.ts`

- [x] **Step 1: Implement data helpers**

Add `createTrendRows` and `createTopRows`.

- [x] **Step 2: Add alias exports**

Export `GaugeChart`, `GaugeChartProps`, `SunburstChart`, and `SunburstChartProps` as aliases.

- [x] **Step 3: Run focused test**

Run:

```bash
npm --workspace=@kmsf/charts run test:run -- test/vitest/public-api.test.ts
```

Expected: pass.

### Task 3: Consumer example and docs

**Files:**
- Modify: `example/src/App.tsx`
- Modify: `test/playwright/specs/example.spec.ts`
- Modify: `README.md`
- Modify: `docs/03-component-api-draft.md`

- [x] **Step 1: Render all six charts in the example**

Use public aliases and helpers where possible.

- [x] **Step 2: Update Playwright expectation**

Expect 6 canvas elements and no browser console/page errors.

- [x] **Step 3: Document quick start**

Add import and minimal usage examples to README and API docs.

### Task 4: Verification and report

**Files:**
- Modify: `test/reports/2026-04-26.md`

- [x] **Step 1: Run package checks**

Run:

```bash
npm --workspace=@kmsf/charts run lint
npm --workspace=@kmsf/charts run test:run
npm --workspace=@kmsf/charts run build
npm --workspace=@kmsf/charts run test:e2e
```

- [x] **Step 2: Update daily report**

Record commands, results, and residual risks.
