# KMSF Charts Example Usability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the `@kmsf/charts` example into a mixed practical/API guide and fix live chart behavior so all charts resize, update, and render correctly.

**Architecture:** Keep chart library components reusable and framework-neutral, while the Vite example owns demo-specific timers and sample state. Add small option helpers where behavior must be shared or tested, and verify rendered behavior with Playwright.

**Tech Stack:** React, ECharts, TypeScript, Vite, Vitest, Playwright

---

### Task 1: Lock option behavior with tests

**Files:**
- Modify: `test/vitest/options.test.ts`
- Modify: `src/common/options.ts`
- Modify: `src/components/TrendChart/TrendChart.tsx`
- Modify: `src/components/TopChart/TopChart.tsx`

- [x] **Step 1: Write RED tests for Trend dataZoom and Top label rotation**

Run:

```bash
npm --workspace=@kmsf/charts run test:run -- test/vitest/options.test.ts
```

Expected: fail before helper implementation.

- [x] **Step 2: Implement option helpers**

Add `buildTrendDataZoom` and `shouldRotateCategoryLabels`.

- [x] **Step 3: Add Trend live animation default test and implementation**

Add a test that Trend live defaults disable update interpolation, then implement the option.

### Task 2: Rebuild example structure

**Files:**
- Modify: `example/src/App.tsx`
- Modify: `example/src/styles.css`

- [x] **Step 1: Use header/sidebar/stage layout**

Render a top title, left chart menu and sample data, and a 500px central stage.

- [x] **Step 2: Use full data replacement for realtime examples**

Use state ticks and builder functions that return new arrays instead of mutating existing arrays.

- [x] **Step 3: Improve sample panel**

Show sample data and basic usage code for the selected chart.

### Task 3: Browser verification

**Files:**
- Modify: `test/playwright/specs/example.spec.ts`

- [x] **Step 1: Add RED test for canvas overflow**

Confirm canvas bottom does not exceed stage bottom.

- [x] **Step 2: Fix chart viewport layout**

Use a flex child `.chart-viewport` and pass `height="100%"` to charts.

- [x] **Step 3: Add richer checks**

Verify all menu charts render, sample data changes on intervals, and resize remains valid.

### Task 4: Final verification and reporting

**Files:**
- Modify: `test/reports/2026-04-26.md`

- [x] **Step 1: Run verification commands**

Run:

```bash
npm --workspace=@kmsf/charts run lint
npm --workspace=@kmsf/charts run test:run
npm --workspace=@kmsf/charts run build
npm --workspace=@kmsf/charts run test:e2e
npm --workspace=@kmsf/charts run verify
```

- [x] **Step 2: Update daily report**

Record commands, RED evidence, results, and residual risks.
