import { expect, test } from "@playwright/test";

test("hides floating chatbot before setup completion", async ({ page }) => {
  await page.goto("/?reset=1");

  await expect(page.getByRole("button", { name: "플로팅 채팅 열기" })).toBeHidden();
});

test("hides floating chatbot after setup when no effective model exists", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "kmsf.chat.setup",
      JSON.stringify({
        completed: true,
        settings: {
          baseUrl: "http://localhost:11434",
          manualModelEntryAllowed: true,
          manualModelName: "",
          modelDiscoveryStatus: "ready",
          provider: "ollama",
          selectedModel: null,
          storageMode: "local",
        },
      }),
    );
  });

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Local LLM Chat" })).toBeVisible();
  await expect(page.getByRole("button", { name: "플로팅 채팅 열기" })).toBeHidden();
});

test("opens, streams, closes, and saves floating session as recent thread", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      body: [
        JSON.stringify({ message: { content: "요약 " }, done: false }),
        JSON.stringify({ message: { content: "완료" }, done: true }),
      ].join("\n"),
      contentType: "application/x-ndjson",
    });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();

  await page.getByRole("button", { name: "플로팅 채팅 열기" }).click();
  await expect(page.getByRole("dialog", { name: "플로팅 채팅" })).toBeVisible();

  await page.getByLabel("플로팅 메시지 입력").fill("현재 설정 요약");
  await page.getByRole("button", { name: "플로팅 메시지 전송" }).click();
  await expect(page.getByRole("dialog", { name: "플로팅 채팅" }).getByText("현재 설정 요약")).toBeVisible();
  await expect(page.getByText("요약 완료")).toBeVisible();

  await page.getByRole("button", { name: "플로팅 채팅 닫기" }).hover();
  await expect(page.getByRole("button", { name: "플로팅 채팅 닫기" })).toHaveAttribute("data-hover-close", "true");
  await page.getByRole("button", { name: "플로팅 채팅 닫기" }).click();

  await expect(page.getByRole("dialog", { name: "플로팅 채팅" })).toBeHidden();
  await expect(page.getByRole("button", { name: "채팅 열기: 현재 설정 요약" })).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("button", { name: "채팅 열기: 현재 설정 요약" })).toBeVisible();
});

test("toggles and persists floating chatbot visibility", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();

  await expect(page.getByRole("button", { name: "플로팅 채팅 열기" })).toBeVisible();
  await page.getByRole("button", { name: "챗봇 버튼 숨기기" }).click();

  await expect(page.getByRole("button", { name: "플로팅 채팅 열기" })).toBeHidden();
  await expect(page.getByRole("button", { name: "챗봇 버튼 표시" })).toHaveAttribute("aria-pressed", "false");

  await page.goto("/");
  await expect(page.getByRole("button", { name: "플로팅 채팅 열기" })).toBeHidden();
  await page.getByRole("button", { name: "챗봇 버튼 표시" }).click();
  await expect(page.getByRole("button", { name: "플로팅 채팅 열기" })).toBeVisible();
});

test("drags floating chatbot button and restores coordinates after reload", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();

  const button = page.getByRole("button", { name: "플로팅 채팅 열기" });
  const initialBox = await button.boundingBox();
  expect(initialBox).not.toBeNull();

  await page.mouse.move(initialBox!.x + 24, initialBox!.y + 24);
  await page.mouse.down();
  await page.mouse.move(420, 280, { steps: 5 });
  await page.mouse.up();

  const movedBox = await button.boundingBox();
  expect(movedBox).not.toBeNull();
  expect(Math.round(movedBox!.x)).toBeLessThan(Math.round(initialBox!.x) - 200);
  expect(Math.round(movedBox!.y)).toBeLessThan(Math.round(initialBox!.y) - 100);
  expect(Math.round(movedBox!.x)).toBeGreaterThan(380);
  expect(Math.round(movedBox!.y)).toBeGreaterThan(240);

  await page.goto("/");
  const restoredBox = await page.getByRole("button", { name: "플로팅 채팅 열기" }).boundingBox();
  expect(restoredBox).not.toBeNull();
  expect(Math.round(restoredBox!.x)).toBe(Math.round(movedBox!.x));
  expect(Math.round(restoredBox!.y)).toBe(Math.round(movedBox!.y));
});
