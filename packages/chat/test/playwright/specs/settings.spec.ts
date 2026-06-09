import { expect, test } from "@playwright/test";

test("updates provider settings from dialog and settings page", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();

  await page.getByRole("button", { name: "설정" }).click();
  await page.getByLabel("Ollama URL").fill("http://127.0.0.1:11434");
  await page.getByLabel("수동 모델명").fill("manual-model");
  await page.getByRole("button", { name: "저장" }).click();

  await expect(page.getByText("manual-model")).toBeVisible();

  await page.getByRole("tab", { name: "설정 페이지" }).click();
  await expect(page.getByRole("heading", { name: "Chat Settings" })).toBeVisible();
  await expect(page.getByLabel("Ollama URL")).toHaveValue("http://127.0.0.1:11434");
});
