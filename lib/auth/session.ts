import type { CookieOptions } from "@supabase/ssr";

/** Browser tab session — cleared when the app/PWA is fully closed */
export const BROWSER_SESSION_KEY = "holdings_os_browser_session";

/** Auth cookies expire when the browser session ends (not persisted across restarts) */
export function toSessionOnlyCookieOptions(options: CookieOptions): CookieOptions {
  const { maxAge: _maxAge, expires: _expires, ...rest } = options;
  return rest;
}

export function hasSupabaseAuthConfig(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
