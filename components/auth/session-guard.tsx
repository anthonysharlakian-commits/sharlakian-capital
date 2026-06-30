"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BROWSER_SESSION_KEY } from "@/lib/auth/session";

function SessionGuardInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isAuthPage =
      pathname.startsWith("/login") || pathname.startsWith("/auth");

    if (isAuthPage) {
      setReady(true);
      return;
    }

    if (searchParams.get("login") === "success") {
      sessionStorage.setItem(BROWSER_SESSION_KEY, "1");
      router.replace(pathname);
      setReady(true);
      return;
    }

    if (sessionStorage.getItem(BROWSER_SESSION_KEY)) {
      setReady(true);
      return;
    }

    const supabase = createClient();
    void supabase.auth.signOut().then(() => {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    });
  }, [pathname, router, searchParams]);

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="body-text text-[var(--text-muted)]">Verifying session…</p>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Requires a fresh login each time the app is opened (new browser/PWA session).
 */
export function SessionGuard({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <p className="body-text text-[var(--text-muted)]">Verifying session…</p>
        </div>
      }
    >
      <SessionGuardInner>{children}</SessionGuardInner>
    </Suspense>
  );
}
