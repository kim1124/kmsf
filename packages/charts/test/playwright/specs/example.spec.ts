import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

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

test("example page renders docs shell with collapsible chart navigation", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "@kmsf/charts" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "차트 종류" })).toBeVisible();
  await expect(page.getByRole("main", { name: "차트 예제" })).toBeVisible();
  await expect(page.getByTestId("sample-data")).toBeVisible();
  await page.getByRole("tab", { name: "Usage" }).click();
  await expect(page.getByTestId("sample-code")).toBeVisible();

  await page.getByRole("button", { name: "차트 목록 접기" }).click();
  await expect(page.getByRole("button", { name: "차트 목록 펼치기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "line 차트 선택" })).toBeVisible();
  await expect(page.locator(".chart-aside")).not.toContainText("Charts");

  await page.getByRole("button", { name: "차트 목록 펼치기" }).click();
  await expect(chartButton(page, "line")).toBeVisible();

  const docsPanel = await openDocsPanel(page);
  await expect(docsPanel.getByPlaceholder("옵션 또는 기능 검색")).toBeVisible();
  await expect(docsPanel.getByRole("heading", { name: "Required Props" })).toBeVisible();

  const canvases = page.locator("canvas");
  await expect(canvases).toHaveCount(1);

  const box = await canvases.first().boundingBox();
  expect(box?.width).toBeGreaterThan(100);
  expect(box?.height).toBeGreaterThan(100);
  await expectCanvasPainted(page);

  expect(diagnostics).toEqual([]);
});

test("example menu switches charts and docs search filters options", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  const sampleData = page.getByTestId("sample-data");
  const stage = page.getByTestId("chart-stage");
  const chartButtons = ["line", "bar", "pie", "scatter", "sankey", "graph", "gauge", "wordCloud"];

  for (const name of chartButtons) {
    await chartButton(page, name).click();
    await expect(stage.getByRole("heading", { name: new RegExp(`^${name}$`) })).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(1);
    await expectCanvasPainted(page);
  }

  await chartButton(page, "line").click();
  const trendBefore = await sampleData.textContent();
  await page.waitForTimeout(1300);
  await expect(sampleData).not.toHaveText(trendBefore ?? "");

  await chartButton(page, "bar").click();
  const topBefore = await sampleData.textContent();
  await page.waitForTimeout(10300);
  await expect(sampleData).not.toHaveText(topBefore ?? "");

  const docsPanel = await openDocsPanel(page);
  const docsSearch = docsPanel.getByPlaceholder("옵션 또는 기능 검색");
  await docsSearch.fill("seriesOptions");
  await expect(docsPanel).toContainText("seriesOptions");
  await docsSearch.fill("존재하지않는검색어");
  await expect(docsPanel).toContainText("검색 결과가 없습니다.");

  expect(diagnostics).toEqual([]);
});

test("option controls update chart option summary without browser errors", async ({ page }) => {
  const diagnostics = collectBrowserDiagnostics(page);
  await page.goto("/");

  await page.getByRole("tab", { name: "Options" }).click();
  const optionSummary = page.getByTestId("option-summary");
  const before = await optionSummary.textContent();

  await page.getByRole("button", { name: "범례 토글" }).click();
  await expect(optionSummary).not.toHaveText(before ?? "");

  await page.getByRole("button", { name: "색상 변경" }).click();
  await expect(optionSummary).toContainText("themeOverrides");
  await expect(optionSummary).toContainText("#84cc16");
  await expectCanvasPainted(page);

  expect(diagnostics).toEqual([]);
});

test("chart canvas resizes to the available content area", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.goto("/");

  const stage = page.getByTestId("chart-stage");
  const canvas = page.locator("canvas").first();
  await expect(stage).toHaveCSS("height", "500px");
  await expect(canvas).toBeVisible();

  const stageBox = await stage.boundingBox();
  const canvasBox = await canvas.boundingBox();
  expect(stageBox).not.toBeNull();
  expect(canvasBox).not.toBeNull();
  expect(canvasBox!.width).toBeLessThanOrEqual(stageBox!.width);
  expect(canvasBox!.height).toBeLessThanOrEqual(stageBox!.height);
  expect(canvasBox!.y).toBeGreaterThanOrEqual(stageBox!.y);
  expect(canvasBox!.y + canvasBox!.height).toBeLessThanOrEqual(stageBox!.y + stageBox!.height);
  expect(canvasBox!.height).toBeGreaterThan(360);

  await page.setViewportSize({ width: 900, height: 820 });
  await page.waitForTimeout(300);

  const resizedStageBox = await stage.boundingBox();
  const resizedCanvasBox = await canvas.boundingBox();
  expect(resizedStageBox).not.toBeNull();
  expect(resizedCanvasBox).not.toBeNull();
  expect(resizedCanvasBox!.width).toBeLessThanOrEqual(resizedStageBox!.width);
  expect(resizedCanvasBox!.y + resizedCanvasBox!.height).toBeLessThanOrEqual(
    resizedStageBox!.y + resizedStageBox!.height,
  );
  expect(resizedCanvasBox!.width).toBeLessThan(canvasBox!.width);
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

  const sampleData = page.getByTestId("sample-data");
  const before = await sampleData.textContent();
  await page.getByRole("button", { name: "전체 데이터 갱신" }).click();
  await expect(sampleData).not.toHaveText(before ?? "");

  await page.getByRole("tab", { name: "Options" }).click();
  await page.getByLabel("옵션 JSON 편집").fill('{"notAllowed":true}');
  await expect(page.getByText("허용되지 않는 옵션입니다.")).toBeVisible();

  await page.getByLabel("옵션 JSON 편집").fill('{"grid":{"top":48}}');
  await expect(page.getByText("허용되지 않는 옵션입니다.")).toBeHidden();
  await expect(page.getByTestId("option-summary")).toContainText('"top": 48');

  expect(diagnostics).toEqual([]);
});
