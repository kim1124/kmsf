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

async function expectChartCanvasesWithinStages(page: Page, type: string) {
  const failures = await page.getByTestId(new RegExp(`chart-example-card-${type}-`)).evaluateAll((cards) =>
    cards.flatMap((card) => {
      const cardElement = card as HTMLElement;
      const stage = cardElement.querySelector<HTMLElement>('[data-testid="chart-stage"]');
      const canvases = Array.from(cardElement.querySelectorAll("canvas")) as HTMLCanvasElement[];

      if (!stage) {
        return [`${cardElement.dataset.testid ?? type}: missing chart stage`];
      }

      const stageBox = stage.getBoundingClientRect();

      return canvases.flatMap((canvas, index) => {
        const canvasBox = canvas.getBoundingClientRect();
        const outside =
          canvasBox.left < stageBox.left - 1 ||
          canvasBox.top < stageBox.top - 1 ||
          canvasBox.right > stageBox.right + 1 ||
          canvasBox.bottom > stageBox.bottom + 1;

        return outside ? [`${cardElement.dataset.testid ?? type}: canvas ${index} is outside chart stage`] : [];
      });
    }),
  );

  expect(failures).toEqual([]);
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

  await expect(page.locator("body")).toHaveCSS("font-size", "12px");
  await expect(page.locator("body")).toHaveCSS("font-family", /Spoqa Han Sans Neo/);
  await expect(page.getByRole("heading", { name: "@kmsf/charts" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "차트 종류" })).toBeVisible();
  await expect(page.getByRole("main", { name: "차트 예제" })).toBeVisible();
  await expect(page.getByTestId(/chart-example-card-line-/)).toHaveCount(5);
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

test("topbar tabs and chart navigation stay fixed while examples scroll", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.setViewportSize({ width: 1440, height: 820 });
  await page.goto("/");

  const topbar = page.locator(".example-topbar");
  const tabsBar = page.locator(".workspace-tabs__bar");
  const chartAside = page.locator(".chart-aside");
  const menuScroll = page.locator(".chart-menu-scroll");

  const before = {
    aside: await chartAside.boundingBox(),
    tabs: await tabsBar.boundingBox(),
    topbar: await topbar.boundingBox(),
  };

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(100);

  await expect(page.getByRole("heading", { name: "@kmsf/charts" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Chart Examples" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "차트 종류" })).toBeVisible();

  const after = {
    aside: await chartAside.boundingBox(),
    tabs: await tabsBar.boundingBox(),
    topbar: await topbar.boundingBox(),
  };

  expect(after.topbar).not.toBeNull();
  expect(after.tabs).not.toBeNull();
  expect(after.aside).not.toBeNull();
  expect(before.topbar).not.toBeNull();
  expect(before.tabs).not.toBeNull();
  expect(before.aside).not.toBeNull();
  expect(Math.abs(after.topbar!.y - before.topbar!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.tabs!.y - before.tabs!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.aside!.y - before.aside!.y)).toBeLessThanOrEqual(1);
  await expect(menuScroll).toHaveCSS("overflow", /hidden|auto/);
  expect(diagnostics).toEqual([]);
});

test("chart menu navigation uses URL routes and direct example routes scroll to the target card", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/#/charts/radar/examples/radar-live-update");
  await expect(page).toHaveURL(/#\/charts\/radar\/examples\/radar-live-update/);
  await expect(page.getByRole("heading", { name: "@kmsf/charts" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "차트 종류" })).toBeVisible();
  await expect(chartButton(page, "radar")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("chart-example-card-radar-live-update")).toBeInViewport();

  await chartButton(page, "heatmap").click();
  await expect(page).toHaveURL(/#\/charts\/heatmap$/);
  await expect(page.getByTestId("chart-example-card-radar-live-update")).toHaveCount(0);
  await expect(page.getByTestId("chart-example-card-heatmap-static-basic")).toBeVisible();

  expect(diagnostics).toEqual([]);
});

test("unsupported chart routes show 404 and invalid example routes redirect to line", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/#/charts/map");
  await expect(page.getByRole("heading", { name: "지원하지 않는 페이지입니다." })).toBeVisible();

  await page.goto("/#/charts/line/examples/not-found-example");
  await expect(page).toHaveURL(/#\/charts\/line$/);
  await expect(page.getByTestId("chart-example-card-line-static-basic")).toBeVisible();

  expect(diagnostics).toEqual([]);
});

test("global search popup navigates by URL without creating inactive charts", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/#/charts/line");
  await page.getByPlaceholder("전체 차트 검색").fill("visualMap");
  await expect(page.getByRole("listbox", { name: "전체 차트 검색 결과" })).toBeVisible();
  await expect(page.getByRole("option", { name: /heatmap 옵션/ })).toBeVisible();
  await expect(page.getByTestId(/chart-example-card-heatmap-/)).toHaveCount(0);

  await page.getByRole("option", { name: /heatmap 옵션/ }).click();
  await expect(page).toHaveURL(/#\/charts\/heatmap/);
  await expect(page.getByTestId("chart-example-card-heatmap-static-basic")).toBeVisible();
  await expect(page.getByRole("listbox", { name: "전체 차트 검색 결과" })).toHaveCount(0);

  expect(diagnostics).toEqual([]);
});

test("docs search is scoped to the active chart document", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/#/charts/line");
  const docsPanel = await openDocsPanel(page);
  await docsPanel.getByPlaceholder("옵션 또는 기능 검색").fill("visualMap");
  await expect(docsPanel.getByText("검색된 결과가 없습니다.")).toBeVisible();

  await page.goto("/#/charts/heatmap");
  await expect(page).toHaveURL(/#\/charts\/heatmap$/);
  await expect(page.getByTestId("chart-example-card-heatmap-static-basic")).toBeVisible();
  const heatmapDocs = await openDocsPanel(page);
  await heatmapDocs.getByPlaceholder("옵션 또는 기능 검색").fill("visualMap");
  await expect(heatmapDocs.getByRole("listbox", { name: "현재 차트 문서 검색 결과" })).toBeVisible();
  await heatmapDocs.getByRole("option", { name: /options\.visualMap/ }).click();
  await expect(heatmapDocs.getByTestId(/doc-block-heatmap-/).filter({ hasText: "visualMap" }).first()).toBeInViewport();

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
    await expect(page.getByTestId(new RegExp(`chart-example-card-${name}-`))).toHaveCount(5);
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
  await page.waitForTimeout(5300);
  await expect(topData).not.toHaveText(topBefore ?? "");

  const docsPanel = await openDocsPanel(page);
  const docsSearch = docsPanel.getByPlaceholder("옵션 또는 기능 검색");
  await docsSearch.fill("seriesOptions");
  await expect(docsPanel).toContainText("seriesOptions");
  await docsSearch.fill("존재하지않는검색어");
  await expect(docsPanel).toContainText("검색된 결과가 없습니다.");

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

  await page.goto("/");

  for (const type of types) {
    await chartButton(page, type).click();

    const cards = page.getByTestId(new RegExp(`chart-example-card-${type}-`));
    await expect(cards).toHaveCount(5);
    await expectChartCanvasLayers(cards, type);
    await expectChartCanvasesWithinStages(page, type);
    await expectNoLoadingSkeleton(page);
  }

  expect(diagnostics).toEqual([]);
});

test("wordCloud skeleton clears after extension registration without diagnostics", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await chartButton(page, "wordCloud").click();
  await expect(page.getByTestId(new RegExp("chart-example-card-wordCloud-"))).toHaveCount(5);
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
  await expect(optionSummary).toContainText("#047857");
  await expectCanvasPainted(page);
  await expectNoLoadingSkeleton(page);

  expect(diagnostics).toEqual([]);
});

test("example legend defaults match chart behavior and allow data legend opt-in", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await chartButton(page, "bar").click();
  const barCard = page.getByTestId("chart-example-card-bar-static-basic");
  await barCard.getByRole("tab", { name: "Options" }).click();
  await expect(barCard.getByTestId("option-summary")).toContainText('"legend": false');

  await chartButton(page, "heatmap").click();
  const heatmapCard = page.getByTestId("chart-example-card-heatmap-static-basic");
  await heatmapCard.getByRole("tab", { name: "Options" }).click();
  await expect(heatmapCard.getByTestId("option-summary")).toContainText('"legend": false');

  await chartButton(page, "pie").click();
  const pieCard = page.getByTestId("chart-example-card-pie-static-basic");
  await pieCard.getByRole("tab", { name: "Options" }).click();
  await expect(pieCard.getByTestId("option-summary")).toContainText('"legend": true');
  await expectSelectedChartCanvasLayers(page, "pie");

  expect(diagnostics).toEqual([]);
});

test("selected examples expose three-series live data without diagnostics", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  for (const type of ["scatter", "effectScatter", "tree", "sankey", "parallel", "radar"]) {
    await chartButton(page, type).click();
    const liveCard = page.getByTestId(`chart-example-card-${type}-live-update`);
    await expect(liveCard.getByTestId("series-count-summary")).toContainText("3");
    await expectSelectedChartCanvasLayers(page, type);
  }

  expect(diagnostics).toEqual([]);
});

test("line live and single-series examples expose polished playground contracts", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  const lineLiveCard = page.getByTestId("chart-example-card-line-live-update");
  const lineSummary = JSON.parse((await lineLiveCard.getByTestId("sample-data").textContent()) ?? "{}") as {
    data?: unknown[];
    seriesCount?: number;
  };
  expect(lineSummary.seriesCount).toBe(3);
  expect(lineSummary.data).toHaveLength(60);

  await chartButton(page, "pie").click();
  const pieCard = page.getByTestId("chart-example-card-pie-static-basic");
  await pieCard.getByRole("tab", { name: "Options" }).click();
  await expect(pieCard.getByTestId("option-summary")).toContainText('"legend": true');
  await expect(pieCard.getByTestId("option-summary")).toContainText('"show": false');

  for (const type of ["treemap", "gauge", "funnel", "wordCloud", "sunburst", "themeRiver"]) {
    await chartButton(page, type).click();
    await expect(page.getByTestId(new RegExp(`chart-example-card-${type}-`)).getByLabel(/Series 개수/)).toHaveCount(0);
    await expectSelectedChartCanvasLayers(page, type);
  }

  expect(diagnostics).toEqual([]);
});

test("complex examples refresh richer data without browser diagnostics", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  for (const type of ["tree", "graph", "sankey", "themeRiver"]) {
    await chartButton(page, type).click();
    const firstCard = page.getByTestId(`chart-example-card-${type}-static-basic`);
    const sampleData = firstCard.getByTestId("sample-data");
    const before = await sampleData.textContent();

    await firstCard.getByRole("button", { name: "전체 데이터 갱신" }).click();
    await expect(sampleData).not.toHaveText(before ?? "");
    await expectSelectedChartCanvasLayers(page, type);
  }

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

  const firstCard = page.getByTestId("chart-example-card-line-static-basic");
  await firstCard.getByRole("tab", { name: "Options" }).click();
  await firstCard.getByLabel("옵션 JSON 편집").fill('{"notAllowed":true}');
  await expect(page.getByText("허용되지 않는 옵션입니다.")).toBeVisible();

  let docsPanel = await openDocsPanel(page);
  await docsPanel.getByPlaceholder("옵션 또는 기능 검색").fill("seriesOptions");
  await expect(docsPanel).toContainText("seriesOptions");
  const docsInOverlay = await page.getByRole("dialog").isVisible().catch(() => false);
  await closeOverlayDocsPanel(page);

  await chartButton(page, "line").click();
  await expect(page.getByText("허용되지 않는 옵션입니다.")).toBeVisible();
  if (!docsInOverlay) {
    docsPanel = await openDocsPanel(page);
    await expect(docsPanel.getByPlaceholder("옵션 또는 기능 검색")).toHaveValue("seriesOptions");
  }
  await closeOverlayDocsPanel(page);

  await chartButton(page, "bar").click();

  await expect(page.getByPlaceholder("전체 차트 검색")).toHaveValue("");
  await expect(page.getByText("허용되지 않는 옵션입니다.")).toHaveCount(0);
  docsPanel = await openDocsPanel(page);
  await expect(docsPanel.getByPlaceholder("옵션 또는 기능 검색")).toHaveValue("");
  await closeOverlayDocsPanel(page);
  await expectSelectedChartCanvasLayers(page, "bar");

  expect(diagnostics).toEqual([]);
});

test("example search opens global popup and keeps active chart instances minimal", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await expect(page.getByTestId(/chart-example-card-/)).toHaveCount(5);
  await page.getByPlaceholder("전체 차트 검색").fill("options.radar.indicator");
  await expect(page.getByRole("option", { name: /radar 옵션/ })).toBeVisible();
  await expect(page.getByTestId(/chart-example-card-radar-/)).toHaveCount(0);

  await page.getByRole("option", { name: /radar 옵션/ }).click();
  await expect(page).toHaveURL(/#\/charts\/radar/);
  await expect(page.getByTestId(/chart-example-card-radar-/)).toHaveCount(5);
  await expectSelectedChartCanvasLayers(page, "radar");

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

  await seriesInput.fill("10");
  await expect(seriesInput).toHaveValue("10");
  await expect(liveCard.getByTestId("series-count-summary")).toContainText("10");

  await seriesInput.fill("3");
  await expect(seriesInput).toHaveValue("3");
  await expect(liveCard.getByTestId("series-count-summary")).toContainText("3");
  await expect
    .poll(async () => {
      const summary = JSON.parse((await liveCard.getByTestId("sample-data").textContent()) ?? "{}") as {
        data?: unknown[][];
      };

      return summary.data?.[0]?.length ?? 0;
    })
    .toBe(4);

  await seriesInput.fill("99");
  await expect(seriesInput).toHaveValue("10");

  expect(diagnostics).toEqual([]);
});

test("series count input allows replacing 10 with another value", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  const liveCard = page.getByTestId("chart-example-card-line-live-update");
  const seriesInput = liveCard.getByLabel("실시간 갱신 Series 개수");

  await seriesInput.fill("10");
  await expect(seriesInput).toHaveValue("10");
  await seriesInput.fill("3");
  await expect(seriesInput).toHaveValue("3");
  await expect(liveCard.getByTestId("series-count-summary")).toContainText("3");
  await seriesInput.fill("");
  await expect(seriesInput).toHaveValue("");
  await seriesInput.blur();
  await expect(seriesInput).toHaveValue("1");
  await expect(liveCard.getByTestId("series-count-summary")).toContainText("1");

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
  await page.getByRole("button", { name: "위젯 생성" }).click();
  await expect(canvas).toHaveCount(3);
  await expectCanvasPainted(page);

  await page.getByRole("button", { name: /Trend Line 삭제/ }).click();
  await expect(canvas).toHaveCount(2);

  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("button", { name: "차트 추가" }).click();
    await page.getByRole("button", { name: "위젯 생성" }).click();
    await expect(canvas).toHaveCount(3);
    await page.locator(".kmsf-dashboard-widget__actions button[aria-label$='삭제']").last().click();
    await expect(canvas).toHaveCount(2);
  }

  await page.getByRole("button", { name: "전체 삭제" }).click();
  await expect(canvas).toHaveCount(0);

  expect(diagnostics).toEqual([]);
});

test("gridstack chart add popup validates before creating widgets", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/#/gridstack");
  const initialCount = await page.locator(".grid-stack-item").count();

  await page.getByRole("button", { name: "차트 추가" }).click();
  const editorDialog = page.getByRole("dialog", { name: "차트 위젯 추가" });
  await expect(editorDialog).toBeVisible();
  await expect(editorDialog.getByRole("combobox", { name: "차트 타입" })).toBeFocused();
  await page.getByRole("textbox", { exact: true, name: "options JSON" }).fill("{\"notSupported\":true}");
  await page.getByRole("button", { name: "위젯 생성" }).click();
  await expect(page.getByRole("alert")).toHaveText("허용되지 않는 옵션입니다.");
  await expect(page.locator(".grid-stack-item")).toHaveCount(initialCount);
  await page.keyboard.press("Escape");
  await expect(editorDialog).toHaveCount(0);

  await page.getByRole("button", { name: "차트 추가" }).click();
  await page.getByRole("button", { name: "샘플 생성" }).click();
  await page.getByRole("button", { name: "위젯 생성" }).click();
  await expect(page.locator(".grid-stack-item")).toHaveCount(initialCount + 1);

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
