import { expect, test } from "@playwright/test";

test("updates provider settings and storage mode from dialog", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();

  await page.getByRole("button", { name: "채팅 설정 열기" }).click();
  await expect(page.getByText("Local Storage")).toBeVisible();
  await expect(page.getByText("브라우저 localStorage에 저장합니다.")).toBeVisible();
  await expect(page.getByText("서버 .env의 Secret Key는 서버에서만 사용합니다.")).toBeVisible();
  await expect(page.getByText("브라우저에 Supabase Secret Key를 입력하거나 저장하지 않습니다.")).toBeVisible();
  await expect(page.getByLabel("설정 모델 선택")).toHaveValue("model-a");
  await page.getByLabel("Ollama URL").fill("http://127.0.0.1:11434");
  await page.getByLabel("Local DB").check();
  await expect(page.getByLabel("DB 종류")).toHaveValue("lowdb-json");
  await page.getByLabel("Host API endpoint").fill("/api/kmsf/chat-history");
  await page.getByLabel("Server DB path").fill("apps/kmsf/.local/chat.db.json");
  await page.getByLabel("설정 모델 선택").selectOption("");
  await page.getByLabel("수동 모델명").fill("manual-model");
  await page.getByRole("button", { name: "저장" }).click();

  await expect(page.getByText("manual-model")).toBeVisible();
  await expect(page.getByRole("main", { name: "활성 채팅" }).getByText("local-db")).toBeVisible();
  await expect(page.getByRole("tablist", { name: "예제 보기" })).toBeHidden();
});
