import { NextResponse } from "next/server";

import { ensureManagerProfile } from "@/lib/supabase/manager";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next =
    requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const username =
        typeof user.user_metadata?.username === "string" && user.user_metadata.username
          ? user.user_metadata.username
          : user.email.split("@")[0];
      const avatarUrl =
        typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

      await ensureManagerProfile({
        id: user.id,
        username,
        email: user.email,
        avatarUrl,
      });
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
