import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { AuthProviderKind } from "@/lib/auth/providers/auth-provider";
import {
  DEFAULT_GNB_REGIONS,
  normalizeGnbLayoutConfig,
  type GnbLayoutConfig,
} from "@/lib/layout/gnb-layout-config";

const PROJECT_SETUP_CONFIG_VERSION = 2;
const LEGACY_PROJECT_SETUP_CONFIG_VERSION = 1;
const DEFAULT_SETUP_CONFIG_FILE = "setup.config.json";

export type DbMode =
  | "none"
  | "dev-local-db"
  | "sqlite"
  | "external-adapter"
  | "supabase";

export type AuthMode = "manual" | "kmsf-managed" | "supabase";
export type AppConfigStorageMode = "manual" | "local-storage" | "connected-db";
export type MenuSourceMode = "manual" | "app-routes" | "settings-ui";
type StoredAuthProviderKind = Exclude<AuthProviderKind, "manual">;
type ProjectSetupConfigCandidate = Partial<Omit<ProjectSetupConfig, "version">> & {
  version?: number;
};

export type ProjectSetupConfig = {
  appConfigStorageMode: AppConfigStorageMode;
  authMode: AuthMode;
  authProvider: StoredAuthProviderKind;
  dbMode: DbMode;
  gnbLayout: GnbLayoutConfig;
  menuSourceMode: MenuSourceMode;
  updatedAt: string;
  version: typeof PROJECT_SETUP_CONFIG_VERSION;
};

export type ProjectSetupConfigInput = {
  appConfigStorageMode?: AppConfigStorageMode;
  authMode: AuthMode;
  dbMode: DbMode;
  gnbLayout?: GnbLayoutConfig;
  menuSourceMode?: MenuSourceMode;
};

export function getProjectSetupConfigPath() {
  const fileName = process.env.KMSF_SETUP_CONFIG_FILE;
  const safeFileName =
    fileName && /^[A-Za-z0-9._-]+$/.test(fileName) ? fileName : DEFAULT_SETUP_CONFIG_FILE;

  return join(/*turbopackIgnore: true*/ process.cwd(), ".local", safeFileName);
}

function isDbMode(value: unknown): value is DbMode {
  return (
    value === "none" ||
    value === "dev-local-db" ||
    value === "sqlite" ||
    value === "external-adapter" ||
    value === "supabase"
  );
}

function isAuthMode(value: unknown): value is AuthMode {
  return value === "manual" || value === "kmsf-managed" || value === "supabase";
}

function isAppConfigStorageMode(value: unknown): value is AppConfigStorageMode {
  return value === "manual" || value === "local-storage" || value === "connected-db";
}

function isMenuSourceMode(value: unknown): value is MenuSourceMode {
  return value === "manual" || value === "app-routes" || value === "settings-ui";
}

function isStoredAuthProviderKind(value: unknown): value is StoredAuthProviderKind {
  return value === "supabase" || value === "local-json";
}

function resolveAuthProviderFromProfile(input: Pick<ProjectSetupConfig, "authMode" | "dbMode">) {
  return input.authMode === "supabase" || input.dbMode === "supabase"
    ? "supabase"
    : "local-json";
}

function buildProjectSetupConfig(input: ProjectSetupConfigInput): ProjectSetupConfig {
  const dbMode = isDbMode(input.dbMode) ? input.dbMode : "dev-local-db";
  const authMode = isAuthMode(input.authMode) ? input.authMode : "kmsf-managed";
  const appConfigStorageMode = isAppConfigStorageMode(input.appConfigStorageMode)
    ? input.appConfigStorageMode
    : dbMode === "none"
      ? "local-storage"
      : "connected-db";
  const menuSourceMode = isMenuSourceMode(input.menuSourceMode)
    ? input.menuSourceMode
    : "manual";
  const configBase = {
    appConfigStorageMode,
    authMode,
    dbMode,
    gnbLayout: normalizeGnbLayoutConfig(
      input.gnbLayout ?? { enabledRegions: [...DEFAULT_GNB_REGIONS] },
    ),
    menuSourceMode,
  };

  return {
    ...configBase,
    authProvider: resolveAuthProviderFromProfile(configBase),
    updatedAt: new Date().toISOString(),
    version: PROJECT_SETUP_CONFIG_VERSION,
  };
}

function parseLegacyProjectSetupConfig(
  candidate: ProjectSetupConfigCandidate,
): ProjectSetupConfig | null {
  if (candidate.version !== LEGACY_PROJECT_SETUP_CONFIG_VERSION) {
    return null;
  }

  if (!isStoredAuthProviderKind(candidate.authProvider)) {
    return null;
  }

  if (typeof candidate.updatedAt !== "string") {
    return null;
  }

  const dbMode = candidate.authProvider === "supabase" ? "supabase" : "dev-local-db";
  const authMode = candidate.authProvider === "supabase" ? "supabase" : "kmsf-managed";
  const config = buildProjectSetupConfig({
    appConfigStorageMode: "connected-db",
    authMode,
    dbMode,
    gnbLayout: candidate.gnbLayout,
    menuSourceMode: "manual",
  });

  return {
    ...config,
    updatedAt: candidate.updatedAt,
  };
}

function parseProjectSetupConfig(value: unknown): ProjectSetupConfig | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as ProjectSetupConfigCandidate;

  const legacyConfig = parseLegacyProjectSetupConfig(candidate);

  if (legacyConfig) {
    return legacyConfig;
  }

  if (candidate.version !== PROJECT_SETUP_CONFIG_VERSION) {
    return null;
  }

  if (!isDbMode(candidate.dbMode)) {
    return null;
  }

  if (!isAuthMode(candidate.authMode)) {
    return null;
  }

  if (!isAppConfigStorageMode(candidate.appConfigStorageMode)) {
    return null;
  }

  if (!isMenuSourceMode(candidate.menuSourceMode)) {
    return null;
  }

  if (typeof candidate.updatedAt !== "string") {
    return null;
  }

  return {
    appConfigStorageMode: candidate.appConfigStorageMode,
    authMode: candidate.authMode,
    authProvider: resolveAuthProviderFromProfile({
      authMode: candidate.authMode,
      dbMode: candidate.dbMode,
    }),
    dbMode: candidate.dbMode,
    gnbLayout: normalizeGnbLayoutConfig(candidate.gnbLayout),
    menuSourceMode: candidate.menuSourceMode,
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

export async function writeProjectSetupConfig(input: ProjectSetupConfigInput): Promise<ProjectSetupConfig>;
export async function writeProjectSetupConfig(
  authProvider: StoredAuthProviderKind,
  gnbLayout?: GnbLayoutConfig,
): Promise<ProjectSetupConfig>;
export async function writeProjectSetupConfig(
  inputOrAuthProvider: ProjectSetupConfigInput | StoredAuthProviderKind,
  gnbLayout?: GnbLayoutConfig,
) {
  const config =
    typeof inputOrAuthProvider === "string"
      ? buildProjectSetupConfig({
          appConfigStorageMode: "connected-db",
          authMode: inputOrAuthProvider === "supabase" ? "supabase" : "kmsf-managed",
          dbMode: inputOrAuthProvider === "supabase" ? "supabase" : "dev-local-db",
          gnbLayout,
          menuSourceMode: "manual",
        })
      : buildProjectSetupConfig(inputOrAuthProvider);
  const configPath = getProjectSetupConfigPath();

  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

  return config;
}

export async function clearProjectSetupConfig() {
  await rm(getProjectSetupConfigPath(), { force: true });
}
