import { expect, test } from "@playwright/test";

test("renders the generated starter home page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "KMSF React Starter" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Home" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Settings" }).first()).toBeVisible();
});
