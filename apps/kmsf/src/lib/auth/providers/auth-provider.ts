export type AuthProviderKind = "manual" | "supabase" | "local-json";

type AuthProviderEnv = Partial<NodeJS.ProcessEnv>;

function hasSupabaseCredentials(env: AuthProviderEnv) {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && (env.SUPABASE_API_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
}

export function getAuthProviderKind(env: AuthProviderEnv = process.env): AuthProviderKind {
  if (env.KMSF_AUTH_PROVIDER === "manual") {
    return "manual";
  }

  if (env.KMSF_AUTH_PROVIDER === "local-json") {
    return "local-json";
  }

  if (!hasSupabaseCredentials(env)) {
    return "local-json";
  }

  return "supabase";
}

export function isLocalJsonAuthEnabled(env: AuthProviderEnv = process.env) {
  return getAuthProviderKind(env) === "local-json";
}
