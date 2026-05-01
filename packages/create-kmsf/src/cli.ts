import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import {
  scaffold,
  detectPackageManager,
  ScaffoldError,
  TargetExistsError,
} from "@kmsf/generator-core";

import { parseCliArgs, HELP_TEXT } from "./args.js";
import { resolveScaffoldOptions, AbortedError } from "./prompts.js";
import { renderBanner } from "./banner.js";
import { createLogger } from "./logger.js";

const require = createRequire(import.meta.url);
const PKG = require("../package.json") as { version: string };

function findTemplateRoot(): string {
  // dist/cli.js → dist/.. = packages/create-kmsf → ../../templates/next-app-base
  // when running from source: src/cli.ts → src/.. = packages/create-kmsf → ../../templates/next-app-base
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidate = path.resolve(here, "..", "..", "..", "templates", "next-app-base");
  return candidate;
}

export async function runCli(argv: string[] = process.argv.slice(2)): Promise<number> {
  const args = parseCliArgs(argv);

  if (args.help) {
    process.stdout.write(HELP_TEXT + "\n");
    return 0;
  }
  if (args.version) {
    process.stdout.write(PKG.version + "\n");
    return 0;
  }

  const color = !args.silent && process.stdout.isTTY;
  const level = args.verbose ? "debug" : args.silent ? "silent" : "info";

  const logger = createLogger({
    out: (s) => process.stdout.write(s),
    err: (s) => process.stderr.write(s),
    level,
    color,
  });

  if (!args.silent) {
    process.stdout.write(renderBanner({ version: PKG.version, color }));
  }

  let resolved;
  try {
    resolved = await resolveScaffoldOptions(args);
  } catch (e) {
    if (e instanceof AbortedError) {
      logger.warn("Aborted.");
      return 130;
    }
    throw e;
  }

  const targetDir = path.resolve(process.cwd(), resolved.projectName);
  const pm = detectPackageManager(process.env.npm_config_user_agent);

  try {
    const result = await scaffold({
      projectName: resolved.projectName,
      targetDir,
      templateDir: findTemplateRoot(),
      authMode: resolved.authMode,
      includeI18n: resolved.includeI18n,
      runInstall: resolved.runInstall,
      runGitInit: resolved.runGitInit,
      runPlaywrightInstall: resolved.runPlaywrightInstall,
      packageManager: pm,
      logger,
    });

    process.stdout.write("\n");
    logger.info(`✨ Done! Created ${resolved.projectName} at ${result.projectRoot}`);
    process.stdout.write("\n");
    logger.info("Next steps:");
    logger.info(`  cd ${resolved.projectName}`);
    if (!resolved.runInstall) {
      logger.info(`  ${pm} install`);
    }
    logger.info(`  ${pm} run dev`);

    if (result.warnings.length > 0) {
      process.stdout.write("\n");
      for (const w of result.warnings) logger.warn(w);
    }

    return 0;
  } catch (e) {
    if (e instanceof TargetExistsError) {
      logger.error(`Target directory not empty: ${e.path}`);
      logger.info("Choose a different name or delete the existing directory.");
      return 1;
    }
    if (e instanceof ScaffoldError) {
      logger.error(`${e.code}: ${e.message}`);
      return e.code === "TemplateMissing" ? 2 : 3;
    }
    logger.error(`Unexpected error: ${(e as Error).message}`);
    if (args.verbose) {
      process.stderr.write((e as Error).stack + "\n");
    }
    return 99;
  }
}

// allow direct invocation (when bin runs `node dist/cli.js`)
const isDirect = process.argv[1] === fileURLToPath(import.meta.url);
if (isDirect) {
  runCli().then(
    (code) => process.exit(code),
    (e) => {
      process.stderr.write(`Fatal: ${(e as Error).message}\n`);
      process.exit(99);
    },
  );
}
