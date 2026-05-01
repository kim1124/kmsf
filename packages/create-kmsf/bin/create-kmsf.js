#!/usr/bin/env node
// Loads compiled CLI from dist/. Run `npm run build` first.
import { runCli } from "../dist/cli.js";

runCli().then(
  (code) => process.exit(code),
  (e) => {
    process.stderr.write(`Fatal: ${e?.message ?? e}\n`);
    process.exit(99);
  },
);
