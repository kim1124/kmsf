import { createSupabaseServerClient } from "@/lib/supabase/server";

export type GoogleIdentityLike = {
  identity_id: string;
  provider: string;
};

export type GoogleIdentityState = {
  isLinked: boolean;
  canUnlink: boolean;
  identity: GoogleIdentityLike | null;
};

export function summarizeGoogleIdentityState<TIdentity extends GoogleIdentityLike>(
  identities: TIdentity[],
) {
  const identity = identities.find((candidate) => candidate.provider === "google") ?? null;

  return {
    isLinked: Boolean(identity),
    canUnlink: Boolean(identity && identities.length > 1),
    identity,
  };
}

export async function getGoogleIdentityState() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUserIdentities();

  if (error) {
    return {
      state: summarizeGoogleIdentityState([]),
      error,
    };
  }

  return {
    state: summarizeGoogleIdentityState(data.identities),
    error: null,
  };
}
