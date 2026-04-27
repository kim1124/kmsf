import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KMSF Basic Dashboard Example",
  description: "Package-consumer verification app for @kmsf workspaces.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
