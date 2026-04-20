import { BarChart3, LayoutDashboard, Settings, TableProperties } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getThemeCookie } from "@/lib/auth/demo-session";
import { getCurrentUser } from "@/lib/auth/session";
import { getCsrfToken } from "@/lib/security/csrf";
import { isInitialSetupRequired } from "@/lib/supabase/manager";

type ProtectedLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProtectedLayout({
  children,
  params,
}: ProtectedLayoutProps) {
  await params;
  const locale = "ko";
  const t = await getTranslations({ locale, namespace: "navigation" });
  const setupRequired = await isInitialSetupRequired();
  const user = await getCurrentUser();
  const theme = await getThemeCookie();
  const csrfToken = await getCsrfToken();

  if (setupRequired) {
    redirect("/setup/initial-admin");
  }

  if (!user) {
    redirect("/sign-in");
  }

  const navItems = [
    {
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: t("dashboard"),
      caption: t("dashboardCaption"),
    },
    {
      href: "/data-table-sample",
      icon: <TableProperties className="h-4 w-4" />,
      label: t("tableSample"),
      caption: t("tableSampleCaption"),
    },
    {
      href: "/chart-sample",
      icon: <BarChart3 className="h-4 w-4" />,
      label: t("chartSample"),
      caption: t("chartSampleCaption"),
    },
    {
      href: "/settings",
      icon: <Settings className="h-4 w-4" />,
      label: t("settings"),
      caption: t("settingsCaption"),
    },
  ];

  return (
    <AppShell
      csrfToken={csrfToken}
      initialTheme={theme}
      locale={locale}
      navItems={navItems}
      user={user}
    >
      {children}
    </AppShell>
  );
}
