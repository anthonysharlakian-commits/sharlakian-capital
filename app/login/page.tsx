"use client";

import { Suspense, useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/app/actions/auth";
import { BROWSER_SESSION_KEY } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";

function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const authConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    sessionStorage.removeItem(BROWSER_SESSION_KEY);
    const paramError = searchParams.get("error");
    if (paramError === "auth_not_configured") {
      setError(
        "Sign-in is not configured yet. Add Supabase keys in Vercel environment variables."
      );
    } else if (paramError === "auth") {
      setError("Sign-in failed. Please try again.");
    }
  }, [searchParams]);

  function handleSignIn(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signIn(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <span className="sidebar-logo-mark block">SH</span>
          <span className="sidebar-logo-sub block mt-1 mb-3">HOLDINGS OS</span>
          <CardDescription>Sign in to your investment command center</CardDescription>
        </CardHeader>
        <CardContent>
          {!authConfigured ? (
            <p className="body-text text-[var(--red)] text-center">
              Authentication is required but Supabase is not configured. Add environment
              variables in Vercel.
            </p>
          ) : (
            <form action={handleSignIn} className="space-y-3">
              <Input name="email" type="email" placeholder="Email" required autoComplete="email" />
              <Input
                name="password"
                type="password"
                placeholder="Password"
                required
                autoComplete="current-password"
              />
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {error && <p className="body-text text-[var(--red)] mt-4 text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="body-text text-[var(--text-muted)]">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
