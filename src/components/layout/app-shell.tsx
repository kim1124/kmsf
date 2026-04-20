"use client";

import type { ReactNode } from "react";

import { NotificationPopover } from "@/components/layout/_components/notification-popover";
import { ProfileMenu } from "@/components/layout/_components/profile-menu";
import { SidebarDrawer } from "@/components/layout/_components/sidebar-drawer";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { AppSessionUser } from "@/lib/auth/session";

export type NavItem = {
  href: string;
  icon: ReactNode;
  label: string;
  caption: string;
};

type AppShellProps = {
  children: ReactNode;
  navItems: NavItem[];
  locale: string;
  user: AppSessionUser;
  initialTheme: "light" | "dark";
  csrfToken: string;
};

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  navItems,
  locale,
  user,
  initialTheme,
  csrfToken,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-background text-foreground">
      <SidebarDrawer items={navItems} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden relative">
        <header className="border-b border-border bg-surface px-4 py-3 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">KMSF</h1>
            </div>
            <div className="flex items-center gap-2 [&>button]:cursor-pointer [&>div>button]:cursor-pointer">
              <ThemeToggle initialTheme={initialTheme} />
              <NotificationPopover />
              <ProfileMenu csrfToken={csrfToken} locale={locale} user={user} />
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background px-4 py-4 md:px-6 md:py-5 pb-20 md:pb-5">
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5">{children}</div>
        </main>
        
        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden absolute bottom-0 left-0 w-full border-t border-border bg-surface px-2 shadow-sm z-40 flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const active = pathname.includes(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 rounded-xl h-14 transition-colors",
                  "hover:bg-emerald-50 text-foreground/70",
                  active && "text-emerald-600 bg-emerald-50/50"
                )}
              >
                <div className="flex h-6 w-6 items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
