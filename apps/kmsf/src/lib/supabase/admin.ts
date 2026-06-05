import { createClient } from "@supabase/supabase-js";

import { getSupabaseSecretKey, hasSupabaseSecretKey } from "@/lib/supabase/env";

export function createSupabaseAdminClient() {
  if (!hasSupabaseSecretKey()) {
    throw new Error("SUPABASE_SECRET_KEY is not configured.");
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
