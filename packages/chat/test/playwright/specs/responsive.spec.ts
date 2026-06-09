import { expect, test } from "@playwright/test";

test("keeps chat layout usable on mobile", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "mobile-model" }] } });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("mobile-model");
  await page.getByRole("button", { name: "채팅 시작" }).click();

  await expect(page.getByRole("heading", { name: "Local LLM Chat" })).toBeVisible();
  await expect(page.getByLabel("메시지 입력")).toBeVisible();
  await expect(page.getByRole("button", { name: "새 채팅" })).toBeVisible();
});
