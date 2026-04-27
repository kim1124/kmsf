import { NextResponse } from "next/server";

import {
  formatAppSessionRedirectHref,
} from "@/lib/auth/app-session";
import { clearAppSessionCookie } from "@/lib/auth/app-session.server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedReason = url.searchParams.get("reason");
  const reason = requestedReason === "session-reset" ? "session-reset" : "session-expired";

  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  await clearAppSessionCookie();

  return NextResponse.redirect(new URL(formatAppSessionRedirectHref(reason), request.url));
}
