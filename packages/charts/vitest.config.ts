import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reportsDirectory: "test/vitest/coverage",
    },
    exclude: ["test/playwright/**", "node_modules/**", "dist/**"],
    passWithNoTests: true,
    reporters: ["default"],
  },
});
