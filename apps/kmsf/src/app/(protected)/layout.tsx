import { BarChart3, LayoutDashboard, Settings, TableProperties } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { getThemeCookie } from "@/lib/auth/demo-session";
import { formatAppSessionExpiryRoute } from "@/lib/auth/app-session";
import { isRequestAppSessionActive } from "@/lib/auth/app-session.server";
import { getAppLocale } from "@/i18n/current-locale";
import { isLocalJsonAuthEnabled } from "@/lib/auth/providers/auth-provider";
import { getCurrentUser } from "@/lib/auth/session";
import { getCsrfToken } from "@/lib/security/csrf";
import { isInitialSetupRequired } from "@/lib/supabase/manager";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const locale = await getAppLocale();
  const t = await getTranslations({ locale, namespace: "navigation" });
  const setupRequired = isLocalJsonAuthEnabled() ? false : await isInitialSetupRequired();
  const user = await getCurrentUser();
  const theme = await getThemeCookie();
  const csrfToken = await getCsrfToken();
  // eslint-disable-next-line react-hooks/purity -- server-rendered footer seed must use request-time clock
  const initialServerTime = Date.now();

  if (setupRequired) {
    redirect("/setup/initial-admin");
  }

  if (user && !(await isRequestAppSessionActive())) {
    redirect(formatAppSessionExpiryRoute("session-expired"));
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
      initialServerTime={initialServerTime}
      locale={locale}
      navItems={navItems}
      user={user}
    >
      {children}
    </AppShell>
  );
}
