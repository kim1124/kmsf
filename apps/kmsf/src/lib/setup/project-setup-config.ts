import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { AuthProviderKind } from "@/lib/auth/providers/auth-provider";
import {
  normalizeGnbLayoutConfig,
  type GnbLayoutConfig,
} from "@/lib/layout/gnb-layout-config";

const PROJECT_SETUP_CONFIG_VERSION = 1;
const DEFAULT_SETUP_CONFIG_FILE = "setup.config.json";

export type ProjectSetupConfig = {
  authProvider: AuthProviderKind;
  gnbLayout: GnbLayoutConfig;
  updatedAt: string;
  version: typeof PROJECT_SETUP_CONFIG_VERSION;
};

export function getProjectSetupConfigPath() {
  const fileName = process.env.KMSF_SETUP_CONFIG_FILE;
  const safeFileName =
    fileName && /^[A-Za-z0-9._-]+$/.test(fileName) ? fileName : DEFAULT_SETUP_CONFIG_FILE;

  return join(/*turbopackIgnore: true*/ process.cwd(), ".local", safeFileName);
}

function parseProjectSetupConfig(value: unknown): ProjectSetupConfig | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<ProjectSetupConfig>;

  if (candidate.version !== PROJECT_SETUP_CONFIG_VERSION) {
    return null;
  }

  if (candidate.authProvider !== "supabase" && candidate.authProvider !== "local-json") {
    return null;
  }

  if (typeof candidate.updatedAt !== "string") {
    return null;
  }

  return {
    authProvider: candidate.authProvider,
    gnbLayout: normalizeGnbLayoutConfig(candidate.gnbLayout),
    updatedAt: candidate.updatedAt,
    version: PROJECT_SETUP_CONFIG_VERSION,
  };
}

export async function readProjectSetupConfig() {
  try {
    const raw = await readFile(getProjectSetupConfigPath(), "utf8");
    return parseProjectSetupConfig(JSON.parse(raw));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    console.error("readProjectSetupConfig failed", { error });
    return null;
  }
}

export async function writeProjectSetupConfig(
  authProvider: ProjectSetupConfig["authProvider"],
  gnbLayout?: GnbLayoutConfig,
) {
  const config: ProjectSetupConfig = {
    authProvider,
    gnbLayout: normalizeGnbLayoutConfig(gnbLayout),
    updatedAt: new Date().toISOString(),
    version: PROJECT_SETUP_CONFIG_VERSION,
  };
  const configPath = getProjectSetupConfigPath();

  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  return config;
}

export async function clearProjectSetupConfig() {
  await rm(getProjectSetupConfigPath(), { force: true });
}
