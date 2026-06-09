import { expect, test } from "@playwright/test";

test("requires model selection and supports manual fallback before entering chat", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ body: "offline", status: 503 });
  });

  await page.goto("/?reset=1");

  await expect(page.getByRole("heading", { name: "@kmsf/chat" })).toBeVisible();
  await expect(page.getByText("모델 목록을 불러올 수 없습니다.")).toBeVisible();
  await expect(page.getByRole("button", { name: "채팅 시작" })).toBeDisabled();

  await page.getByLabel("수동 모델명").fill("llama3.2");
  await page.getByLabel("Supabase").check();
  await page.getByRole("button", { name: "채팅 시작" }).click();

  await expect(page.getByRole("heading", { name: "Local LLM Chat" })).toBeVisible();
  await expect(page.getByText("llama3.2")).toBeVisible();
  await expect(page.getByText("supabase")).toBeVisible();
});
