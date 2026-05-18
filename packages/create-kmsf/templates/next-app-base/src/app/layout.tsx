import type { Metadata } from "next";
import type { CSSProperties } from "react";

import { getThemeCookie } from "@/lib/auth/demo-session";
import { getAppLocale } from "@/i18n/current-locale";
import {
  bodyFontStack,
  displayFontStack,
  monoFontStack,
} from "@/lib/theme/font-stacks";

import "./globals.css";

export const metadata: Metadata = {
  title: "KMSF Next Template",
  description: "Next.js admin dashboard template with demo sign-in and switchable light and dark themes.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemeCookie();
  const locale = await getAppLocale();
  const fontVariables = {
    "--font-body": bodyFontStack,
    "--font-display": displayFontStack,
    "--font-code": monoFontStack,
  } as CSSProperties;

  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${theme === "dark" ? "dark" : ""} h-full antialiased`}
      style={fontVariables}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
