"use client";

import { startTransition } from "react";
import { useRouter } from "next/navigation";

import type { AppLocale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type LanguageToggleProps = {
  locale: AppLocale;
};

function persistLocaleCookie(nextLocale: AppLocale) {
  document.cookie = `NEXT_LOCALE=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LanguageToggle({ locale }: LanguageToggleProps) {
  const router = useRouter();

  function changeLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      return;
    }

    persistLocaleCookie(nextLocale);

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      aria-label={locale === "ko" ? "언어 전환" : "Language switcher"}
      className="inline-flex h-10 items-center gap-1 rounded-full border border-border bg-surface-muted p-1"
      role="group"
    >
      {routing.locales.map((option) => {
        const active = option === locale;

        return (
          <button
            key={option}
            aria-label={option}
            aria-pressed={active}
            className={cn(
              "min-w-[42px] rounded-full px-3 py-1 text-xs font-semibold uppercase transition-colors",
              active
                ? "bg-emerald-500 text-white"
                : "text-foreground/70 hover:bg-surface hover:text-foreground",
            )}
            onClick={() => changeLocale(option)}
            type="button"
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
