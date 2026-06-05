import { spawnSync } from "node:child_process";

function readOption(argv, name, fallback) {
  const optionIndex = argv.indexOf(name);

  if (optionIndex === -1) {
    return fallback;
  }

  return argv[optionIndex + 1] ?? fallback;
}

const argv = process.argv.slice(2);
const duration = readOption(argv, "--duration", "60");
const interval = readOption(argv, "--interval", "10");
const grep = readOption(argv, "--grep", "");
const recordOnly = argv.includes("--record-only") ? "1" : "";
const types = readOption(argv, "--types", "");
const playwrightArgs = ["run", "test:e2e", "--", "test/playwright/specs/soak.spec.ts", "--project=chromium"];

if (grep) {
  playwrightArgs.push("-g", grep);
}

const result = spawnSync(
  "npm",
  playwrightArgs,
  {
    env: {
      ...process.env,
      KMSF_CHARTS_INCLUDE_SOAK: "1",
      KMSF_CHARTS_SOAK_DURATION: duration,
      KMSF_CHARTS_SOAK_INTERVAL: interval,
      KMSF_CHARTS_SOAK_RECORD_ONLY: recordOnly,
      KMSF_CHARTS_SOAK_TYPES: types,
    },
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
