import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

import { expectChartCanvasLayers, selectedChartCards } from "./canvas-layers";

function collectBrowserDiagnostics(page: Page) {
  const diagnostics: Array<{ text: string; type: ReturnType<ConsoleMessage["type"]> | "pageerror" }> = [];

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      diagnostics.push({ text: message.text(), type: message.type() });
    }
  });

  page.on("pageerror", (error) => {
    diagnostics.push({ text: error.message, type: "pageerror" });
  });

  return diagnostics;
}

async function expectNoLoadingSkeleton(page: Page) {
  await expect(page.getByTestId("chart-loading-skeleton")).toHaveCount(0);
}

test("chart docs page renders examples, highlighted usage, editable props, and canvases", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/examples/line");

  await expect(page.locator("body")).toHaveCSS("font-size", "12px");
  await expect(page.locator("body")).toHaveCSS("font-family", /Spoqa Han Sans Neo/);
  await expect(page.getByRole("banner")).toContainText("@kmsf/charts");
  await expect(page.getByRole("navigation", { name: "문서 메뉴" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "차트 예제" })).toHaveCount(0);
  await expect(page.getByRole("banner").getByRole("textbox", { exact: true, name: "전체 차트 검색" })).toBeVisible();
  await expect(page.getByRole("banner").getByLabel("playground status")).toHaveCount(0);
  await expect(page.locator(".chart-example-main").getByRole("textbox", { exact: true, name: "전체 차트 검색" })).toHaveCount(0);

  const topNavBox = await page.getByRole("banner").boundingBox();
  const topSearchBox = await page.getByRole("banner").getByRole("textbox", { exact: true, name: "전체 차트 검색" }).boundingBox();
  const topSearchContainer = page.getByRole("banner").locator(".example-search");
  const topSearchContainerBox = await topSearchContainer.boundingBox();
  expect(topNavBox).not.toBeNull();
  expect(topSearchBox).not.toBeNull();
  expect(topSearchContainerBox).not.toBeNull();
  expect(topSearchBox!.x).toBeGreaterThanOrEqual(topNavBox!.x);
  expect(topSearchBox!.x + topSearchBox!.width).toBeLessThanOrEqual(topNavBox!.x + topNavBox!.width);
  expect(topSearchContainerBox!.y).toBeGreaterThanOrEqual(topNavBox!.y);
  expect(topSearchContainerBox!.y + topSearchContainerBox!.height).toBeLessThanOrEqual(topNavBox!.y + topNavBox!.height);
  const topSearchRightGap = Math.round(topNavBox!.x + topNavBox!.width - (topSearchContainerBox!.x + topSearchContainerBox!.width));
  expect(topSearchRightGap).toBeGreaterThanOrEqual(14);
  expect(topSearchRightGap).toBeLessThanOrEqual(16);
  await expect(topSearchContainer).toHaveCSS("border-top-width", "0px");
  await expect(topSearchContainer).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(page.getByRole("banner").getByRole("textbox", { exact: true, name: "전체 차트 검색" })).toHaveCSS("border-top-width", "1px");

  const firstCard = page.getByTestId("chart-example-card-line-static-basic");
  await expect(firstCard).toBeVisible();
  await expect(firstCard.getByRole("tab", { name: "Usage" })).toBeVisible();
  await expect(firstCard.getByTestId("sample-code").locator(".docs-code__pre")).toBeVisible();

  await firstCard.getByRole("tab", { name: "Data" }).click();
  await expect(firstCard.getByRole("textbox", { exact: true, name: "Chart config JSON" })).toBeVisible();
  await expect(firstCard.getByRole("textbox", { exact: true, name: "data JSON" })).toHaveCount(0);
  await expect(firstCard.getByRole("textbox", { exact: true, name: "options JSON" })).toHaveCount(0);
  await expect(firstCard.getByRole("textbox", { exact: true, name: "colors JSON" })).toHaveCount(0);
  await expect(firstCard.getByRole("textbox", { exact: true, name: "series JSON" })).toHaveCount(0);
  await expect(firstCard.getByRole("textbox", { exact: true, name: "seriesOptions JSON" })).toHaveCount(0);
  await expect(firstCard.getByTestId("sample-data")).toHaveCount(0);
  await expect(firstCard.getByTestId("option-summary")).toHaveCount(0);
  await expect(firstCard.getByText("색상 변경")).toHaveCount(0);
  await expect(firstCard.locator(".color-picker-control")).toHaveCount(0);

  await expectChartCanvasLayers(selectedChartCards(page, "line"), "line");
  await expectNoLoadingSkeleton(page);
  expect(diagnostics).toEqual([]);
});

test("all implemented chart type pages render stable chart canvases without diagnostics", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  const implementedTypes = [
    "line",
    "bar",
    "pie",
    "scatter",
    "effectScatter",
    "candlestick",
    "radar",
    "heatmap",
    "tree",
    "treemap",
    "sunburst",
    "lines",
    "graph",
    "boxplot",
    "parallel",
    "gauge",
    "funnel",
    "sankey",
    "themeRiver",
    "pictorialBar",
    "wordCloud",
  ];

  for (const type of implementedTypes) {
    await page.goto(`/examples/${type}`);
    await expect(page.getByTestId(new RegExp(`chart-example-card-${type}-`)).first()).toBeVisible();
    await expectChartCanvasLayers(selectedChartCards(page, type), type);
  }

  await expectNoLoadingSkeleton(page);
  expect(diagnostics).toEqual([]);
});

test("excluded advanced chart pages return the 404 page", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  for (const type of ["custom", "map"]) {
    await page.goto(`/examples/${type}`);
    await expect(page.getByRole("heading", { name: "지원하지 않는 페이지입니다." })).toBeVisible();
  }

  expect(diagnostics).toEqual([]);
});

test("props editor applies valid data and reports invalid JSON without browser diagnostics", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/examples/bar");
  const firstCard = page.getByTestId("chart-example-card-bar-static-basic");
  await firstCard.getByRole("tab", { name: "Data" }).click();
  const editor = firstCard.getByRole("textbox", { exact: true, name: "Chart config JSON" });
  const config = JSON.parse(await editor.inputValue()) as Record<string, unknown>;

  await editor.fill(
    JSON.stringify(
      {
        ...config,
        colors: ["#10b981", "#047857"],
        data: [
          ["Manual A", 240],
          ["Manual B", 120],
        ],
      },
      null,
      2,
    ),
  );
  await expect(editor).toHaveValue(/Manual A/);
  await expect(editor).toHaveValue(/#10b981/);

  await editor.fill("{");
  await expect(firstCard.getByRole("alert")).toContainText("JSON 형식이 올바르지 않습니다.");
  await expectChartCanvasLayers(selectedChartCards(page, "bar"), "bar");
  expect(diagnostics).toEqual([]);
});

test("global search navigates to the chart type page and focuses the selected example", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/examples/line");
  const topSearch = page.getByRole("banner").getByPlaceholder("전체 차트 검색");
  await topSearch.fill("radar 실시간");
  await expect(page.getByRole("listbox", { name: "전체 차트 검색 결과" })).toBeVisible();
  await page.getByRole("option", { name: /radar \/ 실시간 갱신/ }).click();

  await expect(page).toHaveURL(/\/examples\/radar#radar-live-update$/);
  await expect(page.getByTestId("chart-example-card-radar-live-update")).toBeInViewport();
  await expectChartCanvasLayers(selectedChartCards(page, "radar"), "radar");
  expect(diagnostics).toEqual([]);
});

test("dashboard integration creates, removes, and resizes chart widgets without diagnostics", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/examples/dashboard-integration");
  await expect(page.getByRole("heading", { name: "동적 차트 대시보드" })).toBeVisible();
  await expect(page.getByTestId("dashboard-grid")).toBeVisible();

  const initialCount = await page.locator(".grid-stack-item").count();
  await page.getByRole("button", { name: "차트 추가" }).click();
  await expect(page.getByRole("dialog", { name: "차트 위젯 추가" })).toBeVisible();
  await page.getByRole("button", { name: "위젯 생성" }).click();
  await expect(page.locator(".grid-stack-item")).toHaveCount(initialCount + 1);

  const widget = page.getByTestId("dashboard-widget-trend-widget");
  await expect(widget).toBeVisible();
  await widget.hover();
  const before = await widget.boundingBox();
  const handle = widget.locator(".ui-resizable-se").first();
  await expect(handle).toBeVisible();
  const handleBox = await handle.boundingBox();
  expect(before).not.toBeNull();
  expect(handleBox).not.toBeNull();

  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox!.x + 90, handleBox!.y + 60, { steps: 6 });
  await page.mouse.up();

  const after = await widget.boundingBox();
  expect(after).not.toBeNull();
  expect(after!.width).toBeGreaterThan(before!.width);

  await page.locator(".grid-stack-item").nth(initialCount).getByRole("button", { name: "삭제" }).click();
  await expect(page.locator(".grid-stack-item")).toHaveCount(initialCount);
  expect(diagnostics).toEqual([]);
});
