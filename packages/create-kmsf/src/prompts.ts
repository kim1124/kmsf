import prompts from "prompts";
import { validateProjectName, type AuthMode } from "@kmsf/generator-core";

import type { ParsedArgs } from "./args.js";

export interface ResolvedOptions {
  projectName: string;
  authMode: AuthMode;
  includeI18n: boolean;
  runInstall: boolean;
  runGitInit: boolean;
  runPlaywrightInstall: boolean;
}

class AbortedError extends Error {
  constructor() {
    super("aborted");
    this.name = "AbortedError";
  }
}

export async function resolveScaffoldOptions(args: ParsedArgs): Promise<ResolvedOptions> {
  const questions: prompts.PromptObject[] = [];

  if (!args.projectName) {
    questions.push({
      type: "text",
      name: "projectName",
      message: "Project name",
      initial: "my-app",
      validate: (v: string) => {
        try {
          validateProjectName(v);
          return true;
        } catch (e) {
          return (e as Error).message;
        }
      },
    });
  }

  if (!args.authMode) {
    questions.push({
      type: "select",
      name: "authMode",
      message: "Auth mode",
      choices: [
        { title: "local-json (file-backed, no external service)", value: "local-json" },
        { title: "supabase (Supabase Auth)", value: "supabase" },
        { title: "none (no auth)", value: "none" },
      ],
      initial: 0,
    });
  }

  if (args.includeI18n === undefined) {
    questions.push({
      type: "toggle",
      name: "includeI18n",
      message: "Include i18n (ko/en)?",
      initial: true,
      active: "Yes",
      inactive: "No",
    });
  }

  if (args.runInstall === undefined) {
    questions.push({
      type: "toggle",
      name: "runInstall",
      message: "Run npm install?",
      initial: true,
      active: "Yes",
      inactive: "No",
    });
  }

  if (args.runGitInit === undefined) {
    questions.push({
      type: "toggle",
      name: "runGitInit",
      message: "Initialize git?",
      initial: true,
      active: "Yes",
      inactive: "No",
    });
  }

  if (args.runPlaywrightInstall === undefined) {
    questions.push({
      type: "toggle",
      name: "runPlaywrightInstall",
      message: "Install Playwright browsers?",
      initial: true,
      active: "Yes",
      inactive: "No",
    });
  }

  const answers = questions.length > 0
    ? await prompts(questions, { onCancel: () => false })
    : {};

  const merged = {
    projectName: args.projectName ?? (answers as { projectName?: string }).projectName,
    authMode: args.authMode ?? (answers as { authMode?: AuthMode }).authMode,
    includeI18n:
      args.includeI18n ?? (answers as { includeI18n?: boolean }).includeI18n,
    runInstall: args.runInstall ?? (answers as { runInstall?: boolean }).runInstall,
    runGitInit: args.runGitInit ?? (answers as { runGitInit?: boolean }).runGitInit,
    runPlaywrightInstall:
      args.runPlaywrightInstall ??
      (answers as { runPlaywrightInstall?: boolean }).runPlaywrightInstall,
  };

  if (
    !merged.projectName ||
    !merged.authMode ||
    merged.includeI18n === undefined ||
    merged.runInstall === undefined ||
    merged.runGitInit === undefined ||
    merged.runPlaywrightInstall === undefined
  ) {
    throw new AbortedError();
  }

  return merged as ResolvedOptions;
}

export { AbortedError };
