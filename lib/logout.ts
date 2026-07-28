import { supabase } from "@/lib/supabaseClient";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type SignOutDestination = "/login" | "/feed";

/** Clear Supabase auth cookies + local storage so proxy cannot re-auth. */
export function clearClientAuthState() {
  if (typeof document === "undefined") return;

  const cookieNames = document.cookie
    .split(";")
    .map((c) => c.split("=")[0]?.trim())
    .filter(Boolean);

  for (const name of cookieNames) {
    if (
      name.startsWith("sb-") ||
      name.includes("auth-token") ||
      name.includes("supabase")
    ) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}; SameSite=Lax`;
    }
  }

  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore private mode */
  }

  try {
    const toRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith("sb-") || key.includes("supabase"))) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/**
 * Global sign-out: revoke session, clear cookies, hard-navigate.
 * Soft router.push leaves stale cookies that proxy re-reads as logged-in.
 */
export async function signOutAndRedirect(
  routerOrDest?:
    | { push: (path: string) => void; refresh?: () => void }
    | SignOutDestination,
  dest: SignOutDestination = "/login"
) {
  const destination: SignOutDestination =
    typeof routerOrDest === "string" ? routerOrDest : dest;

  try {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut({ scope: "global" });
    }
  } catch {
    /* still hard-clear client state */
  }

  clearClientAuthState();

  if (typeof window !== "undefined") {
    window.location.assign(destination);
    return;
  }

  if (routerOrDest && typeof routerOrDest === "object") {
    routerOrDest.push(destination);
    routerOrDest.refresh?.();
  }
}
