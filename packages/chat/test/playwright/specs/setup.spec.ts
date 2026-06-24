import { expect, test } from "@playwright/test";

test("shows setup success toast after local LLM setup completes", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();

  const toast = page.getByRole("status").filter({ hasText: "로컬 LLM 설정이 완료되었습니다." });
  await expect(toast).toBeVisible();
  await expect(page.locator(".kmsf-chat-status-banner")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "@kmsf/chat" })).toBeVisible();
  await expect(page.getByRole("tablist", { name: "예제 보기" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Local LLM Chat" })).toBeVisible();
  await expect(page.getByText("LLM 연결")).toBeVisible();
  await expect(page.getByText("성공")).toBeVisible();
  await expect(page.getByText(/연결 시간\s*:\s*\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/)).toBeVisible();
  await expect(page.getByRole("button", { name: "플로팅 채팅 열기" })).toBeVisible();
  await expect(toast).toBeHidden({ timeout: 4500 });
});

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
  await expect(page.getByRole("main", { name: "활성 채팅" }).getByText("supabase")).toBeVisible();
  await expect(page.getByText("LLM 연결")).toBeVisible();
  await expect(page.getByText("실패")).toBeVisible();
});
