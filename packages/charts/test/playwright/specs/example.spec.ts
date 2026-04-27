import { expect, test, type Page } from "@playwright/test";

async function expectCanvasPainted(page: Page) {
  await expect
    .poll(async () =>
      page.locator("canvas").first().evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        const context = canvas.getContext("2d");

        if (!context || canvas.width === 0 || canvas.height === 0) {
          return false;
        }

        const columns = 16;
        const rows = 16;

        for (let column = 0; column < columns; column += 1) {
          for (let row = 0; row < rows; row += 1) {
            const x = Math.min(canvas.width - 1, Math.floor((canvas.width * (column + 0.5)) / columns));
            const y = Math.min(canvas.height - 1, Math.floor((canvas.height * (row + 0.5)) / rows));
            const pixel = context.getImageData(x, y, 1, 1).data;
            const red = pixel[0] ?? 255;
            const green = pixel[1] ?? 255;
            const blue = pixel[2] ?? 255;
            const alpha = pixel[3] ?? 0;

            if (alpha > 0 && (red < 245 || green < 245 || blue < 245)) {
              return true;
            }
          }
        }

        return false;
      }),
    )
    .toBe(true);
}

test("example page renders charts without browser errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });

  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "@kmsf/charts" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "차트 샘플 메뉴" })).toBeVisible();
  await expect(page.getByRole("main", { name: "차트 예제" })).toBeVisible();
  await expect(page.getByTestId("sample-data")).toBeVisible();
  await expect(page.getByTestId("sample-code")).toBeVisible();
  await expect(page.getByTestId("chart-stage")).toHaveCSS("height", "500px");

  const canvases = page.locator("canvas");
  await expect(canvases).toHaveCount(1);

  const box = await canvases.first().boundingBox();
  expect(box?.width).toBeGreaterThan(100);
  expect(box?.height).toBeGreaterThan(100);
  await expectCanvasPainted(page);

  expect(consoleErrors).toEqual([]);
});

test("example menu switches charts and sample data updates on intervals", async ({ page }) => {
  await page.goto("/");

  const sampleData = page.getByTestId("sample-data");
  const stage = page.getByTestId("chart-stage");
  const chartButtons = ["TrendChart", "TopChart", "SankeyChart", "WordCloud", "GaugeChart", "SunburstChart"];

  for (const name of chartButtons) {
    await page.getByRole("button", { name }).click();
    await expect(stage.getByRole("heading", { name })).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(1);
    await expectCanvasPainted(page);
  }

  await page.getByRole("button", { name: "TrendChart" }).click();
  const trendBefore = await sampleData.textContent();
  await page.waitForTimeout(1300);
  await expect(sampleData).not.toHaveText(trendBefore ?? "");

  await page.getByRole("button", { name: "GaugeChart" }).click();
  const gaugeBefore = await sampleData.textContent();
  await page.waitForTimeout(5300);
  await expect(sampleData).not.toHaveText(gaugeBefore ?? "");

  await page.getByRole("button", { name: "SunburstChart" }).click();
  const sunburstBefore = await sampleData.textContent();
  await page.waitForTimeout(5300);
  await expect(sampleData).not.toHaveText(sunburstBefore ?? "");

  await page.getByRole("button", { name: "SankeyChart" }).click();
  const sankeyBefore = await sampleData.textContent();
  await page.waitForTimeout(10300);
  await expect(sampleData).not.toHaveText(sankeyBefore ?? "");
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
