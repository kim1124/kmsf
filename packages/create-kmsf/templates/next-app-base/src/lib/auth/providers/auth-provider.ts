export type AuthProviderKind = "supabase" | "local-json";

type AuthProviderEnv = Partial<NodeJS.ProcessEnv>;

export function getAuthProviderKind(env: AuthProviderEnv = process.env): AuthProviderKind {
  const provider = env.KMSF_AUTH_PROVIDER;

  if (!provider || provider === "supabase") {
    return "supabase";
  }

  if (provider === "local-json") {
    return "local-json";
  }

  throw new Error(
    `Invalid KMSF_AUTH_PROVIDER="${provider}". Set KMSF_AUTH_PROVIDER to "local-json" or "supabase" before running the app.`,
  );
}

export function isLocalJsonAuthEnabled(env: AuthProviderEnv = process.env) {
  return getAuthProviderKind(env) === "local-json";
}
