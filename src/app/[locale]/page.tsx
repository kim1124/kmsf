import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/session";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocalePage({ params }: LocalePageProps) {
  await params;
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/sign-in");
}
