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

test.describe("official-like chart examples", () => {
  test("non-live example uses one editable chart config textarea", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);

    await page.goto("/examples/pie");

    const card = page.locator(".chart-example-card").first();
    await card.getByRole("tab", { name: "Data" }).click();

    await expect(card.getByLabel("Chart config JSON")).toBeVisible();
    await expect(card.getByLabel("data JSON")).toHaveCount(0);
    await expect(card.getByLabel("options JSON")).toHaveCount(0);
    expect(diagnostics).toEqual([]);
  });

  test("live example does not expose editable data", async ({ page }) => {
    const diagnostics = collectBrowserDiagnostics(page);

    await page.goto("/examples/line#line-live-update");

    const card = page.locator("#line-live-update");

    await expect(card.getByRole("tab", { name: "Data" })).toHaveCount(0);
    await expect(card.getByLabel("Chart config JSON")).toHaveCount(0);
    expect(diagnostics).toEqual([]);
  });
});
