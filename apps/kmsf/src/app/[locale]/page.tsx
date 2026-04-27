import { redirect } from "next/navigation";

import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { getCurrentUser } from "@/lib/auth/session";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalePage({ params }: LocalePageProps) {
  await params;
  const user = await getCurrentUser();

  if (user && !(await isRequestAppSessionActive())) {
    redirect(formatAppSessionExpiryRoute("session-expired"));
  }

  redirect(user ? "/dashboard" : "/sign-in");
}
