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

  await expect(page.getByRole("navigation", { name: "채팅 목록" })).toBeVisible();
  await expect(page.getByRole("main", { name: "활성 채팅" })).toBeVisible();
  await expect(page.getByRole("button", { name: "채팅 설정 열기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "채팅 목록 접기" })).toBeVisible();
  await expect(page.getByLabel("@kmsf/chat playground").getByText("local")).toBeHidden();
  await expect(page.getByLabel("@kmsf/chat playground").getByText("ready")).toBeHidden();
  await expect(page.getByRole("button", { name: "챗봇 버튼 숨기기" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "채팅 목록 접기" }).click();
  await expect(page.getByRole("complementary", { name: "채팅 사이드바" })).toHaveAttribute("data-collapsed", "true");
  await page.getByRole("button", { name: "채팅 목록 펼치기" }).click();
  await expect(page.getByRole("complementary", { name: "채팅 사이드바" })).toHaveAttribute("data-collapsed", "false");

  await page.getByLabel("메시지 입력").fill("테스트 요청");
  await page.getByRole("button", { name: "전송" }).click();

  await expect(page.getByLabel("대화 내용").getByText("테스트 요청")).toBeVisible();
  await expect(page.getByText("첫 응답")).toBeVisible();
});

test("keeps thread item width while floating actions slide over the row", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ message: { content: "ok" }, done: true }),
      contentType: "application/x-ndjson",
    });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();
  await page.getByLabel("메시지 입력").fill("폭 유지 확인");
  await page.getByLabel("메시지 입력").press("Enter");

  const metricsBeforeHover = await page.evaluate(() => {
    const row = document.querySelector(".kmsf-chat-thread-row");
    const select = document.querySelector(".kmsf-chat-thread-select");
    const actions = document.querySelector(".kmsf-chat-thread-actions");
    if (!row || !select || !actions) {
      throw new Error("thread row was not rendered");
    }
    return {
      actionsPosition: getComputedStyle(actions).position,
      rowWidth: Math.round(row.getBoundingClientRect().width),
      selectWidth: Math.round(select.getBoundingClientRect().width),
    };
  });

  await page.getByRole("button", { name: "채팅 열기: 폭 유지 확인" }).hover();

  const metricsAfterHover = await page.evaluate(() => {
    const row = document.querySelector(".kmsf-chat-thread-row");
    const select = document.querySelector(".kmsf-chat-thread-select");
    if (!row || !select) {
      throw new Error("thread row was not rendered");
    }
    return {
      rowWidth: Math.round(row.getBoundingClientRect().width),
      selectWidth: Math.round(select.getBoundingClientRect().width),
    };
  });

  expect(metricsBeforeHover.actionsPosition).toBe("absolute");
  expect(metricsBeforeHover.selectWidth).toBe(metricsBeforeHover.rowWidth);
  expect(metricsAfterHover.selectWidth).toBe(metricsAfterHover.rowWidth);
  await expect(page.getByRole("button", { name: "채팅 제목 변경: 폭 유지 확인" })).toBeVisible();
});

test("aligns composer input and send button heights", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();

  const heights = await page.evaluate(() => {
    const textarea = document.querySelector(".kmsf-chat-composer textarea");
    const button = document.querySelector(".kmsf-chat-composer button");
    if (!textarea || !button) {
      throw new Error("composer was not rendered");
    }
    return {
      button: Math.round(button.getBoundingClientRect().height),
      textarea: Math.round(textarea.getBoundingClientRect().height),
    };
  });

  expect(heights.textarea).toBe(heights.button);
});

test("sends with Enter and keeps Shift Enter as newline", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ message: { content: "ok" }, done: true }),
      contentType: "application/x-ndjson",
    });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();

  await page.getByLabel("메시지 입력").fill("첫 줄");
  await page.getByLabel("메시지 입력").press("Shift+Enter");
  await page.getByLabel("메시지 입력").type("둘째 줄");
  await expect(page.getByLabel("메시지 입력")).toHaveValue("첫 줄\n둘째 줄");

  await page.getByLabel("메시지 입력").press("Enter");

  await expect(page.getByLabel("대화 내용").getByText("첫 줄")).toBeVisible();
  await expect(page.getByLabel("대화 내용").getByText("둘째 줄")).toBeVisible();
});

test("keeps failed chat turns in history after reload", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({ body: "failed", status: 500 });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();
  await page.getByLabel("메시지 입력").fill("실패 재현");
  await page.getByRole("button", { name: "전송" }).click();

  await expect(page.getByLabel("대화 내용").getByText("실패 재현")).toBeVisible();
  await expect(page.getByText("Ollama chat failed with 500.")).toBeVisible();

  await page.goto("/");
  await page.getByRole("button", { name: "채팅 열기: 실패 재현" }).click();

  await expect(page.getByLabel("대화 내용").getByText("실패 재현")).toBeVisible();
  await expect(page.getByText("Ollama chat failed with 500.")).toBeVisible();
});

test("creates, switches, and permanently deletes chat threads", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ message: { content: "ok" }, done: true }),
      contentType: "application/x-ndjson",
    });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();

  await page.getByLabel("메시지 입력").fill("첫 번째 대화");
  await page.getByLabel("메시지 입력").press("Enter");
  const firstThread = page.getByRole("button", { name: "채팅 열기: 첫 번째 대화" });
  await expect(firstThread).toBeVisible();
  await expect(firstThread).toHaveAttribute("aria-current", "page");
  await expect(firstThread).toHaveAttribute("data-active", "true");
  await expect(page.getByRole("button", { name: "채팅 제목 변경: 첫 번째 대화" })).toBeHidden();
  await firstThread.hover();
  await expect(page.getByRole("button", { name: "채팅 제목 변경: 첫 번째 대화" })).toBeVisible();
  await page.getByRole("button", { name: "채팅 제목 변경: 첫 번째 대화" }).click();
  await page.getByLabel("채팅 제목 입력: 첫 번째 대화").fill("변경된 대화");
  await page.getByLabel("채팅 제목 입력: 첫 번째 대화").press("Enter");
  await expect(page.getByRole("button", { name: "채팅 열기: 변경된 대화" })).toBeVisible();

  await page.getByRole("button", { name: "새 채팅" }).click();
  await expect(page.getByText("대화를 시작하려면 메시지를 입력하세요.")).toBeVisible();
  await page.getByLabel("메시지 입력").fill("두 번째 대화");
  await page.getByRole("button", { name: "전송" }).click();
  await expect(page.getByRole("button", { name: "채팅 열기: 두 번째 대화" })).toBeVisible();

  await page.getByRole("button", { name: "채팅 열기: 변경된 대화" }).click();
  await expect(page.getByLabel("대화 내용").getByText("첫 번째 대화")).toBeVisible();
  await page.getByRole("button", { name: "채팅 열기: 두 번째 대화" }).click();
  await expect(page.getByLabel("대화 내용").getByText("두 번째 대화")).toBeVisible();

  await page.getByRole("button", { name: "채팅 삭제: 두 번째 대화" }).click();
  const deleteDialog = page.getByRole("dialog", { name: "채팅 삭제" });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole("button", { name: "삭제" }).click();

  await expect(page.getByRole("button", { name: "채팅 열기: 두 번째 대화" })).toBeHidden();
  await expect(page.getByText("대화를 시작하려면 메시지를 입력하세요.")).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("button", { name: "채팅 열기: 두 번째 대화" })).toBeHidden();
  await expect(page.getByRole("button", { name: "채팅 열기: 변경된 대화" })).toBeVisible();
});
