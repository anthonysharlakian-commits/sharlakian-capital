import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sharlakian Holdings OS",
  description: "AI-powered real estate investment platform",
  icons: { icon: "/favicon.svg" },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#C9A84C",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C9A84C" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
