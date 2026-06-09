import { expect, test } from "@playwright/test";

test("sends a prompt and renders streamed assistant output", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: { models: [{ name: "model-a" }, { name: "model-b" }] },
    });
  });
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      body: [
        JSON.stringify({ message: { content: "첫 " }, done: false }),
        JSON.stringify({ message: { content: "응답" }, done: true }),
      ].join("\n"),
      contentType: "application/x-ndjson",
    });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();
  await page.getByLabel("메시지 입력").fill("테스트 요청");
  await page.getByRole("button", { name: "전송" }).click();

  await expect(page.getByLabel("대화 내용").getByText("테스트 요청")).toBeVisible();
  await expect(page.getByText("첫 응답")).toBeVisible();
});
