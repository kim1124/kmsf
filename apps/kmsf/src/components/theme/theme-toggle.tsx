"use client";

import { Moon, SunMedium } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

type ThemeToggleProps = {
  initialTheme: Theme;
};

export function ThemeToggle({ initialTheme }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  function setDocumentTheme(nextTheme: Theme) {
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    setTheme(nextTheme);
  }

  const isLight = theme === "light";

  return (
    <button
      aria-label={isLight ? "다크 테마로 전환" : "라이트 테마로 전환"}
      className={cn(
        "flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors",
        isLight ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-surface-muted text-foreground hover:bg-surface"
      )}
      onClick={() => setDocumentTheme(isLight ? "dark" : "light")}
      type="button"
    >
      {isLight ? (
        <SunMedium className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
