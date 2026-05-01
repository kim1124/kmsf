import { access, readdir, rm } from "node:fs/promises";
import path from "node:path";

import { copyDir } from "./copy.js";
import { applyAuthMode } from "./transforms/auth-mode.js";
import { transformPackageJson } from "./transforms/package-json.js";
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
  });
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
} from "./types.js";
export { TEMPLATE_CATALOG, getTemplate } from "./catalog.js";
export {
  ScaffoldError,
  InvalidProjectNameError,
  TargetExistsError,
  TemplateMissingError,
  CopyFailedError,
} from "./errors.js";
export { detectPackageManager } from "./post-install/npm-install.js";
export { validateProjectName } from "./transforms/package-json.js";
