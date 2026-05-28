import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const isCI = Boolean(process.env.CI);
const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === "1";
const webServerCommand =
  process.env.PLAYWRIGHT_WEB_SERVER_COMMAND ??
  "npm run dev:e2e";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  outputDir: "./reports/artifacts/playwright",
  fullyParallel: false,
  retries: isCI ? 1 : 0,
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: skipWebServer
    ? undefined
    : {
        command: webServerCommand,
        url: `${baseURL}/favicon.ico`,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
