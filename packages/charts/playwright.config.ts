import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  outputDir: "test/playwright/results",
  reporter: [["html", { open: "never", outputFolder: "test/playwright/html-report" }], ["list"]],
  testDir: "test/playwright/specs",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    reuseExistingServer: !process.env.CI,
    url: "http://127.0.0.1:5173",
  },
});
