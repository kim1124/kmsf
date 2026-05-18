import { redirect } from "next/navigation";

import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { isLocalJsonAuthEnabled } from "@/lib/auth/providers/auth-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { isInitialSetupRequired } from "@/lib/supabase/manager";

export default async function RootPage() {
  const setupRequired = isLocalJsonAuthEnabled() ? false : await isInitialSetupRequired();
  const user = await getCurrentUser();

  if (user && !(await isRequestAppSessionActive())) {
    redirect(formatAppSessionExpiryRoute("session-expired"));
  }

  redirect(setupRequired ? "/setup/initial-admin" : user ? "/dashboard" : "/sign-in");
}
