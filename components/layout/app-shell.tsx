"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { SessionGuard } from "@/components/auth/session-guard";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (isAuthPage) {
    return (
      <>
        <div className="bg-photo" aria-hidden="true" />
        <div className="bg-overlay" aria-hidden="true" />
        <div className="relative z-10 min-h-screen">{children}</div>
      </>
    );
  }

  return (
    <>
      <div className="bg-photo" aria-hidden="true" />
      <div className="bg-overlay" aria-hidden="true" />
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <SessionGuard>{children}</SessionGuard>
        </main>
      </div>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="body-text text-[var(--text-muted)]">Loading…</p>
        </div>
      }
    >
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}
