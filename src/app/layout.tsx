import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_KR, Space_Grotesk } from "next/font/google";
import { getLocale } from "next-intl/server";

import { getThemeCookie } from "@/lib/auth/demo-session";

import "./globals.css";

const bodyFont = Noto_Sans_KR({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
});

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
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} ${theme === "dark" ? "dark" : ""} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
