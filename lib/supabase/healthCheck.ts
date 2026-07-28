import { getSupabaseEnv } from "@/lib/supabase/env";

export type SupabaseHealthResult = {
  ok: boolean;
  configured: boolean;
  reachable?: boolean;
  error?: string;
  checkedAt: string;
};

const HEALTH_TIMEOUT_MS = 5000;

let cached: SupabaseHealthResult | null = null;
let inflight: Promise<SupabaseHealthResult> | null = null;

/**
 * Optional ping on app load — verifies DNS/HTTP reachability of the Supabase project.
 * Results are cached for the current page session.
 */
export async function checkSupabaseHealth(options?: {
  force?: boolean;
}): Promise<SupabaseHealthResult> {
  if (!options?.force && cached) return cached;
  if (!options?.force && inflight) return inflight;

  inflight = (async () => {
    const env = getSupabaseEnv();
    const checkedAt = new Date().toISOString();

    if (!env.ok) {
      cached = {
        ok: false,
        configured: false,
        error: env.issues.join("; "),
        checkedAt,
      };
      return cached;
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

      const res = await fetch(`${env.url}/rest/v1/`, {
        method: "HEAD",
        headers: {
          apikey: env.anonKey,
          Authorization: `Bearer ${env.anonKey}`,
        },
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timer);

      // Any HTTP response means the host resolved; auth/schema errors are fine here.
      const reachable = res.status > 0;
      cached = {
        ok: reachable,
        configured: true,
        reachable,
        error: reachable ? undefined : `Unexpected status ${res.status}`,
        checkedAt,
      };
      return cached;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.name === "AbortError"
            ? "Connection timed out"
            : err.message
          : "Network error";

      cached = {
        ok: false,
        configured: true,
        reachable: false,
        error: message,
        checkedAt,
      };
      return cached;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function clearSupabaseHealthCache() {
  cached = null;
  inflight = null;
}
