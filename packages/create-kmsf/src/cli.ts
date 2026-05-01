// AI-NOTE: create-kmsf의 main entry point.
// 흐름: parseArgs → resolveScaffoldOptions(prompts) → scaffold() → 결과 출력.
//
// IMMUTABLE invariants (도메인문서.md §3.5):
//   - exit code 매핑: TargetExists=1, TemplateMissing=2, 기타 ScaffoldError=3,
//     AbortedError=130, unexpected=99. cli.ts의 catch 블록이 단일 진실 소스.
//   - `--silent`는 banner/colors/log level만 끔. 누락된 prompt를 자동 채우지
//     않는다 (D-11). CI 사용자는 모든 인터랙티브 옵션을 flag로 제공해야 함.
//
// findTemplateRoot는 monorepo path 기반. dist/cli.js 또는 src/cli.ts 어디서
// 실행해도 ../../../templates/next-app-base를 가리킨다 (3단계 위로 = packages/
// create-kmsf → kmsf root → templates).
// npm publish 시 templates 번들링은 별도 PR 예정 (Q2).

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
