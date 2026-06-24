import { getAuthProviderKind, type AuthProviderKind } from "@/lib/auth/providers/auth-provider";
import { getSupabaseApiKey, getSupabaseSecretKey } from "@/lib/supabase/env";
import type { ProjectSetupConfig } from "@/lib/setup/project-setup-config";

type AuthProviderEnv = Partial<NodeJS.ProcessEnv>;

export type RuntimeAuthProviderReason =
  | "explicit-local-json"
  | "explicit-manual"
  | "missing-supabase-credentials"
  | "missing-supabase-service-role"
  | "stored-local-json"
  | "stored-manual"
  | "supabase-ready"
  | "supabase-unavailable";

export type RuntimeAuthProviderResult = {
  provider: AuthProviderKind;
  reason: RuntimeAuthProviderReason;
  attempts: number;
};

type RuntimeAuthProviderResolverOptions = {
  maxAttempts?: number;
  probeSupabase?: () => Promise<void>;
  readSetupConfig?: () => Promise<ProjectSetupConfig | null>;
};

export const SUPABASE_AUTH_PROBE_ATTEMPTS = 3;
export const SUPABASE_AUTH_PROBE_TIMEOUT_MS = 1_500;

async function readStoredProjectSetupConfig() {
  const { readProjectSetupConfig } = await import("@/lib/setup/project-setup-config");

  return readProjectSetupConfig();
}

async function probeSupabaseAuthHealth() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = getSupabaseApiKey() || getSupabaseSecretKey();

  if (!supabaseUrl || !key) {
    throw new Error("Supabase credentials are missing.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
    cache: "no-store",
    headers: {
      apikey: key,
    },
    signal: AbortSignal.timeout(SUPABASE_AUTH_PROBE_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Supabase Auth health probe failed with HTTP ${response.status}.`);
  }
}

export function createRuntimeAuthProviderResolver(
  options: RuntimeAuthProviderResolverOptions = {},
) {
  const maxAttempts = options.maxAttempts ?? SUPABASE_AUTH_PROBE_ATTEMPTS;
  const probeSupabase = options.probeSupabase ?? probeSupabaseAuthHealth;
  const readSetupConfig = options.readSetupConfig ?? readStoredProjectSetupConfig;

  return async function resolveRuntimeAuthProvider(
    env: AuthProviderEnv = process.env,
  ): Promise<RuntimeAuthProviderResult> {
    const configuredProvider = getAuthProviderKind(env);

    if (configuredProvider === "manual") {
      return {
        provider: "manual",
        reason: "explicit-manual",
        attempts: 0,
      };
    }

    if (env.KMSF_AUTH_PROVIDER === "local-json") {
      return {
        provider: "local-json",
        reason: "explicit-local-json",
        attempts: 0,
      };
    }

    const setupConfig = await readSetupConfig();

    if (setupConfig?.authMode === "manual") {
      return {
        provider: "manual",
        reason: "stored-manual",
        attempts: 0,
      };
    }

    if (setupConfig?.authProvider === "local-json") {
      return {
        provider: "local-json",
        reason: "stored-local-json",
        attempts: 0,
      };
    }

    if (configuredProvider === "local-json") {
      return {
        provider: "local-json",
        reason: "missing-supabase-credentials",
        attempts: 0,
      };
    }

    if (!env.SUPABASE_SECRET_KEY) {
      return {
        provider: "local-json",
        reason: "missing-supabase-service-role",
        attempts: 0,
      };
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await probeSupabase();

        return {
          provider: "supabase",
          reason: "supabase-ready",
          attempts: attempt,
        };
      } catch (error) {
        if (attempt === maxAttempts) {
          console.error("Supabase auth provider probe failed; falling back to local-json", {
            attempts: attempt,
            error,
          });
        }
      }
    }

    return {
      provider: "local-json",
      reason: "supabase-unavailable",
      attempts: maxAttempts,
    };
  };
}

function buildRuntimeAuthProviderCacheKey(env: AuthProviderEnv) {
  return [
    env.KMSF_AUTH_PROVIDER ?? "",
    env.KMSF_SETUP_CONFIG_PATH ?? "",
    env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    env.SUPABASE_API_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    env.SUPABASE_SECRET_KEY ? "secret-key" : "",
  ].join("|");
}

export function createCachedRuntimeAuthProviderResolver(
  options: RuntimeAuthProviderResolverOptions = {},
) {
  const resolveProvider = createRuntimeAuthProviderResolver(options);
  let cached:
    | {
        key: string;
        promise: Promise<RuntimeAuthProviderResult>;
      }
    | null = null;

  async function resolveCachedRuntimeAuthProvider(
    env: AuthProviderEnv = process.env,
  ): Promise<RuntimeAuthProviderResult> {
    const key = buildRuntimeAuthProviderCacheKey(env);

    if (cached?.key === key) {
      return cached.promise;
    }

    const promise = resolveProvider(env).catch((error) => {
      if (cached?.key === key) {
        cached = null;
      }

      throw error;
    });
    cached = { key, promise };

    return promise;
  }

  resolveCachedRuntimeAuthProvider.reset = () => {
    cached = null;
  };

  return resolveCachedRuntimeAuthProvider;
}

const cachedRuntimeAuthProviderResolver = createCachedRuntimeAuthProviderResolver();

export const resolveRuntimeAuthProvider = cachedRuntimeAuthProviderResolver;

export function resetRuntimeAuthProviderCache() {
  cachedRuntimeAuthProviderResolver.reset();
}

export async function isRuntimeLocalJsonAuthEnabled() {
  return (await resolveRuntimeAuthProvider()).provider === "local-json";
}
