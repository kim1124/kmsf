import prompts from "prompts";
import {
  validateProjectName,
  getTemplate,
  TEMPLATE_CATALOG,
  type AuthMode,
  type GnbRegion,
  type KmsfPackageId,
  type TemplateId,
} from "./generator-core/index.js";
import {
  DEFAULT_GNB_REGION_IDS,
  GNB_REGION_IDS,
} from "./generator-core/gnb-layout-options.js";
import { KMSF_PACKAGE_OPTIONS } from "./generator-core/package-options.js";

import type { ParsedArgs } from "./args.js";

export interface ResolvedOptions {
  projectName: string;
  templateId: TemplateId;
  authMode: AuthMode;
  selectedPackages: KmsfPackageId[];
  gnbRegions: GnbRegion[];
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

class MissingRequiredOptionsError extends Error {
  constructor(missing: string[]) {
    super(`--silent requires all interactive options. Missing: ${missing.join(", ")}`);
    this.name = "MissingRequiredOptionsError";
  }
}

export async function resolveScaffoldOptions(args: ParsedArgs): Promise<ResolvedOptions> {
  if (args.silent) {
    const missing = [
      !args.projectName ? "project name" : null,
      !args.authMode ? "--auth" : null,
      args.selectedPackages === undefined ? "--packages or --no-packages" : null,
      args.gnbRegions === undefined ? "--layout" : null,
      args.includeI18n === undefined ? "--i18n or --no-i18n" : null,
      args.runInstall === undefined ? "--install or --no-install" : null,
      args.runGitInit === undefined ? "--git or --no-git" : null,
      args.runPlaywrightInstall === undefined ? "--playwright or --no-playwright" : null,
    ].filter((value): value is string => value !== null);

    if (missing.length > 0) {
      throw new MissingRequiredOptionsError(missing);
    }
  }

  const initialQuestions: prompts.PromptObject[] = [];

  if (!args.projectName) {
    initialQuestions.push({
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

  if (!args.templateId && !args.silent) {
    initialQuestions.push({
      type: "select",
      name: "templateId",
      message: "Starter template",
      choices: Object.values(TEMPLATE_CATALOG).map((template) => ({
        title: template.name,
        value: template.id,
      })),
      initial: 0,
    });
  }

  const initialAnswers = initialQuestions.length > 0
    ? await prompts(initialQuestions, { onCancel: () => false })
    : {};

  const templateId =
    args.templateId ??
    (initialAnswers as { templateId?: TemplateId }).templateId ??
    "next-app-base";
  const template = getTemplate(templateId);

  const questions: prompts.PromptObject[] = [];

  if (!args.authMode) {
    questions.push({
      type: "select",
      name: "authMode",
      message: "Auth mode",
      choices: template.supportedAuthModes.map((mode) => ({
        title: formatAuthChoice(mode),
        value: mode,
      })),
      initial: Math.max(0, template.supportedAuthModes.indexOf(template.defaultAuthMode)),
    });
  }

  if (args.selectedPackages === undefined) {
    questions.push({
      type: "multiselect",
      name: "selectedPackages",
      message: "Optional KMSF packages",
      choices: KMSF_PACKAGE_OPTIONS.map((option) => ({
        title: option.title,
        value: option.id,
        selected: false,
      })),
      hint: "- Space to select. Return to continue.",
    });
  }

  if (args.gnbRegions === undefined) {
    questions.push({
      type: "multiselect",
      name: "gnbRegions",
      message: "GNB layout regions",
      choices: GNB_REGION_IDS.map((region) => ({
        title: region,
        value: region,
        selected: DEFAULT_GNB_REGION_IDS.includes(region),
      })),
      hint: "- Space to select. Return to continue.",
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
    projectName:
      args.projectName ??
      (initialAnswers as { projectName?: string }).projectName,
    templateId,
    authMode:
      args.authMode ??
      (answers as { authMode?: AuthMode }).authMode,
    selectedPackages:
      args.selectedPackages ??
      (answers as { selectedPackages?: KmsfPackageId[] }).selectedPackages,
    gnbRegions:
      args.gnbRegions ??
      (answers as { gnbRegions?: GnbRegion[] }).gnbRegions,
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
    !merged.templateId ||
    !merged.authMode ||
    merged.selectedPackages === undefined ||
    merged.gnbRegions === undefined ||
    merged.includeI18n === undefined ||
    merged.runInstall === undefined ||
    merged.runGitInit === undefined ||
    merged.runPlaywrightInstall === undefined
  ) {
    throw new AbortedError();
  }

  if (!template.supportedAuthModes.includes(merged.authMode)) {
    throw new Error(`auth mode ${merged.authMode} is not supported by template ${template.id}`);
  }

  return merged as ResolvedOptions;
}

export { AbortedError, MissingRequiredOptionsError };

function formatAuthChoice(mode: AuthMode): string {
  switch (mode) {
    case "local-json":
      return "local-json (file-backed, no external service)";
    case "supabase":
      return "supabase (Supabase Auth)";
    case "later":
      return "later (keep auth skeleton, choose provider after scaffold)";
    case "none":
      return "none (no auth)";
  }
}
