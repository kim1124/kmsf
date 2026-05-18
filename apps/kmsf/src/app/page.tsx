import { redirect } from "next/navigation";

import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { getCurrentUser } from "@/lib/auth/session";
import { isInitialSetupRequired } from "@/lib/supabase/manager";

export default async function RootPage() {
  const setupRequired = await isInitialSetupRequired();
  const user = await getCurrentUser();

  if (user && !(await isRequestAppSessionActive())) {
    redirect(formatAppSessionExpiryRoute("session-expired"));
  }

  redirect(setupRequired ? "/setup/initial-admin" : user ? "/dashboard" : "/sign-in");
}
