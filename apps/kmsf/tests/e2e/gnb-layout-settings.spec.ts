import { expect, test } from "@playwright/test";

import { completeInitialSetupWizard } from "./utils/initial-setup";

test("runtime GNB settings are account-scoped, immediate, persistent, and desktop-only", async ({
  page,
}) => {
  const runId = `${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
  let storageUsername = "admin";

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("http://127.0.0.1:3000");
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/setup/initial-admin")) {
    await completeInitialSetupWizard(page, {
      email: `owner_${runId}@mailinator.com`,
      password: "admin00@!",
    });
    await page.waitForURL("**/dashboard", { timeout: 20_000 });
  } else if (page.url().includes("/sign-in")) {
    await page.goto("http://127.0.0.1:3000/sign-up");
    await page.waitForLoadState("networkidle");
    const username = `member${runId.slice(-6)}`;
    const password = "member00@!";
    storageUsername = username;
    await page.locator("#sign-up-username").fill(username);
    await page.locator("#sign-up-email").fill(`member_${runId}@mailinator.com`);
    await page.locator("#sign-up-password").fill(password);
    await page.locator("#sign-up-password-confirm").fill(password);
    await page.getByRole("button", { name: "회원 가입", exact: true }).click();
    await page.waitForURL("**/sign-in?success=registered", { timeout: 20_000 });
    await page.locator("#login-username").fill(username);
    await page.locator("#login-password").fill(password);
    await page.getByRole("button", { name: "로그인", exact: true }).click();
    await page.waitForURL("**/dashboard", { timeout: 20_000 });
  }

  await expect(page.locator("header")).toBeVisible();
  await expect(
    page.locator("aside").getByRole("link", { name: "설정", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("상단 GNB")).toHaveCount(0);
  await expect(page.getByLabel("하단 GNB")).toHaveCount(0);

  await page.goto("/settings?section=gnb");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: "GNB 설정" })).toBeVisible();

  const leftToggle = page.getByRole("checkbox", { name: /Left Side/ });
  const topToggle = page.getByRole("checkbox", { name: /TOP/ });
  const rightToggle = page.getByRole("checkbox", { name: /Right Side/ });
  const footerToggle = page.getByRole("checkbox", { name: /Footer/ });

  await expect(leftToggle).toBeChecked();
  await expect(leftToggle).toBeEnabled();
  await expect(topToggle).toBeChecked();
  await expect(rightToggle).not.toBeChecked();
  await expect(footerToggle).not.toBeChecked();

  await topToggle.uncheck();
  await expect(page.locator("header")).toBeHidden();
  await expect(
    page.locator("aside").getByRole("link", { name: "설정", exact: true }),
  ).toBeVisible();

  await rightToggle.check();
  const rightGnb = page.getByRole("complementary", { name: "우측 GNB" });
  await expect(rightGnb).toBeVisible();
  await expect(rightGnb.getByRole("link")).toHaveCount(0);

  const storageValue = await page.evaluate((username) =>
    window.localStorage.getItem(`kmsf:gnb-layout:${encodeURIComponent(username)}`),
    storageUsername,
  );
  expect(storageValue).toContain('"right"');
  expect(storageValue).toContain('"left"');
  expect(storageValue).not.toContain('"top"');

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("header")).toBeHidden();
  await expect(page.getByRole("complementary", { name: "우측 GNB" })).toBeVisible();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("header")).toBeVisible();
  await expect(page.getByRole("navigation").last()).toBeVisible();
});
