import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist", "coverage", "playwright-report", "test-results"],
  },
  ...tseslint.configs.recommended,
];
