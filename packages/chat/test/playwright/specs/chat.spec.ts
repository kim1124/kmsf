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
  await expect(page.getByText("User", { exact: true })).toBeHidden();
  await expect(page.getByText("Assistant", { exact: true })).toBeHidden();

  const bubbleStyles = await page.evaluate(() => {
    const user = document.querySelector(".kmsf-chat-message--user");
    const assistant = document.querySelector(".kmsf-chat-message--assistant");
    if (!user || !assistant) {
      throw new Error("message bubbles were not rendered");
    }
    return {
      assistantBackground: getComputedStyle(assistant).backgroundColor,
      userBackground: getComputedStyle(user).backgroundColor,
      userColor: getComputedStyle(user).color,
    };
  });
  expect(bubbleStyles.userBackground).not.toBe(bubbleStyles.assistantBackground);
  expect(bubbleStyles.userColor).toBe("rgb(255, 255, 255)");
});

test("shows animated pending dots while assistant response is pending", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });
  await page.route("**/api/chat", async () => {
    await new Promise(() => {});
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();

  await page.getByLabel("메시지 입력").fill("대기 표시 확인");
  await page.getByRole("button", { name: "전송" }).click();

  const pendingDots = page.locator(".kmsf-chat-pending-dots");
  await expect(pendingDots).toBeVisible();
  await expect(pendingDots.locator("span")).toHaveCount(3);
});

test("resizes, clamps, and persists the left sidebar width", async ({ page }) => {
  await page.route("**/api/tags", async (route) => {
    await route.fulfill({ contentType: "application/json", json: { models: [{ name: "model-a" }] } });
  });

  await page.goto("/?reset=1");
  await page.getByLabel("모델 선택").selectOption("model-a");
  await page.getByRole("button", { name: "채팅 시작" }).click();

  const shell = page.locator(".kmsf-chat-shell");
  const sidebar = page.getByRole("complementary", { name: "채팅 사이드바" });
  const handle = page.getByRole("separator", { name: "채팅 목록 너비 조절" });
  await expect(handle).toBeVisible();

  const initialWidth = await sidebar.evaluate((element) => Math.round(element.getBoundingClientRect().width));
  expect(initialWidth).toBe(300);

  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();
  const startX = handleBox!.x + handleBox!.width / 2;
  const startY = handleBox!.y + handleBox!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 80, startY, { steps: 4 });
  await page.mouse.up();

  await expect.poll(async () => sidebar.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(380);
  await expect(shell).toHaveCSS("--kmsf-chat-sidebar-width", "380px");

  await page.goto("/");
  await expect.poll(async () => sidebar.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(380);

  const maxWidth = await page.evaluate(() => Math.floor(window.innerWidth * 0.35));
  const restoredHandleBox = await handle.boundingBox();
  expect(restoredHandleBox).not.toBeNull();
  const maxStartX = restoredHandleBox!.x + restoredHandleBox!.width / 2;
  const maxStartY = restoredHandleBox!.y + 20;
  await page.mouse.move(maxStartX, maxStartY);
  await page.mouse.down();
  await page.mouse.move(maxStartX + 700, maxStartY, { steps: 4 });
  await page.mouse.up();
  await expect.poll(async () => sidebar.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(maxWidth);

  const maxedHandleBox = await handle.boundingBox();
  expect(maxedHandleBox).not.toBeNull();
  const minStartX = maxedHandleBox!.x + maxedHandleBox!.width / 2;
  const minStartY = maxedHandleBox!.y + 20;
  await page.mouse.move(minStartX, minStartY);
  await page.mouse.down();
  await page.mouse.move(minStartX - 700, minStartY, { steps: 4 });
  await page.mouse.up();
  await expect.poll(async () => sidebar.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(200);
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

test("keeps thread title readable at the minimum sidebar width", async ({ page }) => {
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

  const handle = page.getByRole("separator", { name: "채팅 목록 너비 조절" });
  const sidebar = page.getByRole("complementary", { name: "채팅 사이드바" });
  const handleBox = await handle.boundingBox();
  expect(handleBox).not.toBeNull();
  const startX = handleBox!.x + handleBox!.width / 2;
  const startY = handleBox!.y + 20;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 700, startY, { steps: 4 });
  await page.mouse.up();
  await expect.poll(async () => sidebar.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(200);

  const longTitle = "최소 폭에서도 채팅방 이름이 충분히 보여야 하는 긴 제목";
  await page.getByLabel("메시지 입력").fill(longTitle);
  await page.getByLabel("메시지 입력").press("Enter");
  const threadButton = page.getByRole("button", { name: `채팅 열기: ${longTitle}` });
  await expect(threadButton).toBeVisible();

  const metrics = await page.evaluate(() => {
    const sidebarElement = document.querySelector(".kmsf-chat-sidebar");
    const row = document.querySelector(".kmsf-chat-thread-row");
    const select = document.querySelector(".kmsf-chat-thread-select");
    const title = document.querySelector(".kmsf-chat-thread-select span");
    const actions = document.querySelector(".kmsf-chat-thread-actions");
    if (!sidebarElement || !row || !select || !title || !actions) {
      throw new Error("minimum sidebar thread row was not rendered");
    }

    const sidebarRect = sidebarElement.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const selectRect = select.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const actionsRect = actions.getBoundingClientRect();
    const styles = getComputedStyle(select);

    return {
      actionsRightGap: Math.round(sidebarRect.right - actionsRect.right),
      paddingRight: Number.parseFloat(styles.paddingRight),
      rowInsideSidebar: rowRect.left >= sidebarRect.left - 1 && rowRect.right <= sidebarRect.right + 1,
      rowWidth: Math.round(rowRect.width),
      selectWidth: Math.round(selectRect.width),
      titleWidth: Math.round(titleRect.width),
    };
  });

  expect(metrics.rowInsideSidebar, JSON.stringify(metrics)).toBe(true);
  expect(metrics.selectWidth, JSON.stringify(metrics)).toBe(metrics.rowWidth);
  expect(metrics.titleWidth, JSON.stringify(metrics)).toBeGreaterThanOrEqual(Math.round(metrics.selectWidth * 0.5));
  expect(metrics.paddingRight, JSON.stringify(metrics)).toBeLessThanOrEqual(48);

  await threadButton.hover();
  await expect(page.getByRole("button", { name: `채팅 제목 변경: ${longTitle}` })).toBeVisible();
  await expect(page.getByRole("button", { name: `채팅 삭제: ${longTitle}` })).toBeVisible();

  const activeStyles = await threadButton.evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    color: getComputedStyle(element).color,
  }));
  expect(activeStyles.background).not.toBe("rgba(0, 0, 0, 0)");
  expect(activeStyles.color).toBe("rgb(255, 255, 255)");
});

test("uses late ellipsis and borderless destructive hover actions for sidebar threads", async ({ page }) => {
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

  const title = "채팅 메뉴 여백 동적 처리 확인";
  await page.getByLabel("메시지 입력").fill(title);
  await page.getByLabel("메시지 입력").press("Enter");
  const threadButton = page.getByRole("button", { name: `채팅 열기: ${title}` });
  await expect(threadButton).toBeVisible();

  const normalMetrics = await threadButton.evaluate((element) => {
    const row = element.closest(".kmsf-chat-thread-row");
    const titleElement = element.querySelector("span");
    if (!row || !titleElement) {
      throw new Error("thread row was not rendered");
    }

    return {
      paddingRight: Number.parseFloat(getComputedStyle(element).paddingRight),
      rowBackground: getComputedStyle(row).backgroundColor,
      selectBackground: getComputedStyle(element).backgroundColor,
      textColor: getComputedStyle(element).color,
      width: Math.round(element.getBoundingClientRect().width),
    };
  });

  expect(normalMetrics.paddingRight, JSON.stringify(normalMetrics)).toBeLessThanOrEqual(8);
  expect(normalMetrics.selectBackground).toBe(normalMetrics.rowBackground);
  expect(normalMetrics.textColor).toBe("rgb(255, 255, 255)");

  await threadButton.hover();

  const hoverMetrics = await page.evaluate((threadTitle) => {
    const row = document.querySelector(".kmsf-chat-thread-row");
    const select = document.querySelector(".kmsf-chat-thread-select");
    const edit = document.querySelector(`button[aria-label="채팅 제목 변경: ${threadTitle}"]`);
    const remove = document.querySelector(`button[aria-label="채팅 삭제: ${threadTitle}"]`);
    if (!row || !select || !edit || !remove) {
      throw new Error("thread actions were not rendered");
    }

    return {
      deleteBorderWidth: getComputedStyle(remove).borderTopWidth,
      deleteColor: getComputedStyle(remove).color,
      editBorderWidth: getComputedStyle(edit).borderTopWidth,
      paddingRight: Number.parseFloat(getComputedStyle(select).paddingRight),
      rowWidth: Math.round(row.getBoundingClientRect().width),
      selectWidth: Math.round(select.getBoundingClientRect().width),
    };
  }, title);

  expect(hoverMetrics.paddingRight, JSON.stringify(hoverMetrics)).toBeGreaterThanOrEqual(80);
  expect(hoverMetrics.selectWidth).toBe(hoverMetrics.rowWidth);
  expect(hoverMetrics.editBorderWidth).toBe("0px");
  expect(hoverMetrics.deleteBorderWidth).toBe("0px");
  expect(hoverMetrics.deleteColor).toBe("rgb(239, 68, 68)");

  await page.getByRole("button", { name: `채팅 삭제: ${title}` }).hover();
  const deleteHoverBackground = await page
    .getByRole("button", { name: `채팅 삭제: ${title}` })
    .evaluate((element) => getComputedStyle(element).backgroundColor);
  expect(deleteHoverBackground).not.toBe(normalMetrics.selectBackground);
});

test("blocks only the main content with a spinner while uncached thread messages load", async ({ page }) => {
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

  await page.getByLabel("메시지 입력").fill("느린 로딩 첫 번째 대화");
  await page.getByLabel("메시지 입력").press("Enter");
  await page.getByRole("button", { name: "새 채팅" }).click();
  await page.getByLabel("메시지 입력").fill("느린 로딩 두 번째 대화");
  await page.getByLabel("메시지 입력").press("Enter");

  await page.goto("/?slowHistory=1");
  await expect(page.getByRole("button", { name: "채팅 열기: 느린 로딩 첫 번째 대화" })).toBeVisible();
  await page.getByRole("button", { name: "채팅 열기: 느린 로딩 첫 번째 대화" }).click();

  const main = page.getByRole("main", { name: "활성 채팅" });
  await expect(main).toHaveAttribute("aria-busy", "true");
  await expect(page.getByLabel("채팅 메시지 로딩 중")).toBeVisible();
  await expect(page.getByLabel("메시지 입력")).toBeDisabled();
  await expect(page.getByRole("button", { name: "새 채팅" })).toBeEnabled();

  await expect(page.getByLabel("대화 내용").getByText("느린 로딩 첫 번째 대화")).toBeVisible();
  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(page.getByLabel("채팅 메시지 로딩 중")).toBeHidden();
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
