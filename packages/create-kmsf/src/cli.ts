// AI-NOTE: create-kmsf의 main entry point.
// 흐름: parseArgs → resolveScaffoldOptions(prompts) → scaffold() → 결과 출력.
//
// IMMUTABLE invariants:
//   - exit code 매핑: TargetExists=1, TemplateMissing=2,
//     기타 ScaffoldError/MissingRequiredOptions=3, AbortedError=130,
//     unexpected=99. cli.ts의 catch 블록이 단일 진실 소스.
//   - `--silent`는 banner/colors/log level만 끔. 누락된 prompt를 자동 채우지
//     않는다 (D-11). CI 사용자는 모든 인터랙티브 옵션을 flag로 제공해야 함.
//
// findTemplateRoot는 package-local template을 우선 사용한다. packed tarball,
// npx tarball URL, monorepo source 실행 모두 같은 resolver를 공유한다.

import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

import {
  scaffold,
  detectPackageManager,
  ScaffoldError,
  TargetExistsError,
} from "./generator-core/index.js";

import { parseCliArgs, HELP_TEXT } from "./args.js";
import {
  resolveScaffoldOptions,
  AbortedError,
  MissingRequiredOptionsError,
} from "./prompts.js";
import { renderBanner } from "./banner.js";
import { createLogger } from "./logger.js";

const require = createRequire(import.meta.url);
const PKG = require("../package.json") as { version: string };

function findTemplateRoot(templateId: string): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = path.resolve(here, "..");
  const bundled = path.join(packageRoot, "templates", templateId);
  if (existsSync(bundled)) return bundled;

  return path.resolve(packageRoot, "..", "..", "templates", templateId);
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
    if (e instanceof MissingRequiredOptionsError) {
      logger.error(e.message);
      return 3;
    }
    logger.error((e as Error).message);
    return 3;
  }

  const targetDir = path.resolve(process.cwd(), resolved.projectName);
  const pm = detectPackageManager(process.env.npm_config_user_agent);

  try {
    const result = await scaffold({
      projectName: resolved.projectName,
      targetDir,
      templateDir: findTemplateRoot(resolved.templateId),
      templateId: resolved.templateId,
      authMode: resolved.authMode,
      selectedPackages: resolved.selectedPackages,
      gnbRegions: resolved.gnbRegions,
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
