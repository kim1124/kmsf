// AI-NOTE: scaffold() orchestrator — entry point of @kmsf/generator-core.
// IMMUTABLE step order:
//   1. ensureTemplateExists  →  TemplateMissing 에러 일찍 발생
//   2. isEmptyOrMissing      →  TargetExists 에러 일찍 발생
//   3. copyDir               →  파일 복사 (실패 시 partial dir cleanup)
//   4. applyAuthMode         →  모드별 파일 제거 + sign-in wholesale 교체 (Q1)
//   5. transformPackageJson  →  name 치환 + supabase dep 제거
//   6. substituteTokens      →  {{project_name}} 텍스트 치환
//   7. generateEnvLocal      →  .env.example → .env.local
//   8. (optional) install / playwright / git
// 순서를 바꾸면 token 치환이 supabase 제거된 자리에 적용되거나,
// transform이 미존재 파일을 건드리는 등의 비대칭 버그가 발생한다.
//
// post-install 실패는 throw 하지 않는다 (warnings 배열에 누적).
// 호출자가 사용자에게 surface하도록 ScaffoldResult.warnings에 담는다.

import { access, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";

import { copyDir } from "./copy.js";
import { applyAuthMode } from "./transforms/auth-mode.js";
import { transformPackageJson } from "./transforms/package-json.js";
import { applyI18nMode } from "./transforms/i18n.js";
import { applyGnbLayoutMode } from "./transforms/gnb-layout.js";
import { generateEnvLocal } from "./transforms/env.js";
import { substituteTokens } from "./transforms/tokens.js";
import { runGitInit } from "./post-install/git-init.js";
import { runInstall } from "./post-install/npm-install.js";
import { runPlaywrightInstall } from "./post-install/playwright-install.js";
import { TargetExistsError, TemplateMissingError, CopyFailedError } from "./errors.js";

import type { ScaffoldOptions, ScaffoldResult } from "./types.js";

const TEMPLATE_EXCLUDE = [
  "node_modules/**",
  ".next/**",
  "dist/**",
  ".DS_Store",
  "*.tsbuildinfo",
];

async function isEmptyOrMissing(p: string): Promise<boolean> {
  try {
    const entries = await readdir(p);
    return entries.length === 0;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return true;
    throw err;
  }
}

async function ensureTemplateExists(templateDir: string): Promise<void> {
  try {
    await access(templateDir);
  } catch {
    throw new TemplateMissingError(templateDir);
  }
}

async function restorePackedDotfiles(targetDir: string): Promise<void> {
  const pairs: Array<[placeholder: string, dotfile: string]> = [
    ["gitignore", ".gitignore"],
  ];

  for (const [placeholder, dotfile] of pairs) {
    const placeholderPath = path.join(targetDir, placeholder);
    const dotfilePath = path.join(targetDir, dotfile);

    try {
      await access(placeholderPath);
    } catch {
      continue;
    }

    try {
      await access(dotfilePath);
      await rm(placeholderPath, { force: true });
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
      await rename(placeholderPath, dotfilePath);
    }
  }
}

export async function scaffold(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const start = Date.now();
  const warnings: string[] = [];

  await ensureTemplateExists(options.templateDir);

  if (!(await isEmptyOrMissing(options.targetDir))) {
    throw new TargetExistsError(options.targetDir);
  }

  options.logger.step("Copying template");
  let filesCopied = 0;
  try {
    const copyResult = await copyDir(options.templateDir, options.targetDir, {
      exclude: TEMPLATE_EXCLUDE,
    });
    filesCopied = copyResult.fileCount;
    await restorePackedDotfiles(options.targetDir);
    options.logger.stepDone();
  } catch (err) {
    // cleanup partial dir
    await rm(options.targetDir, { recursive: true, force: true });
    throw new CopyFailedError(err);
  }

  options.logger.step(`Configuring auth: ${options.authMode}`);
  await applyAuthMode(options.targetDir, options.authMode);
  options.logger.stepDone();

  options.logger.step("Configuring package.json");
  await transformPackageJson(path.join(options.targetDir, "package.json"), {
    projectName: options.projectName,
    authMode: options.authMode,
    selectedPackages: options.selectedPackages,
  });
  options.logger.stepDone();

  if (!options.includeI18n) {
    options.logger.step("Configuring i18n: ko only");
    await applyI18nMode(options.targetDir, { includeI18n: options.includeI18n });
    options.logger.stepDone();
  }

  options.logger.step("Configuring GNB layout");
  await applyGnbLayoutMode(options.targetDir, { gnbRegions: options.gnbRegions });
  options.logger.stepDone();

  options.logger.step("Substituting tokens");
  await substituteTokens(options.targetDir, {
    tokens: { project_name: options.projectName },
    include: ["**/*.json", "**/*.md", "**/*.ts", "**/*.tsx"],
  });
  options.logger.stepDone();

  options.logger.step("Generating .env.local");
  await generateEnvLocal(options.targetDir, { authMode: options.authMode });
  options.logger.stepDone();

  if (options.runInstall) {
    options.logger.step(`Installing dependencies (${options.packageManager} install)`);
    const r = await runInstall(options.targetDir, options.packageManager);
    if (r.success) {
      options.logger.stepDone(r.durationMs);
    } else {
      options.logger.stepFailed(r.reason ?? "unknown");
      warnings.push(`install: ${r.reason}`);
    }
  }

  if (options.runPlaywrightInstall && options.runInstall) {
    options.logger.step("Installing Playwright browsers");
    const r = await runPlaywrightInstall(options.targetDir);
    if (r.success) {
      options.logger.stepDone();
    } else {
      options.logger.stepFailed(r.reason ?? "unknown");
      warnings.push(`playwright: ${r.reason}`);
    }
  }

  if (options.runGitInit) {
    options.logger.step("Initializing git repository");
    const r = await runGitInit(options.targetDir);
    if (r.success) {
      options.logger.stepDone();
    } else {
      options.logger.stepFailed(r.reason ?? "unknown");
      warnings.push(`git: ${r.reason}`);
    }
  }

  return {
    projectRoot: options.targetDir,
    filesCopied,
    durationMs: Date.now() - start,
    warnings,
  };
}

// public re-exports
export type {
  AuthMode,
  PackageManager,
  ScaffoldOptions,
  ScaffoldResult,
  ScaffoldLogger,
  KmsfPackageId,
  GnbRegion,
} from "./types.js";
export { TEMPLATE_CATALOG, getTemplate } from "./catalog.js";
export { KMSF_PACKAGE_OPTIONS, KMSF_PACKAGE_IDS, parseKmsfPackageList } from "./package-options.js";
export {
  ScaffoldError,
  InvalidProjectNameError,
  TargetExistsError,
  TemplateMissingError,
  CopyFailedError,
} from "./errors.js";
export { detectPackageManager } from "./post-install/npm-install.js";
export { validateProjectName } from "./transforms/package-json.js";
