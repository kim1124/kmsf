import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

type WidgetLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

function collectBrowserDiagnostics(page: Page) {
  const diagnostics: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      diagnostics.push(`[${message.type()}] ${message.text()}`);
    }
  });

  page.on("pageerror", (error) => {
    diagnostics.push(`[pageerror] ${error.message}`);
  });

  return diagnostics;
}

async function readWidgetLayout(widget: Locator): Promise<WidgetLayout> {
  return widget.evaluate((element) => ({
    x: Number(element.getAttribute("data-layout-x")),
    y: Number(element.getAttribute("data-layout-y")),
    w: Number(element.getAttribute("data-layout-w")),
    h: Number(element.getAttribute("data-layout-h")),
  }));
}

async function readGridEngineColumn(grid: Locator): Promise<number> {
  return grid.evaluate((element) => {
    const gridstack = (element as HTMLElement & { gridstack?: { opts?: { column?: number } } }).gridstack;
    return Number(gridstack?.opts?.column ?? 0);
  });
}

async function dragWidget(page: Page, widget: Locator, deltaX: number, deltaY: number) {
  const box = await widget.boundingBox();
  if (!box) {
    throw new Error("Widget bounding box is not available");
  }

  await page.mouse.move(box.x + 56, box.y + 24);
  await page.mouse.down();
  await page.mouse.move(box.x + 56 + deltaX, box.y + 24 + deltaY, { steps: 12 });
  await page.mouse.up();
}

async function resizeWidget(page: Page, widget: Locator, deltaX: number, deltaY: number) {
  const widgetBox = await widget.boundingBox();
  if (!widgetBox) {
    throw new Error("Widget bounding box is not available");
  }

  await widget.hover({ position: { x: widgetBox.width - 4, y: widgetBox.height - 4 } });
  const handle = widget.locator(".ui-resizable-se");
  const handleBox = await handle.boundingBox();
  const startX = handleBox ? handleBox.x + handleBox.width / 2 : widgetBox.x + widgetBox.width - 4;
  const startY = handleBox ? handleBox.y + handleBox.height / 2 : widgetBox.y + widgetBox.height - 4;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 12 });
  await page.mouse.up();
}

async function startWidgetResize(page: Page, widget: Locator) {
  const widgetBox = await widget.boundingBox();
  if (!widgetBox) {
    throw new Error("Widget bounding box is not available");
  }

  await widget.hover({ position: { x: widgetBox.width - 4, y: widgetBox.height - 4 } });
  const handle = widget.locator(".ui-resizable-se");
  const handleBox = await handle.boundingBox();
  const startX = handleBox ? handleBox.x + handleBox.width / 2 : widgetBox.x + widgetBox.width - 4;
  const startY = handleBox ? handleBox.y + handleBox.height / 2 : widgetBox.y + widgetBox.height - 4;

  await page.mouse.move(startX, startY);
  await page.mouse.down();

  return { startX, startY };
}

test("supports the dashboard example workflow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "@kmsf/gridstack" })).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-sales")).toBeVisible();

  await page.getByRole("button", { name: "위젯 추가" }).click();
  await expect(page.getByTestId("dashboard-widget-widget-5")).toBeVisible();

  await page.getByRole("button", { name: "매출 최대화" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-maximized", "true");

  await page.getByRole("button", { name: "매출 최소화" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-minimized", "true");

  await page.getByRole("button", { name: "매출 복원" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-maximized", "false");
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-minimized", "false");

  await page.getByLabel("컬럼 선택").selectOption("4");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "4");

  await page.getByRole("button", { name: "자동 정렬" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-x", "0");

  await page.getByRole("button", { name: "매출 삭제" }).click();
  await expect(page.getByTestId("dashboard-widget-sales")).toBeHidden();
});

test("keeps widget shell aligned with the GridStack content box", async ({ page }) => {
  await page.goto("/");
  const sales = page.getByTestId("dashboard-widget-sales");

  await expect(sales).toBeVisible();
  const before = await sales.evaluate((item) => {
    const content = item.querySelector(".grid-stack-item-content");
    const shell = item.querySelector(".kmsf-dashboard-widget");
    const contentRect = content?.getBoundingClientRect();
    const shellRect = shell?.getBoundingClientRect();

    return {
      contentHeight: Math.round(contentRect?.height ?? 0),
      shellHeight: Math.round(shellRect?.height ?? 0),
      contentBottom: Math.round(contentRect?.bottom ?? 0),
      shellBottom: Math.round(shellRect?.bottom ?? 0),
    };
  });

  expect(before.shellHeight).toBe(before.contentHeight);
  expect(before.shellBottom).toBe(before.contentBottom);

  await page.getByRole("button", { name: "매출 최소화" }).click();
  await expect(sales).toHaveAttribute("data-minimized", "true");

  const after = await sales.evaluate((item) => {
    const content = item.querySelector(".grid-stack-item-content");
    const shell = item.querySelector(".kmsf-dashboard-widget");
    const contentRect = content?.getBoundingClientRect();
    const shellRect = shell?.getBoundingClientRect();

    return {
      contentHeight: Math.round(contentRect?.height ?? 0),
      shellHeight: Math.round(shellRect?.height ?? 0),
      contentBottom: Math.round(contentRect?.bottom ?? 0),
      shellBottom: Math.round(shellRect?.bottom ?? 0),
    };
  });

  expect(after.shellHeight).toBe(after.contentHeight);
  expect(after.shellBottom).toBe(after.contentBottom);
});

test("saves and restores the current layout as JSON", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("컬럼 선택").selectOption("4");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "4");

  await page.getByRole("button", { name: "레이아웃 저장" }).click();
  const json = await page.getByLabel("저장된 레이아웃 JSON").inputValue();
  const saved = JSON.parse(json);
  expect(saved.columns).toBe(4);
  expect(saved.widgets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "sales",
        title: "매출",
        layout: expect.objectContaining({ id: "sales", w: 3 }),
      }),
    ]),
  );

  await page.getByLabel("컬럼 선택").selectOption("6");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "6");

  await page.getByRole("button", { name: "레이아웃 복원" }).click();
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "4");
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-w", "3");
  await expect(page.getByText("복원 완료")).toBeVisible();
});

test("adds widgets with user-selected size into horizontal free space", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("새 위젯 너비").selectOption("2");
  await page.getByLabel("새 위젯 높이").selectOption("3");

  await page.getByRole("button", { name: "위젯 추가" }).click();
  const firstAdded = page.getByTestId("dashboard-widget-widget-5");
  await expect(firstAdded).toHaveAttribute("data-layout-x", "0");
  await expect(firstAdded).toHaveAttribute("data-layout-y", "4");
  await expect(firstAdded).toHaveAttribute("data-layout-w", "2");
  await expect(firstAdded).toHaveAttribute("data-layout-h", "3");

  await page.getByRole("button", { name: "위젯 추가" }).click();
  const secondAdded = page.getByTestId("dashboard-widget-widget-6");
  await expect(secondAdded).toHaveAttribute("data-layout-x", "2");
  await expect(secondAdded).toHaveAttribute("data-layout-y", "4");
  await expect(secondAdded).toHaveAttribute("data-layout-w", "2");
  await expect(secondAdded).toHaveAttribute("data-layout-h", "3");

  await page.getByRole("button", { name: "레이아웃 저장" }).click();
  const saved = JSON.parse(await page.getByLabel("저장된 레이아웃 JSON").inputValue());
  expect(saved.widgets).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "widget-5",
        layout: expect.objectContaining({ w: 2, h: 3 }),
      }),
      expect.objectContaining({
        id: "widget-6",
        layout: expect.objectContaining({ w: 2, h: 3 }),
      }),
    ]),
  );
});

test("clears all widgets and applies distinct add/delete button colors", async ({ page }) => {
  await page.goto("/");

  const addButton = page.getByRole("button", { name: "위젯 추가" });
  const clearButton = page.getByRole("button", { name: "전체 삭제" });
  const removeButton = page.getByRole("button", { name: "매출 삭제" });

  await expect(addButton).toBeVisible();
  await expect(clearButton).toBeVisible();
  await expect(removeButton).toBeVisible();

  const colors = await Promise.all([
    addButton.evaluate((element) => getComputedStyle(element).backgroundColor),
    clearButton.evaluate((element) => getComputedStyle(element).backgroundColor),
    removeButton.evaluate((element) => getComputedStyle(element).color),
  ]);

  expect(colors[0]).not.toBe(colors[1]);
  expect(colors[1]).not.toBe("rgba(0, 0, 0, 0)");
  expect(colors[2]).not.toBe("rgb(23, 32, 38)");

  await clearButton.click();

  await expect(page.getByTestId("dashboard-widget-sales")).toBeHidden();
  await expect(page.getByText("위젯 0개")).toBeVisible();
});

test("selects 1 through 12 columns and fits widgets to empty space", async ({ page }) => {
  await page.goto("/");

  const columnSelect = page.getByLabel("컬럼 선택");
  await expect(columnSelect.locator("option")).toHaveCount(12);

  await columnSelect.selectOption("12");
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "12");
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-w", "3");

  await page.getByRole("button", { name: "빈 공간 채우기" }).click();

  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-x", "0");
  await expect(page.getByTestId("dashboard-widget-sales")).toHaveAttribute("data-layout-w", "6");
  await expect(page.getByTestId("dashboard-widget-traffic")).toHaveAttribute("data-layout-x", "6");
  await expect(page.getByTestId("dashboard-widget-traffic")).toHaveAttribute("data-layout-w", "6");
});

test("renders widget actions as icon-only buttons", async ({ page }) => {
  await page.goto("/");

  const sales = page.getByTestId("dashboard-widget-sales");
  const maximize = sales.getByRole("button", { name: "매출 최대화" });
  const minimize = sales.getByRole("button", { name: "매출 최소화" });
  const restore = sales.getByRole("button", { name: "매출 복원" });
  const remove = sales.getByRole("button", { name: "매출 삭제" });

  for (const button of [maximize, minimize, restore, remove]) {
    await expect(button.locator("svg")).toBeVisible();
    await expect(button).toHaveText("");
  }
});

test("expands only the selected widget when its header is double-clicked", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Header double-click behavior is verified on the desktop project only.");

  await page.goto("/");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");
  const traffic = page.getByTestId("dashboard-widget-traffic");
  const salesHeader = sales.locator(".kmsf-dashboard-widget__header");

  await page.getByLabel("컬럼 선택").selectOption("12");
  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect(sales).toHaveAttribute("data-layout-w", "3");
  await expect(traffic).toHaveAttribute("data-layout-x", "3");

  await salesHeader.dblclick();

  await expect(sales).toHaveAttribute("data-layout-x", "0");
  await expect(sales).toHaveAttribute("data-layout-w", "9");
  await expect(traffic).toHaveAttribute("data-layout-x", "9");
  await expect(traffic).toHaveAttribute("data-layout-w", "3");
});

test("does not fill empty row space when a widget action button is double-clicked", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Header double-click behavior is verified on the desktop project only.");

  await page.goto("/");

  const sales = page.getByTestId("dashboard-widget-sales");
  const traffic = page.getByTestId("dashboard-widget-traffic");

  await page.getByLabel("컬럼 선택").selectOption("12");
  await expect(sales).toHaveAttribute("data-layout-w", "3");
  await expect(traffic).toHaveAttribute("data-layout-x", "3");

  await sales.getByRole("button", { name: "매출 복원" }).dblclick();

  await expect(sales).toHaveAttribute("data-layout-w", "3");
  await expect(traffic).toHaveAttribute("data-layout-x", "3");
});

test("does not resize row widgets on header double-click when the row has no empty space", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Header double-click behavior is verified on the desktop project only.");

  await page.goto("/");

  const sales = page.getByTestId("dashboard-widget-sales");
  const traffic = page.getByTestId("dashboard-widget-traffic");
  const layoutJson = page.getByLabel("저장된 레이아웃 JSON");
  const fullRowSnapshot = {
    columns: 12,
    widgets: [
      {
        id: "sales",
        title: "매출",
        layout: { id: "sales", x: 0, y: 0, w: 4, h: 2 },
        data: { description: "월간 반복 매출", value: "1.28억" },
      },
      {
        id: "traffic",
        title: "트래픽",
        layout: { id: "traffic", x: 4, y: 0, w: 8, h: 2 },
        data: { description: "활성 세션", value: "4.28만" },
      },
      {
        id: "orders",
        title: "주문",
        layout: { id: "orders", x: 0, y: 2, w: 6, h: 2 },
        data: { description: "완료 주문", value: "1,284" },
      },
      {
        id: "alerts",
        title: "알림",
        layout: { id: "alerts", x: 6, y: 2, w: 6, h: 2 },
        data: { description: "미해결 이슈", value: "3" },
      },
    ],
  };

  await layoutJson.fill(JSON.stringify(fullRowSnapshot, null, 2));
  await page.getByRole("button", { name: "레이아웃 복원" }).click();
  await expect(page.getByTestId("dashboard-grid")).toHaveAttribute("data-columns", "12");
  await expect(sales).toHaveAttribute("data-layout-w", "4");
  await expect(traffic).toHaveAttribute("data-layout-x", "4");
  await expect(traffic).toHaveAttribute("data-layout-w", "8");

  await sales.locator(".kmsf-dashboard-widget__header").dblclick();

  await expect(sales).toHaveAttribute("data-layout-x", "0");
  await expect(sales).toHaveAttribute("data-layout-w", "4");
  await expect(traffic).toHaveAttribute("data-layout-x", "4");
  await expect(traffic).toHaveAttribute("data-layout-w", "8");
});

test("defers grid sync while a widget is actively resizing", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Pointer interaction regression runs on the desktop project only.");

  const diagnostics = collectBrowserDiagnostics(page);

  await page.goto("/");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");
  await expect(grid).toHaveAttribute("data-columns", "6");

  const beforeResize = await readWidgetLayout(sales);
  const { startX, startY } = await startWidgetResize(page, sales);

  await page.mouse.move(startX + 120, startY + 90, { steps: 8 });
  await page.getByLabel("컬럼 선택").evaluate((element) => {
    const select = element as HTMLSelectElement;
    select.value = "12";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect.poll(() => readGridEngineColumn(grid)).toBe(6);

  await page.mouse.move(startX + 180, startY + 130, { steps: 8 });
  await page.mouse.up();

  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect.poll(() => readGridEngineColumn(grid)).toBe(12);
  await expect.poll(async () => {
    const layout = await readWidgetLayout(sales);
    return layout.w !== beforeResize.w || layout.h !== beforeResize.h;
  }).toBe(true);

  await page.waitForTimeout(100);
  expect(diagnostics).toEqual([]);
});

test("executes the complete dashboard feature set in development mode", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Pointer interaction smoke test runs on the desktop project only.");

  await page.goto("/");

  const grid = page.getByTestId("dashboard-grid");
  const sales = page.getByTestId("dashboard-widget-sales");

  await expect(page.getByRole("heading", { name: "@kmsf/gridstack" })).toBeVisible();
  await expect(grid).toHaveAttribute("data-columns", "6");
  await expect(sales).toBeVisible();
  await expect(page.getByText("위젯 4개")).toBeVisible();

  const columnSelect = page.getByLabel("컬럼 선택");
  await expect(columnSelect.locator("option")).toHaveCount(12);
  await columnSelect.selectOption("12");
  await expect(grid).toHaveAttribute("data-columns", "12");

  await page.getByRole("button", { name: "빈 공간 채우기" }).click();
  await expect(sales).toHaveAttribute("data-layout-w", "6");
  await expect(page.getByTestId("dashboard-widget-traffic")).toHaveAttribute("data-layout-x", "6");

  await page.getByRole("button", { name: "레이아웃 저장" }).click();
  const savedJson = await page.getByLabel("저장된 레이아웃 JSON").inputValue();
  expect(JSON.parse(savedJson)).toMatchObject({ columns: 12 });
  await expect(page.getByText("저장 완료")).toBeVisible();

  await columnSelect.selectOption("4");
  await expect(grid).toHaveAttribute("data-columns", "4");
  await page.getByRole("button", { name: "레이아웃 복원" }).click();
  await expect(grid).toHaveAttribute("data-columns", "12");
  await expect(page.getByText("복원 완료")).toBeVisible();

  await page.getByRole("button", { name: "위젯 추가" }).click();
  await expect(page.getByTestId("dashboard-widget-widget-5")).toBeVisible();
  await expect(page.getByText("위젯 5개")).toBeVisible();

  await page.getByRole("button", { name: "매출 최대화" }).click();
  await expect(sales).toHaveAttribute("data-maximized", "true");
  await expect(sales).toHaveAttribute("data-layout-w", "12");

  await page.getByRole("button", { name: "매출 최소화" }).click();
  await expect(sales).toHaveAttribute("data-minimized", "true");
  await expect(sales).toHaveAttribute("data-layout-h", "1");

  await page.getByRole("button", { name: "매출 복원" }).click();
  await expect(sales).toHaveAttribute("data-maximized", "false");
  await expect(sales).toHaveAttribute("data-minimized", "false");

  await page.getByRole("button", { name: "자동 정렬" }).click();
  await expect(sales).toHaveAttribute("data-layout-x", "0");

  await page.getByRole("button", { name: "레이아웃 초기화" }).click();
  await expect(grid).toHaveAttribute("data-columns", "6");
  await expect(sales).toHaveAttribute("data-layout-x", "0");
  await expect(sales).toHaveAttribute("data-layout-w", "3");

  await page.getByRole("button", { name: "이동 토글" }).click();
  await expect(page.getByText("이동 불가")).toBeVisible();
  const lockedPosition = await readWidgetLayout(sales);
  await dragWidget(page, sales, 0, 220);
  await expect.poll(() => readWidgetLayout(sales)).toEqual(lockedPosition);

  await page.getByRole("button", { name: "이동 토글" }).click();
  await expect(page.getByText("이동 가능")).toBeVisible();
  await dragWidget(page, sales, 0, 220);
  await expect.poll(async () => (await readWidgetLayout(sales)).y).not.toBe(lockedPosition.y);

  await page.getByRole("button", { name: "크기 조절 토글" }).click();
  await expect(page.getByText("크기 조절 불가")).toBeVisible();
  const lockedSize = await readWidgetLayout(sales);
  await expect(sales.locator(".ui-resizable-se")).toBeHidden();
  await expect.poll(() => readWidgetLayout(sales)).toEqual(lockedSize);

  await page.getByRole("button", { name: "크기 조절 토글" }).click();
  await expect(page.getByText("크기 조절 가능")).toBeVisible();
  const beforeResize = await readWidgetLayout(sales);
  await resizeWidget(page, sales, 140, 100);
  await expect.poll(async () => {
    const layout = await readWidgetLayout(sales);
    return layout.w !== beforeResize.w || layout.h !== beforeResize.h;
  }).toBe(true);

  await page.getByRole("button", { name: "레이아웃 갱신" }).click();
  await expect(sales).toBeVisible();

  await page.getByRole("button", { name: "매출 삭제" }).click();
  await expect(sales).toBeHidden();
  await expect(page.getByText("위젯 3개")).toBeVisible();

  await page.getByRole("button", { name: "전체 삭제" }).click();
  await expect(page.getByText("위젯 0개")).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-traffic")).toBeHidden();

  expect(await page.locator(".grid-stack-item").count()).toBe(0);
});
