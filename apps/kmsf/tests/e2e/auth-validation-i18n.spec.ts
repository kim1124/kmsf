import { expect, test } from "@playwright/test";

import { clickInitialSetupNext } from "./utils/initial-setup";

const baseURL = "http://127.0.0.1:3000";

async function expectTranslatedValidation(
  page: import("@playwright/test").Page,
  locale: "ko" | "en",
) {
  const expectedUsernameMessage =
    locale === "ko"
      ? "ID는 5자~32자의 영문, 숫자 또는 이메일 형식이어야 합니다."
      : "The ID must be 5-32 letters, numbers, or an email-style value.";
  const expectedEmailMessage =
    locale === "ko"
      ? "올바른 E-mail 주소를 입력해 주세요."
      : "Enter a valid E-mail address.";
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
    for (let step = 0; step < 2; step += 1) {
      if ((await page.locator("#initial-admin-email").count()) > 0) {
        break;
      }

      await clickInitialSetupNext(page);
    }
  }

  const isInitialSetupPage = page.url().includes("/setup/initial-admin");
  const passwordSelector = isInitialSetupPage ? "#initial-admin-password" : "#login-password";

  if (isInitialSetupPage) {
    await page.locator("#initial-admin-email").fill("kim");
  } else {
    await page.locator("#login-username").fill("kim");
  }
  await page.locator(passwordSelector).fill("1234");
  await expect(
    page.getByText(isInitialSetupPage ? expectedEmailMessage : expectedUsernameMessage, {
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(page.getByText(expectedPasswordMessage, { exact: true })).toHaveCount(0);
  await page.locator("body").click();

  await expect(
    page.getByText(isInitialSetupPage ? expectedEmailMessage : expectedUsernameMessage, {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(expectedPasswordMessage, { exact: true })).toBeVisible();
  await expect(page.getByText("username.invalid")).toHaveCount(0);
  await expect(page.getByText("email.invalid")).toHaveCount(0);
  await expect(page.getByText("password.invalid")).toHaveCount(0);
}

test("validation messages render translated text for ko and en locales", async ({ page }) => {
  await expectTranslatedValidation(page, "ko");
  await expectTranslatedValidation(page, "en");
});
