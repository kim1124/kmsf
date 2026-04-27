export type AuthProviderKind = "supabase" | "local-json";

type AuthProviderEnv = Partial<NodeJS.ProcessEnv>;

export function getAuthProviderKind(env: AuthProviderEnv = process.env): AuthProviderKind {
  if (env.KMSF_AUTH_PROVIDER === "local-json") {
    return "local-json";
  }

  return "supabase";
}

export function isLocalJsonAuthEnabled(env: AuthProviderEnv = process.env) {
  return getAuthProviderKind(env) === "local-json";
}
