"use client";

import { useTransition } from "react";
import { signOut } from "@/app/actions/auth";
import { BROWSER_SESSION_KEY } from "@/lib/auth/session";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  function handleSignOut() {
    sessionStorage.removeItem(BROWSER_SESSION_KEY);
    startTransition(() => {
      void signOut();
    });
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className="btn-muted w-full disabled:opacity-50"
    >
      {pending ? "Signing out…" : "Sign Out"}
    </button>
  );
}
