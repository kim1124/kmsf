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

async function expectCanvasPainted(page: Page) {
  await expect
    .poll(async () =>
      page.locator("canvas").first().evaluate((element) => {
        const canvas = element as HTMLCanvasElement;

        if (canvas.width === 0 || canvas.height === 0) {
          return false;
        }

        const blank = document.createElement("canvas");
        blank.width = canvas.width;
        blank.height = canvas.height;

        return canvas.toDataURL("image/png") !== blank.toDataURL("image/png");
      }),
    )
    .toBe(true);
}

async function expectSelectedChartCanvasLayers(page: Page, type: string) {
  await expectChartCanvasLayers(selectedChartCards(page, type), type);
}

async function expectNoLoadingSkeleton(page: Page) {
  await expect(page.getByTestId("chart-loading-skeleton")).toHaveCount(0);
}

function chartButton(page: Page, name: string) {
  return page.getByRole("button", { name: new RegExp(`^${name}\\b`) });
}

async function openDocsPanel(page: Page) {
  const docsPanel = page.getByRole("complementary", { name: "차트 문서" });

  if (await docsPanel.isVisible().catch(() => false)) {
    return docsPanel;
  }

  await page.getByRole("button", { name: "문서" }).click();
  await expect(docsPanel).toBeVisible();

  return docsPanel;
}

async function closeOverlayDocsPanel(page: Page) {
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 1000 }).catch(() => undefined);
}

test("example page renders docs shell with collapsible chart navigation", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "@kmsf/charts" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "차트 종류" })).toBeVisible();
  await expect(page.getByRole("main", { name: "차트 예제" })).toBeVisible();
  await expect(page.getByTestId(/chart-example-card-line-/)).toHaveCount(3);
  const firstCard = page.getByTestId("chart-example-card-line-static-basic");
  await expect(firstCard.getByTestId("sample-data")).toBeVisible();
  await firstCard.getByRole("tab", { name: "Usage" }).click();
  await expect(firstCard.getByTestId("sample-code")).toBeVisible();

  await page.getByRole("button", { name: "차트 목록 접기" }).click();
  await expect(page.getByRole("button", { name: "차트 목록 펼치기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "line 차트 선택" })).toBeVisible();
  await expect(page.locator(".chart-aside")).not.toContainText("Charts");

  await page.getByRole("button", { name: "차트 목록 펼치기" }).click();
  await expect(chartButton(page, "line")).toBeVisible();

  const docsPanel = await openDocsPanel(page);
  await expect(docsPanel.getByPlaceholder("옵션 또는 기능 검색")).toBeVisible();
  await expect(docsPanel.getByRole("heading", { name: "필수 설정" })).toBeVisible();

  await closeOverlayDocsPanel(page);
  await expectSelectedChartCanvasLayers(page, "line");
  const canvases = page.getByRole("main", { name: "차트 예제" }).locator("canvas");

  const box = await canvases.first().boundingBox();
  expect(box?.width).toBeGreaterThan(100);
  expect(box?.height).toBeGreaterThan(100);
  await expectCanvasPainted(page);
  await expectNoLoadingSkeleton(page);

  expect(diagnostics).toEqual([]);
});

test("example docs distinguish KMSF props from chart-specific ECharts settings", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await chartButton(page, "pie").click();
  let docsPanel = await openDocsPanel(page);
  await expect(docsPanel.getByRole("heading", { name: "필수 설정" })).toBeVisible();
  await expect(docsPanel).toContainText("type: pie");
  await expect(docsPanel).toContainText("data");
  await expect(docsPanel.getByRole("heading", { name: "Recommended Props" })).toBeVisible();
  await expect(docsPanel.getByRole("heading", { name: "Required ECharts Settings" })).toHaveCount(0);
  await expect(docsPanel.getByRole("link", { name: "series-pie" })).toHaveAttribute(
    "href",
    "https://echarts.apache.org/en/option.html#series-pie",
  );

  await closeOverlayDocsPanel(page);
  await chartButton(page, "radar").click();
  docsPanel = await openDocsPanel(page);
  await expect(docsPanel.getByRole("heading", { name: "필수 설정" })).toBeVisible();
  await expect(docsPanel).toContainText("options.radar.indicator");
  await expect(docsPanel.getByRole("link", { name: "radar", exact: true })).toHaveAttribute(
    "href",
    "https://echarts.apache.org/en/option.html#radar",
  );
  await expect(docsPanel.getByRole("link", { name: "series-radar" })).toHaveAttribute(
    "href",
    "https://echarts.apache.org/en/option.html#series-radar",
  );

  expect(diagnostics).toEqual([]);
});

test("type playground preserves data and remounts chart type", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await page.getByRole("tab", { name: "Type Playground" }).click();
  await page.getByLabel("Chart type").selectOption("pie");
  await expect(page.getByTestId("type-playground-data")).toContainText("Alpha");

  await page.getByLabel("Chart type").selectOption("sankey");
  await expect(page.getByText("Sankey requires series links.")).toBeVisible();
  await expect(page.getByTestId("type-playground-data")).toContainText("Alpha");
  expect(diagnostics).toEqual([
    {
      text: "[KMSF Charts] Sankey requires series links.",
      type: "error",
    },
  ]);
});

test("large data examples render from a separate menu without diagnostics", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await page.getByRole("tab", { name: "Large Data" }).click();
  await expect(page.getByRole("main", { name: "대용량 데이터 테스트" })).toBeVisible();
  await expect(page.getByTestId("large-data-card-line")).toContainText("10,000");
  await expect(page.getByTestId("large-data-card-bar")).toContainText("1,000");
  await expect(page.getByTestId("large-data-summary")).toContainText("line: 10000");
  await expectCanvasPainted(page);
  await expectNoLoadingSkeleton(page);

  expect(diagnostics).toEqual([]);
});

test("example menu switches charts and docs search filters options", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  const chartButtons = ["line", "bar", "pie", "scatter", "sankey", "graph", "gauge", "wordCloud"];

  for (const name of chartButtons) {
    await chartButton(page, name).click();
    await expect(page.getByTestId(new RegExp(`chart-example-card-${name}-`))).toHaveCount(3);
    await expectSelectedChartCanvasLayers(page, name);
    await expectCanvasPainted(page);
    await expectNoLoadingSkeleton(page);
  }

  await chartButton(page, "line").click();
  const trendData = page.getByTestId("chart-example-card-line-live-update").getByTestId("sample-data");
  const trendBefore = await trendData.textContent();
  await page.waitForTimeout(1300);
  await expect(trendData).not.toHaveText(trendBefore ?? "");

  await chartButton(page, "bar").click();
  const topData = page.getByTestId("chart-example-card-bar-live-update").getByTestId("sample-data");
  const topBefore = await topData.textContent();
  await page.waitForTimeout(10300);
  await expect(topData).not.toHaveText(topBefore ?? "");

  const docsPanel = await openDocsPanel(page);
  const docsSearch = docsPanel.getByPlaceholder("옵션 또는 기능 검색");
  await docsSearch.fill("seriesOptions");
  await expect(docsPanel).toContainText("seriesOptions");
  await docsSearch.fill("존재하지않는검색어");
  await expect(docsPanel).toContainText("검색 결과가 없습니다.");

  expect(diagnostics).toEqual([]);
});

test("heatmap live example updates on the slow example clock", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await chartButton(page, "heatmap").click();
  await expectSelectedChartCanvasLayers(page, "heatmap");

  const liveData = page.getByTestId("chart-example-card-heatmap-live-update").getByTestId("sample-data");
  const before = await liveData.textContent();

  await page.waitForTimeout(10_300);
  await expect(liveData).not.toHaveText(before ?? "");

  expect(diagnostics).toEqual([]);
});

test("all supported chart types render examples or prepared advanced cards without diagnostics", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  const types = [
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
    "map",
    "lines",
    "graph",
    "boxplot",
    "parallel",
    "gauge",
    "funnel",
    "sankey",
    "themeRiver",
    "pictorialBar",
    "custom",
    "wordCloud",
  ];

  await page.goto("/");

  for (const type of types) {
    await chartButton(page, type).click();

    if (type === "map" || type === "custom") {
      await expect(page.getByTestId(new RegExp(`chart-example-card-${type}-`))).toHaveCount(1);
      await expect(page.getByTestId(new RegExp(`chart-example-card-${type}-`))).toContainText("준비");
      continue;
    }

    const cards = page.getByTestId(new RegExp(`chart-example-card-${type}-`));
    await expect(cards).toHaveCount(3);
    await expectChartCanvasLayers(cards, type);
    await expectNoLoadingSkeleton(page);
  }

  expect(diagnostics).toEqual([]);
});

test("wordCloud skeleton clears after extension registration without diagnostics", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await chartButton(page, "wordCloud").click();
  await expect(page.getByTestId(new RegExp("chart-example-card-wordCloud-"))).toHaveCount(3);
  await expectSelectedChartCanvasLayers(page, "wordCloud");
  await expectCanvasPainted(page);
  await expectNoLoadingSkeleton(page);

  expect(diagnostics).toEqual([]);
});

test("option controls update chart option summary without browser errors", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  const firstCard = page.getByTestId("chart-example-card-line-static-basic");
  await firstCard.getByRole("tab", { name: "Options" }).click();
  const optionSummary = firstCard.getByTestId("option-summary");
  const before = await optionSummary.textContent();

  await firstCard.getByRole("button", { name: "범례 토글" }).click();
  await expect(optionSummary).not.toHaveText(before ?? "");

  await firstCard.getByRole("button", { name: "색상 변경" }).click();
  await expect(optionSummary).toContainText("themeOverrides");
  await expect(optionSummary).toContainText("#84cc16");
  await expectCanvasPainted(page);
  await expectNoLoadingSkeleton(page);

  expect(diagnostics).toEqual([]);
});

test("chart canvas resizes to the available content area", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.goto("/");

  const stage = page.getByTestId("chart-example-card-line-static-basic").getByTestId("chart-stage");
  const canvas = page.locator("canvas").first();
  await expect(stage).toHaveCSS("height", "360px");
  await expect(canvas).toBeVisible();

  const stageBox = await stage.boundingBox();
  const canvasBox = await canvas.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  expect(canvasBox!.width).toBeLessThanOrEqual(stageBox!.width + 1);
  expect(canvasBox!.height).toBeLessThanOrEqual(stageBox!.height + 1);
  expect(canvasBox!.y).toBeGreaterThanOrEqual(stageBox!.y);
  expect(canvasBox!.y + canvasBox!.height).toBeLessThanOrEqual(stageBox!.y + stageBox!.height + 1);
  expect(canvasBox!.height).toBeGreaterThan(300);

  await page.setViewportSize({ width: 900, height: 820 });
  await page.waitForTimeout(300);

  const resizedStageBox = await stage.boundingBox();
  const resizedCanvasBox = await canvas.boundingBox();
  expect(resizedStageBox).not.toBeNull();
  expect(resizedCanvasBox).not.toBeNull();
  expect(resizedCanvasBox!.width).toBeLessThanOrEqual(resizedStageBox!.width + 1);
  expect(resizedCanvasBox!.y + resizedCanvasBox!.height).toBeLessThanOrEqual(
    resizedStageBox!.y + resizedStageBox!.height + 1,
  );
  expect(resizedCanvasBox!.width).toBeLessThan(canvasBox!.width);
});

test("chart type changes remount content and docs while repeated selection is ignored", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await page.getByPlaceholder("예제 검색").fill("실시간");
  await page.getByRole("tab", { name: "Options" }).click();
  await page.getByLabel("옵션 JSON 편집").first().fill('{"notAllowed":true}');
  await expect(page.getByText("허용되지 않는 옵션입니다.")).toBeVisible();

  let docsPanel = await openDocsPanel(page);
  await docsPanel.getByPlaceholder("옵션 또는 기능 검색").fill("seriesOptions");
  await expect(docsPanel).toContainText("seriesOptions");
  const docsInOverlay = await page.getByRole("dialog").isVisible().catch(() => false);
  await closeOverlayDocsPanel(page);

  await chartButton(page, "line").click();
  await expect(page.getByPlaceholder("예제 검색")).toHaveValue("실시간");
  await expect(page.getByText("허용되지 않는 옵션입니다.")).toBeVisible();
  if (!docsInOverlay) {
    docsPanel = await openDocsPanel(page);
    await expect(docsPanel.getByPlaceholder("옵션 또는 기능 검색")).toHaveValue("seriesOptions");
  }
  await closeOverlayDocsPanel(page);

  await chartButton(page, "bar").click();

  await expect(page.getByPlaceholder("예제 검색")).toHaveValue("");
  await expect(page.getByText("허용되지 않는 옵션입니다.")).toHaveCount(0);
  docsPanel = await openDocsPanel(page);
  await expect(docsPanel.getByPlaceholder("옵션 또는 기능 검색")).toHaveValue("");
  await closeOverlayDocsPanel(page);
  await expectSelectedChartCanvasLayers(page, "bar");

  expect(diagnostics).toEqual([]);
});

test("example search filters cards within selected chart type", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await expect(page.getByTestId(/chart-example-card-/)).toHaveCount(3);
  await page.getByPlaceholder("예제 검색").fill("실시간");
  await expect(page.getByTestId(/chart-example-card-/)).toHaveCount(1);

  await chartButton(page, "bar").click();
  await expect(page.getByPlaceholder("예제 검색")).toHaveValue("");
  await expectSelectedChartCanvasLayers(page, "bar");

  expect(diagnostics).toEqual([]);
});

test("live series count control updates selected example without diagnostics", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  const liveCard = page.getByTestId("chart-example-card-line-live-update");
  const seriesInput = liveCard.getByLabel(/Series 개수/);
  await seriesInput.fill("7");
  await expect(seriesInput).toHaveValue("7");
  await expect(liveCard.getByTestId("series-count-summary")).toContainText("7");
  await expectCanvasPainted(page);

  await seriesInput.fill("99");
  await expect(seriesInput).toHaveValue("10");

  expect(diagnostics).toEqual([]);
});

test("gridstack page dynamically creates and removes chart widgets", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/#/gridstack");
  await expect(page.getByRole("heading", { name: "동적 차트 대시보드" })).toBeVisible();
  await expect(page.getByTestId("dashboard-grid")).toBeVisible();

  const canvas = page.locator("canvas");
  await expect(canvas).toHaveCount(2);

  await page.getByRole("button", { name: "차트 추가" }).click();
  await expect(canvas).toHaveCount(3);
  await expectCanvasPainted(page);

  await page.getByRole("button", { name: /Trend Line 삭제/ }).click();
  await expect(canvas).toHaveCount(2);

  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("button", { name: "차트 추가" }).click();
    await expect(canvas).toHaveCount(3);
    await page.locator(".kmsf-dashboard-widget__actions button[aria-label$='삭제']").last().click();
    await expect(canvas).toHaveCount(2);
  }

  await page.getByRole("button", { name: "전체 삭제" }).click();
  await expect(canvas).toHaveCount(0);

  expect(diagnostics).toEqual([]);
});

test("gridstack widgets resize without browser diagnostics", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/#/gridstack");
  const widget = page.getByTestId("dashboard-widget-trend-widget");
  await expect(widget).toBeVisible();

  const before = await widget.boundingBox();
  expect(before).not.toBeNull();

  const resizeHandle = widget.locator(".ui-resizable-handle").last();
  await widget.hover();
  await expect(resizeHandle).toBeAttached();
  const handleBox = await resizeHandle.boundingBox();
  expect(handleBox).not.toBeNull();

  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox!.x + 120, handleBox!.y + 90, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  const after = await widget.boundingBox();
  expect(after).not.toBeNull();
  expect(after!.width).toBeGreaterThan(before!.width);
  expect(after!.height).toBeGreaterThan(before!.height);
  expect(diagnostics).toEqual([]);
});

test("manual data refresh and live option validation are applied without browser diagnostics", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/");
  await chartButton(page, "bar").click();

  const firstCard = page.getByTestId("chart-example-card-bar-static-basic");
  const sampleData = firstCard.getByTestId("sample-data");
  const before = await sampleData.textContent();
  await firstCard.getByRole("button", { name: "전체 데이터 갱신" }).click();
  await expect(sampleData).not.toHaveText(before ?? "");

  await firstCard.getByRole("tab", { name: "Options" }).click();
  await firstCard.getByLabel("옵션 JSON 편집").fill('{"notAllowed":true}');
  await expect(firstCard.getByText("허용되지 않는 옵션입니다.")).toBeVisible();

  await firstCard.getByLabel("옵션 JSON 편집").fill('{"grid":{"top":48}}');
  await expect(firstCard.getByText("허용되지 않는 옵션입니다.")).toBeHidden();
  await expect(firstCard.getByTestId("option-summary")).toContainText('"top": 48');

  expect(diagnostics).toEqual([]);
});

test("invalid required chart config shows fallback without breaking the app", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/");
  await chartButton(page, "radar").click();

  const firstCard = page.getByTestId("chart-example-card-radar-static-basic");
  await firstCard.getByRole("tab", { name: "Options" }).click();
  await firstCard.getByLabel("옵션 JSON 편집").fill('{"radar":null}');

  await expect(firstCard.getByText("Radar requires options.radar.indicator.")).toBeVisible();
  await expect(page.getByRole("main", { name: "차트 예제" })).toBeVisible();
  expect(diagnostics).toEqual([
    {
      text: "[KMSF Charts] Radar requires options.radar.indicator.",
      type: "error",
    },
  ]);
});
