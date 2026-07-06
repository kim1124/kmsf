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

test.describe("charts docs playground routing", () => {
  test("loads getting started docs with live example and highlighted code", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await page.goto("/docs/getting-started");

    await expect(page.getByRole("banner")).toContainText("@kmsf/charts");
    await expect(page.getByRole("navigation", { name: "문서 메뉴" })).toBeVisible();
    await expect(page.getByRole("main")).toContainText("시작하기");
    await expect(page.getByRole("main")).toContainText("차트 예제");
    await expect(page.locator(".docs-code__pre").first()).toBeVisible();
    await expect(page.locator("canvas").first()).toBeVisible();
    expect(diagnostics).toEqual([]);
  });

  test("legacy playground routes are removed and return the 404 page", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);

    await page.goto("/charts/line");
    await expect(page.getByRole("heading", { name: "지원하지 않는 페이지입니다." })).toBeVisible();

    await page.goto("/gridstack");
    await expect(page.getByRole("heading", { name: "지원하지 않는 페이지입니다." })).toBeVisible();

    await page.goto("/examples/map");
    await expect(page.getByRole("heading", { name: "지원하지 않는 페이지입니다." })).toBeVisible();

    await page.goto("/examples/custom");
    await expect(page.getByRole("heading", { name: "지원하지 않는 페이지입니다." })).toBeVisible();

    expect(diagnostics).toEqual([]);
  });

  test("chart type pages use the docs format with chart cards and editable data", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);

    await page.goto("/examples/line");

    await expect(page.getByRole("banner")).toContainText("@kmsf/charts");
    await expect(page.getByRole("navigation", { name: "문서 메뉴" })).toBeVisible();
    await expect(page.locator(".docs-shell__content")).toContainText("Line");
    await expect(page.getByRole("heading", { name: "차트 예제" })).toHaveCount(0);
    await expect(page.getByText("라이브 예제")).toHaveCount(0);

    const firstCard = page.getByTestId("chart-example-card-line-static-basic");
    await expect(firstCard).toBeVisible();
    await expect(firstCard.getByRole("tab", { name: "Usage" })).toBeVisible();
    await expect(firstCard.getByRole("tab", { name: "Data" })).toBeVisible();

    await firstCard.getByRole("tab", { name: "Data" }).click();
    const configEditor = firstCard.getByRole("textbox", { exact: true, name: "Chart config JSON" });
    await expect(configEditor).toBeVisible();
    const configEditorBox = await configEditor.boundingBox();
    expect(configEditorBox?.height).toBeGreaterThanOrEqual(360);
    await expect(firstCard.getByRole("textbox", { exact: true, name: "data JSON" })).toHaveCount(0);
    await expect(firstCard.getByRole("textbox", { exact: true, name: "options JSON" })).toHaveCount(0);
    await expect(firstCard.getByRole("textbox", { exact: true, name: "colors JSON" })).toHaveCount(0);
    await expect(firstCard.getByRole("textbox", { exact: true, name: "series JSON" })).toHaveCount(0);
    await expect(firstCard.getByRole("textbox", { exact: true, name: "seriesOptions JSON" })).toHaveCount(0);
    await expect(firstCard.getByTestId("sample-data")).toHaveCount(0);
    await expect(firstCard.getByTestId("option-summary")).toHaveCount(0);
    await expect(firstCard.getByText("색상 변경")).toHaveCount(0);
    await expect(firstCard.locator(".color-picker-control")).toHaveCount(0);
    await expect(firstCard.locator(".chart-example-card__tags")).toHaveCount(0);

    const legendButton = firstCard.getByRole("button", { name: "범례 숨김" });
    const tooltipButton = firstCard.getByRole("button", { name: "툴팁 숨김" });
    await expect(legendButton).toBeVisible();
    await expect(tooltipButton).toBeVisible();
    await expect(legendButton).toHaveCSS("background-color", "rgb(16, 185, 129)");
    await expect(tooltipButton).toHaveCSS("background-color", "rgb(16, 185, 129)");

    await legendButton.click();
    const disabledLegendButton = firstCard.getByRole("button", { name: "범례 표시" });
    await expect(disabledLegendButton).toHaveCSS("background-color", "rgb(255, 255, 255)");

    expect(diagnostics).toEqual([]);
  });

  test("generic chart type changes regenerate compatible props and keep the chart rendered", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);

    await page.goto("/examples/generic-chart");

    const typeSelect = page.getByLabel("Generic chart type");
    await expect(typeSelect).toBeVisible();
    await expect(page.getByLabel("GenericChart 색상 선택")).toHaveCount(0);
    await expect(page.locator(".type-playground-card .color-picker-control")).toHaveCount(0);
    await typeSelect.selectOption("radar");
    await expect(page.getByTestId("generic-chart-format")).toContainText("native");
    await page.getByRole("tab", { name: "Props" }).click();
    await expect(page.getByRole("textbox", { exact: true, name: "Chart config JSON" })).toHaveValue(/radar/);
    await expect(page.locator("canvas").first()).toBeVisible();

    await typeSelect.selectOption("bar");
    await expect(page.getByTestId("generic-chart-format")).toContainText("top");
    await expect(page.getByRole("textbox", { exact: true, name: "Chart config JSON" })).toHaveValue(/Metric|Alpha/);
    await expect(page.locator("canvas").first()).toBeVisible();
    await expect(typeSelect.locator("option[value='map']")).toHaveCount(0);
    await expect(typeSelect.locator("option[value='custom']")).toHaveCount(0);

    await page.getByRole("textbox", { exact: true, name: "Chart config JSON" }).fill("{");
    await expect(page.getByRole("alert")).toContainText("JSON 형식이 올바르지 않습니다.");
    await expect(page.locator("canvas").first()).toBeVisible();

    expect(diagnostics).toEqual([]);
  });

  test("top nav theme select updates chart examples without changing route or diagnostics", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);

    await page.goto("/examples/theme");

    const themeSelect = page.getByLabel("차트 테마 선택");
    const topSearch = page.getByRole("banner").getByRole("textbox", { exact: true, name: "전체 차트 검색" });
    await expect(themeSelect).toBeVisible();
    await expect(themeSelect).toHaveValue("kmsf");
    await expect(topSearch).toBeVisible();

    const themeBox = await themeSelect.boundingBox();
    const searchBox = await topSearch.boundingBox();
    expect(themeBox).not.toBeNull();
    expect(searchBox).not.toBeNull();
    expect(themeBox!.x + themeBox!.width).toBeLessThanOrEqual(searchBox!.x);

    await expect(page.getByRole("heading", { exact: true, name: "Theme" })).toBeVisible();
    await expect(page.getByTestId("theme-example-card-line")).toBeVisible();
    await themeSelect.selectOption("dark");
    await expect(page).toHaveURL(/\/examples\/theme$/);
    await expect(page.locator("canvas").first()).toBeVisible();
    await expect(page.getByTestId("active-chart-theme")).toContainText("Dark");
    expect(diagnostics).toEqual([]);
  });

  test("api page uses data-table styling and feature-based API sections", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);

    await page.goto("/api/props");

    await expect(page.getByRole("main").getByRole("heading", { exact: true, name: "API" })).toBeVisible();
    await expect(page.getByRole("main").locator("canvas")).toHaveCount(0);
    await expect(page.locator("#api-generic-rendering").getByRole("heading", { name: "1. GenericChart 렌더링" })).toBeVisible();
    await expect(page.locator("#api-native-required-options").getByRole("heading", { name: "3. Native 필수 옵션" })).toBeVisible();
    await expect(page.locator("#api-native-required-options").getByRole("heading", { exact: true, name: "Options" })).toBeVisible();
    await expect(page.locator("#api-native-required-options")).toContainText("heatmap: options.visualMap");
    await expect(page.locator("#api-native-required-options")).toContainText("간단한 예제 코드");
    await expect(page.locator("#api-native-required-options").getByRole("link", { name: "Heatmap 라이브 예제" })).toHaveAttribute(
      "href",
      "/examples/heatmap#heatmap-live-update",
    );

    const apiCardStyle = await page.locator("#api-generic-rendering").evaluate((element) => {
      const style = window.getComputedStyle(element);

      return {
        background: style.backgroundColor,
        borderColor: style.borderColor,
        borderRadius: style.borderRadius,
      };
    });
    const apiNameStyle = await page.locator("#api-generic-rendering .docs-reference-list__item h4").first().evaluate((element) => {
      const style = window.getComputedStyle(element);

      return {
        color: style.color,
        fontFamily: style.fontFamily,
      };
    });

    expect(apiCardStyle).toEqual({
      background: "rgb(255, 255, 255)",
      borderColor: "rgb(215, 238, 230)",
      borderRadius: "8px",
    });
    expect(apiNameStyle.color).toBe("rgb(8, 121, 95)");
    expect(apiNameStyle.fontFamily).toContain("ui-monospace");

    const apiIndent = await page.locator("#api-native-required-options").evaluate((section) => {
      const groupHeading = section.querySelector("h2")?.getBoundingClientRect();
      const subsectionHeadings = Array.from(section.querySelectorAll(".docs-reference-list__subsection > h3"))
        .filter((heading) => ["Props", "Options"].includes(heading.textContent?.trim() ?? ""))
        .map((heading) => heading.getBoundingClientRect());

      return subsectionHeadings.map((heading) => Math.round(heading.left - (groupHeading?.left ?? 0)));
    });
    expect(apiIndent.every((indent) => indent >= 12 && indent <= 20)).toBe(true);
    const methodsIndent = await page.locator("#api-lifecycle-methods").evaluate((section) => {
      const groupHeading = section.querySelector("h2")?.getBoundingClientRect();
      const methodsHeading = Array.from(section.querySelectorAll(".docs-reference-list__subsection > h3"))
        .find((heading) => heading.textContent?.trim() === "Methods")
        ?.getBoundingClientRect();

      return Math.round((methodsHeading?.left ?? 0) - (groupHeading?.left ?? 0));
    });
    expect(methodsIndent).toBeGreaterThanOrEqual(12);
    expect(methodsIndent).toBeLessThanOrEqual(20);
    const apiHeadingHierarchy = await page.locator("#api-generic-rendering").evaluate((section) => {
      const propsHeading = Array.from(section.querySelectorAll(".docs-reference-list__subsection > h3"))
        .find((heading) => heading.textContent?.trim() === "Props")
        ?.getBoundingClientRect();
      const propNameHeading = section.querySelector(".docs-reference-list__item h4")?.getBoundingClientRect();
      const propDescription = section.querySelector(".docs-reference-list__item dd")?.getBoundingClientRect();

      return {
        descriptionIndent: Math.round((propDescription?.left ?? 0) - (propNameHeading?.left ?? 0)),
        hasEntryHeading: Boolean(section.querySelector(".docs-reference-list__item h4")),
        nameIndent: Math.round((propNameHeading?.left ?? 0) - (propsHeading?.left ?? 0)),
      };
    });
    expect(apiHeadingHierarchy.hasEntryHeading).toBe(true);
    expect(apiHeadingHierarchy.nameIndent).toBeGreaterThanOrEqual(12);
    expect(apiHeadingHierarchy.descriptionIndent).toBeGreaterThanOrEqual(12);

    const topSearch = page.getByRole("banner").getByRole("textbox", { exact: true, name: "전체 차트 검색" });
    await topSearch.fill("visualMap");
    const result = page.getByRole("option").filter({ hasText: "API" }).filter({ hasText: "visualMap" }).first();
    await expect(result).toContainText("visualMap");
    await result.click();

    await expect(page).toHaveURL(/\/api\/props#api-native-required-options$/);
    await expect(page.locator("#api-native-required-options")).toBeVisible();
    expect(diagnostics).toEqual([]);
  });

  test("trend and top aggregate routes remain available and searchable", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);

    await page.goto("/examples/trend");
    await expect(page.getByRole("main").getByRole("heading", { exact: true, name: "Trend" })).toBeVisible();
    await expect(page.getByTestId("chart-example-card-line-static-basic")).toBeVisible();

    await page.goto("/examples/top");
    await expect(page.getByRole("main").getByRole("heading", { exact: true, name: "Top" })).toBeVisible();
    await expect(page.getByTestId("chart-example-card-bar-static-basic")).toBeVisible();

    const topSearch = page.getByRole("banner").getByRole("textbox", { exact: true, name: "전체 차트 검색" });
    await topSearch.fill("top");
    const topResult = page.getByRole("option").filter({ hasText: "Top" }).first();
    await expect(topResult).toBeVisible();
    await topResult.click();

    await expect(page).toHaveURL(/\/examples\/top$/);

    expect(diagnostics).toEqual([]);
  });

  test("large data page refreshes automatically every 10 seconds without diagnostics", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);

    await page.goto("/performance/large-data");
    const before = await page.getByTestId("large-data-summary").textContent();

    await page.waitForTimeout(10_500);

    const after = await page.getByTestId("large-data-summary").textContent();
    expect(after).not.toBe(before);
    expect(after).toContain("refreshVersion: 1");
    expect(diagnostics).toEqual([]);
  });

  test("navigates to dashboard integration route from the docs sidebar", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);
    await page.goto("/docs/getting-started");

    await page.getByRole("link", { name: "Dashboard Integration" }).click();

    await expect(page).toHaveURL(/\/examples\/dashboard-integration$/);
    await expect(page.getByRole("main")).toContainText("Dashboard Integration");
    await expect(page.getByRole("heading", { name: "동적 차트 대시보드" })).toBeVisible();
    expect(diagnostics).toEqual([]);
  });

  test("unmounts the previous live route when docs pages change", async ({ page }) => {
    await page.goto("/examples/generic-chart");

    await page.evaluate(() => {
      window.__kmsfChartsLastUnmount = undefined;
    });
    await page.getByRole("link", { name: "Large Data" }).click();

    await expect(page).toHaveURL(/\/performance\/large-data$/);
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const lastUnmount = window.__kmsfChartsLastUnmount;
          return typeof lastUnmount === "string" ? lastUnmount : lastUnmount?.routePath;
        }),
      )
      .toBe("/examples/generic-chart");
  });

  test("resets docs content scroll when navigating to another chart page", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);

    await page.goto("/examples/heatmap");
    const content = page.locator(".docs-shell__content");

    await content.evaluate((element) => {
      element.scrollTop = 600;
    });
    await expect.poll(() => content.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

    await page.getByRole("link", { exact: true, name: "Tree" }).click();

    await expect(page).toHaveURL(/\/examples\/tree$/);
    await expect.poll(() => content.evaluate((element) => element.scrollTop)).toBe(0);
    expect(diagnostics).toEqual([]);
  });
});
