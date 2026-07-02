# ECharts Official Examples Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `@kmsf/charts` playground examples with matching Apache ECharts official examples while keeping runtime public API behavior unchanged.

**Architecture:** Add example-only official fixture/config data and render it through the existing docs playground. Replace multi-field non-live Props editing with a single ECharts-like JSON config editor, while live cards keep generated data ownership and expose no data editing. Exclude `map` and `custom` examples from rendered/searchable examples until map registration and custom `renderItem` policy are decided.

**Tech Stack:** React, Vite, ECharts, `@kmsf/charts` `GenericChart`, Playwright, Vitest, package-local docs agent files.

---

## Confirmed Decisions

- `map` and `custom` are excluded from examples for this pass.
- Non-live examples use one editable JSON text area containing `type`, `dataFormat`, `data`, `options`, `series`, `seriesOptions`, and `colors`.
- Live examples do not allow data editing. Live generated data remains owned by the sample generator.
- Official examples that use external data are converted to deterministic local fixtures.
- Mixed-series official examples are placed in an `Advanced` section at the bottom.
- Runtime defaults and public API are not changed.
- `wordCloud` keeps the current example but refresh behavior must avoid abrupt visual interruption.
- One-hour soak is skipped; `verify:full` and focused Playwright/Vitest are required.

## File Map

- Create: `example/src/data/official-chart-fixtures.ts`
  - Owns deterministic ECharts-like fixture data/options/series for supported chart examples.
  - Excludes `map` and `custom`.
- Create: `example/src/components/ChartConfigEditor.tsx`
  - Owns the single JSON editor for non-live examples.
  - Renders live examples as generated-data locked, with no data editor.
- Modify: `example/src/data/chart-samples.ts`
  - Use official-like base fixtures for first/default samples.
  - Remove `map` and `custom` from rendered sample source.
  - Keep wordCloud sample and smooth its refresh config.
- Modify: `example/src/data/chart-examples.ts`
  - Make the first example per chart official-like.
  - Move mixed-series examples to an Advanced group at the bottom.
  - Mark live examples as data-edit locked.
- Modify: `example/src/components/ChartExampleCard.tsx`
  - Replace separate `data/options/series/seriesOptions/colors` textareas with `ChartConfigEditor`.
  - Keep invalid JSON/errors inside the card and prevent chart crash.
- Modify: `example/src/App.tsx`
  - Exclude `map` and `custom` routes/search/list entries from examples.
  - Render Advanced examples after normal chart examples.
- Modify: `example/src/docs/chart-docs.ts`
  - Remove `map/custom` example pages from generated docs navigation or mark them as unsupported only if docs routing needs a placeholder.
  - Add official example source links for matched chart types.
- Modify: `example/src/data/chart-search.ts`
  - Exclude `map/custom` from global search.
  - Include official-like example keywords.
- Test: `test/vitest/example-official-fixtures.test.ts`
  - Validates fixture coverage, excluded types, live edit lock, and advanced grouping.
- Test: `test/playwright/specs/official-examples.spec.ts`
  - Validates rendered official-like examples, single editor behavior, live data lock, no browser diagnostics.
- Modify existing tests where route/example counts currently assume `map/custom` placeholders.
- Update: `reports/2026-07-01.md`
  - Record commands, results, and residual risks.

## Task 1: Add RED Fixture Contract Tests

**Files:**
- Create: `test/vitest/example-official-fixtures.test.ts`
- Future implementation target: `example/src/data/official-chart-fixtures.ts`

- [ ] **Step 1: Write the failing Vitest file**

```ts
import { describe, expect, it } from "vitest";

import { officialChartFixtures, officialExcludedChartTypes } from "../../example/src/data/official-chart-fixtures";
import { supportedGenericChartTypes } from "../../src";

describe("official chart fixtures", () => {
  it("excludes map and custom from official playground examples", () => {
    expect(officialExcludedChartTypes).toEqual(["custom", "map"]);
    expect(officialChartFixtures.map((fixture) => fixture.type)).not.toContain("map");
    expect(officialChartFixtures.map((fixture) => fixture.type)).not.toContain("custom");
  });

  it("covers every supported rendered type except map and custom", () => {
    const expected = supportedGenericChartTypes.filter((type) => type !== "map" && type !== "custom");
    expect(officialChartFixtures.map((fixture) => fixture.type).sort()).toEqual([...expected].sort());
  });

  it("marks live fixtures as data-edit locked", () => {
    const liveFixtures = officialChartFixtures.filter((fixture) => fixture.live);
    expect(liveFixtures.length).toBeGreaterThan(0);
    expect(liveFixtures.every((fixture) => fixture.editableData === false)).toBe(true);
  });

  it("places mixed-series samples in the Advanced section", () => {
    const mixedFixtures = officialChartFixtures.filter((fixture) => fixture.mixedSeries);
    expect(mixedFixtures.length).toBeGreaterThan(0);
    expect(mixedFixtures.every((fixture) => fixture.section === "Advanced")).toBe(true);
  });
});
```

- [ ] **Step 2: Run RED test**

Run:

```bash
npm --workspace=@kmsf/charts run test:run -- test/vitest/example-official-fixtures.test.ts
```

Expected: FAIL because `example/src/data/official-chart-fixtures.ts` does not exist.

## Task 2: Add Official Fixture Module

**Files:**
- Create: `example/src/data/official-chart-fixtures.ts`

- [ ] **Step 1: Implement the fixture types and exported fixtures**

Create a module with this public shape:

```ts
import type { EChartsOption, SeriesOption } from "echarts";

import type { GenericChartDataFormat, KmsfChartType } from "../../../src";

export type OfficialFixtureSection = "Basic" | "Advanced";

export interface OfficialChartFixture {
  colors?: string[];
  data: unknown;
  dataFormat?: GenericChartDataFormat;
  editableData: boolean;
  live?: boolean;
  mixedSeries?: boolean;
  officialExampleId: string;
  officialUrl: string;
  options?: EChartsOption;
  section: OfficialFixtureSection;
  series?: SeriesOption[];
  seriesOptions?: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
  summary: string;
  title: string;
  type: Exclude<KmsfChartType, "custom" | "map">;
}

export const officialExcludedChartTypes = ["custom", "map"] as const;
```

Required fixture mapping:

```ts
const officialUrl = (id: string) => `https://echarts.apache.org/examples/en/editor.html?c=${id}`;
```

Minimum official IDs to include:

```ts
[
  "line-simple",
  "bar-simple",
  "pie-simple",
  "scatter-simple",
  "scatter-effect",
  "candlestick-simple",
  "radar",
  "heatmap-cartesian",
  "tree-basic",
  "treemap-simple",
  "sunburst-simple",
  "lines-airline",
  "graph-simple",
  "boxplot-light-velocity",
  "parallel-simple",
  "gauge-simple",
  "funnel",
  "sankey-simple",
  "themeRiver-basic",
  "pictorialBar-dotted",
]
```

Use deterministic local data. Do not add runtime fetches. For external-data official examples, use local reduced fixtures:

```ts
export const officialTreeData = [
  {
    name: "flare",
    children: [
      { name: "analytics", children: [{ name: "cluster", value: 3938 }, { name: "graph", value: 3812 }] },
      { name: "display", children: [{ name: "DirtySprite", value: 8833 }, { name: "LineSprite", value: 1732 }] },
    ],
  },
];

export const officialLinesData = [
  { coords: [[116.46, 39.92], [121.48, 31.22]] },
  { coords: [[116.46, 39.92], [113.23, 23.16]] },
  { coords: [[121.48, 31.22], [114.31, 30.52]] },
];
```

- [ ] **Step 2: Run fixture tests**

Run:

```bash
npm --workspace=@kmsf/charts run test:run -- test/vitest/example-official-fixtures.test.ts
```

Expected: PASS.

## Task 3: Wire Fixtures Into Chart Samples

**Files:**
- Modify: `example/src/data/chart-samples.ts`
- Modify: `example/src/data/chart-examples.ts`
- Modify tests that assume `map/custom` placeholders.

- [ ] **Step 1: Add RED tests for sample groups**

Modify `test/vitest/example-groups.test.ts` to assert:

```ts
expect(chartSamples.map((sample) => sample.type)).not.toContain("map");
expect(chartSamples.map((sample) => sample.type)).not.toContain("custom");
expect(chartExampleGroups.pictorialBar?.some((example) => example.tags.includes("Advanced"))).toBe(true);
```

Run:

```bash
npm --workspace=@kmsf/charts run test:run -- test/vitest/example-groups.test.ts
```

Expected: FAIL before implementation because existing samples still include placeholders or lack Advanced grouping.

- [ ] **Step 2: Use official fixtures in `chartSamples`**

Implementation rule:

```ts
import { officialChartFixtures } from "./official-chart-fixtures";

export const chartSamples: ChartSample[] = officialChartFixtures.map((fixture) => ({
  buildData: () => fixture.data,
  buildOptions: fixture.options ? () => fixture.options : undefined,
  buildSeries: fixture.series ? () => fixture.series : undefined,
  category: fixture.section === "Advanced" ? "Advanced" : inferExistingCategory(fixture.type),
  dataFormat: fixture.dataFormat,
  seriesOptions: fixture.seriesOptions,
  summary: fixture.summary,
  type: fixture.type,
}));
```

Keep existing helper generators only where live examples need dynamic data. Do not remove the live data builders.

- [ ] **Step 3: Advanced section placement**

In `chart-examples.ts`, sort examples so normal examples render first and mixed advanced examples render last:

```ts
function sortExamplesBySection(examples: ChartExampleDefinition[]) {
  return [...examples].sort((a, b) => Number(a.tags.includes("Advanced")) - Number(b.tags.includes("Advanced")));
}
```

- [ ] **Step 4: Run sample tests**

Run:

```bash
npm --workspace=@kmsf/charts run test:run -- test/vitest/example-groups.test.ts test/vitest/example-search.test.ts
```

Expected: PASS after updating route/search expectations.

## Task 4: Replace Multi-Field Props Editing With Single Config Editor

**Files:**
- Create: `example/src/components/ChartConfigEditor.tsx`
- Modify: `example/src/components/ChartExampleCard.tsx`

- [ ] **Step 1: Add RED Playwright coverage**

Create or modify `test/playwright/specs/official-examples.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("non-live example uses one editable chart config textarea", async ({ page }) => {
  await page.goto("/examples/pie");
  const card = page.getByTestId("chart-example-card").first();
  await card.getByRole("tab", { name: "Props" }).click();
  await expect(card.getByLabel("Chart config JSON")).toBeVisible();
  await expect(card.getByLabel("data JSON")).toHaveCount(0);
  await expect(card.getByLabel("options JSON")).toHaveCount(0);
});

test("live example locks data editing", async ({ page }) => {
  await page.goto("/examples/line#line-live-update");
  const card = page.locator("#line-live-update");
  await card.getByRole("tab", { name: "Props" }).click();
  await expect(card.getByText("실시간 데이터는 예제 생성기가 관리합니다.")).toBeVisible();
  await expect(card.getByLabel("Chart config JSON")).toHaveCount(0);
});
```

Run:

```bash
npm --workspace=@kmsf/charts run test:e2e -- test/playwright/specs/official-examples.spec.ts --project=chromium
```

Expected: FAIL before editor refactor.

- [ ] **Step 2: Implement `ChartConfigEditor`**

Use this interface:

```ts
import type { EChartsOption, SeriesOption } from "echarts";

import type { GenericChartDataFormat, KmsfChartType } from "../../../src";

export interface EditableChartConfig {
  colors?: string[];
  data: unknown;
  dataFormat?: GenericChartDataFormat;
  options?: EChartsOption;
  series?: SeriesOption[];
  seriesOptions?: Partial<SeriesOption> | Array<Partial<SeriesOption>>;
  type: KmsfChartType;
}

export interface ChartConfigEditorProps {
  config: EditableChartConfig;
  disabledReason?: string;
  onChange: (nextConfig: EditableChartConfig) => void;
  onError: (message: string) => void;
}
```

Behavior:
- One textarea label: `Chart config JSON`.
- Parse JSON on change.
- Reject if parsed value is not an object.
- Reject if `type` changes to `map` or `custom`.
- Reject if `data` is missing.
- Call `onChange` only on valid config.
- Call `onError("허용되지 않는 옵션입니다.")` for unsupported type or invalid object shape.

- [ ] **Step 3: Integrate in `ChartExampleCard`**

For non-live examples:

```tsx
<ChartConfigEditor
  config={editableConfig}
  onChange={setEditableConfig}
  onError={setValidationMessage}
/>
```

For live examples:

```tsx
<div role="note" className="chart-example-card__locked-editor">
  실시간 데이터는 예제 생성기가 관리합니다.
</div>
```

Do not render a data/config textarea for live examples.

- [ ] **Step 4: Run focused Playwright**

Run:

```bash
npm --workspace=@kmsf/charts run test:e2e -- test/playwright/specs/official-examples.spec.ts --project=chromium
```

Expected: PASS.

## Task 5: Exclude Map/Custom From Routes, Search, and Docs Navigation

**Files:**
- Modify: `example/src/App.tsx`
- Modify: `example/src/docs/chart-docs.ts`
- Modify: `example/src/data/chart-search.ts`
- Modify: `test/playwright/specs/docs-playground-routing.spec.ts`
- Modify: `test/playwright/specs/example.spec.ts`

- [ ] **Step 1: Add RED route/search checks**

Add tests:

```ts
test("map and custom example routes are not supported", async ({ page }) => {
  await page.goto("/examples/map");
  await expect(page.getByRole("heading", { name: "지원하지 않는 페이지입니다." })).toBeVisible();
  await page.goto("/examples/custom");
  await expect(page.getByRole("heading", { name: "지원하지 않는 페이지입니다." })).toBeVisible();
});

test("global search does not return map or custom examples", async ({ page }) => {
  await page.goto("/docs/getting-started");
  await page.getByLabel("문서 검색").fill("map");
  await expect(page.getByText("/examples/map")).toHaveCount(0);
  await page.getByLabel("문서 검색").fill("custom");
  await expect(page.getByText("/examples/custom")).toHaveCount(0);
});
```

Run:

```bash
npm --workspace=@kmsf/charts run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts --project=chromium
```

Expected: FAIL before route/search filtering.

- [ ] **Step 2: Filter pages and search data**

Use a single exclusion helper:

```ts
const excludedExampleTypes = new Set<KmsfChartType>(["custom", "map"]);

function isRenderableExampleType(type: KmsfChartType) {
  return !excludedExampleTypes.has(type);
}
```

Apply this helper when generating:
- `chartsDocsPages`
- left navigation entries
- chart search index
- chart type sample state options

- [ ] **Step 3: Run route/search tests**

Run:

```bash
npm --workspace=@kmsf/charts run test:e2e -- test/playwright/specs/docs-playground-routing.spec.ts test/playwright/specs/example.spec.ts --project=chromium
```

Expected: PASS.

## Task 6: Smooth WordCloud Refresh

**Files:**
- Modify: `example/src/data/chart-samples.ts`
- Modify: `example/src/data/chart-examples.ts`
- Modify: `test/vitest/example-groups.test.ts`

- [ ] **Step 1: Add RED unit assertion**

Add:

```ts
const wordCloud = chartSamples.find((sample) => sample.type === "wordCloud");
expect(wordCloud?.seriesOptions).toMatchObject({
  animationDurationUpdate: expect.any(Number),
  animationEasingUpdate: expect.any(String),
});
```

Run:

```bash
npm --workspace=@kmsf/charts run test:run -- test/vitest/example-groups.test.ts
```

Expected: FAIL until wordCloud seriesOptions include update animation defaults.

- [ ] **Step 2: Add smooth update defaults**

Set wordCloud series options:

```ts
seriesOptions: {
  animationDuration: 300,
  animationDurationUpdate: 700,
  animationEasingUpdate: "cubicOut",
  height: "88%",
  left: "4%",
  top: "6%",
  width: "92%",
}
```

- [ ] **Step 3: Run focused tests**

Run:

```bash
npm --workspace=@kmsf/charts run test:run -- test/vitest/example-groups.test.ts
```

Expected: PASS.

## Task 7: Update Docs and Usage Text

**Files:**
- Modify: `example/src/docs/chart-docs.ts`
- Modify: `example/src/data/chart-samples.ts`
- Modify: `example/src/data/chart-examples.ts`

- [ ] **Step 1: Add source links**

For each official-like sample, expose:

```ts
officialExampleId: "line-simple",
officialUrl: "https://echarts.apache.org/examples/en/editor.html?c=line-simple",
```

Docs should state:
- `map/custom` examples are excluded in this pass.
- `wordCloud` is extension-based and keeps the current KMSF sample.
- Native-required charts still require ECharts official option shapes.

- [ ] **Step 2: Update Usage generation**

For non-live official-like examples, Usage should show:

```tsx
<GenericChart
  type={config.type}
  data={config.data}
  dataFormat={config.dataFormat}
  options={config.options}
  series={config.series}
  seriesOptions={config.seriesOptions}
  colors={config.colors}
/>
```

For live examples, Usage should not show editable data.

- [ ] **Step 3: Run docs/search tests**

Run:

```bash
npm --workspace=@kmsf/charts run test:run -- test/vitest/example-search.test.ts
npm --workspace=@kmsf/charts run test:e2e -- test/playwright/specs/example.spec.ts --project=chromium
```

Expected: PASS.

## Task 8: Final Verification and Report

**Files:**
- Update: `reports/2026-07-01.md`

- [ ] **Step 1: Run package baseline**

Run:

```bash
npm --workspace=@kmsf/charts run verify
```

Expected: PASS.

- [ ] **Step 2: Run full browser gate**

Run:

```bash
npm --workspace=@kmsf/charts run verify:full
```

Expected: PASS. One-hour soak is intentionally skipped by supervisor decision.

- [ ] **Step 3: Run diff hygiene check**

Run:

```bash
git diff --check -- example/src test docs/agents/example reports/2026-07-01.md
```

Expected: PASS.

- [ ] **Step 4: Update report**

Append to `reports/2026-07-01.md`:
- timestamp
- summary
- changed files
- commands actually run
- pass/fail result
- residual risks

Residual risk to include:
- No one-hour soak was run by explicit decision.
- `map/custom` official examples remain excluded.
- Official external datasets were converted to reduced local fixtures, not copied as full datasets.

## Self Review

- Spec coverage: all seven supervisor answers are mapped to tasks.
- Placeholder scan: no unresolved implementation placeholders remain.
- Type consistency: `OfficialChartFixture`, `EditableChartConfig`, and `KmsfChartType` are used consistently across fixture, editor, and tests.
