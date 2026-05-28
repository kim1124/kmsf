import { expect, test } from "@playwright/test";

import { clickInitialSetupNext } from "./utils/initial-setup";

const baseURL = "http://127.0.0.1:3000";

async function expectTranslatedValidation(
  page: import("@playwright/test").Page,
  locale: "ko" | "en",
) {
  const expectedUsernameMessage =
    locale === "ko"
      ? "ID는 6자~32자의 영문, 숫자 또는 이메일 형식이어야 합니다."
      : "The ID must be 6-32 letters, numbers, or an email-style value.";
  const expectedPasswordMessage =
    locale === "ko"
      ? "비밀번호는 6자~32자의 영문, 숫자, 특수문자를 모두 포함해야 합니다."
      : "The password must be 6-32 characters and include letters, numbers, and special characters.";

  await page.context().clearCookies();

  if (locale === "en") {
    await page.context().addCookies([
      {
        name: "NEXT_LOCALE",
        value: "en",
        url: baseURL,
      },
    ]);
  }

  await page.goto(`${baseURL}/sign-in`);
  await page.waitForLoadState("networkidle");

  if (page.url().includes("/setup/initial-admin")) {
    await clickInitialSetupNext(page);
  }

  const usernameSelector = page.url().includes("/setup/initial-admin")
    ? "#initial-admin-username"
    : "#login-username";
  const passwordSelector = page.url().includes("/setup/initial-admin")
    ? "#initial-admin-password"
    : "#login-password";

  await page.locator(usernameSelector).fill("kim");
  await page.locator(passwordSelector).fill("1234");
  await page.locator("body").click();

  await expect(page.getByText(expectedUsernameMessage, { exact: true })).toBeVisible();
  await expect(page.getByText(expectedPasswordMessage, { exact: true })).toBeVisible();
  await expect(page.getByText("username.invalid")).toHaveCount(0);
  await expect(page.getByText("password.invalid")).toHaveCount(0);
}

test("validation messages render translated text for ko and en locales", async ({ page }) => {
  await expectTranslatedValidation(page, "ko");
  await expectTranslatedValidation(page, "en");
});
