# Autonomous Dashboard Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** React 소비자가 자율형 대시보드 위젯을 CRUD, 이동, 크기 조절, 자동 정렬, 최대화, 최소화, 컬럼 변경할 수 있는 `@kmsf/gridstack` 패키지를 구현한다.

**Architecture:** React public API는 GridStack을 직접 노출하지 않고, 순수 상태 계층과 GridStack adapter 계층을 분리한다. 성능 민감 경로인 drag/resize는 adapter에서 imperative하게 처리하고, React 상태 반영은 commit 시점 또는 animation frame으로 제한한다.

**Tech Stack:** React, TypeScript, Vite, Vitest, Playwright, GridStack

---

## File Map

- Create: `src/core/types.ts` for serializable layout and widget contracts.
- Create: `src/core/columns.ts` for `1..12` column helpers.
- Create: `src/core/layout-state.ts` for CRUD, maximize, minimize, restore, and snapshot reducers.
- Create: `src/core/resize-scheduler.ts` for animation-frame resize scheduling.
- Create: `src/gridstack/adapter.ts` for GridStack lifecycle and command mapping.
- Create: `src/gridstack/option-mapper.ts` for package options to GridStack options.
- Create: `src/components/DashboardGrid.tsx` for the public grid component.
- Create: `src/components/DashboardWidget.tsx` for widget shell rendering.
- Modify: `src/index.ts` for public exports.
- Test: `test/vitest/*.test.ts` for pure helpers and option mapping.
- Test: `test/playwright/specs/*.spec.ts` for rendered interactions.

### Task 1: Column Contract

**Files:**
- Create: `src/core/columns.ts`
- Create: `test/vitest/columns.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { clampDashboardColumnCount } from "../../src";

describe("clampDashboardColumnCount", () => {
  it("clamps runtime column values to the supported 1..12 range", () => {
    expect(clampDashboardColumnCount(-1)).toBe(1);
    expect(clampDashboardColumnCount(0)).toBe(1);
    expect(clampDashboardColumnCount(6)).toBe(6);
    expect(clampDashboardColumnCount(12)).toBe(12);
    expect(clampDashboardColumnCount(13)).toBe(12);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- test/vitest/columns.test.ts`

Expected: FAIL because `clampDashboardColumnCount` is not exported.

- [ ] **Step 3: Write minimal implementation**

```ts
export type DashboardColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export const DASHBOARD_COLUMN_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function clampDashboardColumnCount(value: number): DashboardColumnCount {
  if (value < 1) return 1;
  if (value > 12) return 12;
  return Math.round(value) as DashboardColumnCount;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- test/vitest/columns.test.ts`

Expected: PASS.

### Task 2: Layout State Reducer

**Files:**
- Create: `src/core/layout-state.ts`
- Create: `test/vitest/layout-state.test.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write tests for widget CRUD and snapshot serialization**

```ts
import { createDashboardLayoutState, addDashboardWidget, removeDashboardWidget, serializeDashboardLayout } from "../../src";

describe("dashboard layout state", () => {
  it("adds and removes widgets while preserving serializable layout state", () => {
    const state = createDashboardLayoutState({ columns: 6, widgets: [] });
    const withWidget = addDashboardWidget(state, {
      id: "sales",
      layout: { id: "sales", x: 0, y: 0, w: 2, h: 2 },
    });
    const withoutWidget = removeDashboardWidget(withWidget, "sales");

    expect(serializeDashboardLayout(withWidget)).toEqual({
      columns: 6,
      widgets: [{ id: "sales", x: 0, y: 0, w: 2, h: 2 }],
    });
    expect(serializeDashboardLayout(withoutWidget)).toEqual({ columns: 6, widgets: [] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- test/vitest/layout-state.test.ts`

Expected: FAIL because state helpers are not exported.

- [ ] **Step 3: Implement only the tested state helpers**

Implement `createDashboardLayoutState`, `addDashboardWidget`, `removeDashboardWidget`, and `serializeDashboardLayout` with shallow copies of the changed arrays only.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- test/vitest/layout-state.test.ts`

Expected: PASS.

### Task 3: GridStack Adapter Lifecycle

**Files:**
- Create: `src/gridstack/adapter.ts`
- Create: `src/gridstack/option-mapper.ts`
- Create: `test/vitest/option-mapper.test.ts`

- [ ] **Step 1: Write option mapping tests**

```ts
import { mapDashboardGridOptions } from "../../src/gridstack/option-mapper";

describe("mapDashboardGridOptions", () => {
  it("maps editing flags and columns to GridStack options", () => {
    expect(mapDashboardGridOptions({ columns: 4, editable: false })).toMatchObject({
      column: 4,
      disableDrag: true,
      disableResize: true,
    });
    expect(mapDashboardGridOptions({ columns: 13, editable: true, movable: false, resizable: true })).toMatchObject({
      column: 12,
      disableDrag: true,
      disableResize: false,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- test/vitest/option-mapper.test.ts`

Expected: FAIL because mapper is not implemented.

- [ ] **Step 3: Implement minimal mapper**

Map only `column`, `disableDrag`, and `disableResize` first.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- test/vitest/option-mapper.test.ts`

Expected: PASS.

### Task 4: React Dashboard Grid

**Files:**
- Create: `src/components/DashboardGrid.tsx`
- Create: `src/components/DashboardWidget.tsx`
- Create: `test/playwright/specs/dashboard-grid.spec.ts`
- Modify: `example/src/App.tsx`

- [ ] **Step 1: Write Playwright render test**

```ts
import { expect, test } from "@playwright/test";

test("renders dashboard widgets in the example page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "@kmsf/gridstack" })).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-sales")).toBeVisible();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- test/playwright/specs/dashboard-grid.spec.ts`

Expected: FAIL because package component is not wired into the example.

- [ ] **Step 3: Implement minimal rendered grid**

Render stable widget wrappers with `data-testid` attributes and initialize GridStack in a `useEffect`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- test/playwright/specs/dashboard-grid.spec.ts`

Expected: PASS.

### Task 5: Verification And Report

**Files:**
- Modify: `test/reports/YYYY-MM-DD.md`

- [ ] **Step 1: Run package baseline**

Run:

```bash
npm run lint
npm run test:run
npm run build
npm run verify
```

Expected: all commands PASS.

- [ ] **Step 2: Run browser baseline when UI changed**

Run:

```bash
npm run test:e2e
```

Expected: PASS or documented environment blocker.

- [ ] **Step 3: Update report**

Record timestamp, summary, changed files, commands, result, and residual risks in `test/reports/YYYY-MM-DD.md`.
