import { expect, test } from "@playwright/test";

test("renders the gridstack example dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "@kmsf/gridstack" })).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-sales")).toBeVisible();
  await expect(page.getByTestId("dashboard-widget-traffic")).toBeVisible();
});

test("renders Korean labels by default", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("개발 예제")).toBeVisible();
  await expect(page.getByText("컬럼 6")).toBeVisible();
  await expect(page.getByRole("button", { name: "위젯 추가" })).toBeVisible();
  await expect(page.getByRole("button", { name: "매출 최대화" })).toBeVisible();
});
