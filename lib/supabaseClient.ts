import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

let _client: SupabaseClient | null = null;
let _misconfiguredLogged = false;

function logMisconfiguredOnce() {
  if (_misconfiguredLogged || process.env.NODE_ENV === "production") return;
  _misconfiguredLogged = true;
  const env = getSupabaseEnv();
  if (!env.ok) {
    console.warn("[supabase] Client disabled:", env.issues.join("; "));
  }
}

/** Chainable stub so SSG/build never throws when env is missing. */
function misconfiguredQuery(): any {
  const result = Promise.resolve({
    data: null,
    error: { message: "SUPABASE_MISCONFIGURED", code: "SUPABASE_MISCONFIGURED" },
    count: null,
    status: 0,
    statusText: "SUPABASE_MISCONFIGURED",
  });

  const builder: any = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "then") return (result as Promise<unknown>).then.bind(result);
        if (prop === "catch") return (result as Promise<unknown>).catch.bind(result);
        if (prop === "finally") return (result as Promise<unknown>).finally.bind(result);
        return (..._args: unknown[]) => builder;
      },
    }
  );
  return builder;
}

const AUTH_STUB = {
  getSession: async () => ({ data: { session: null }, error: null }),
  getUser: async () => ({ data: { user: null }, error: null }),
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe() {} } },
  }),
  signOut: async () => ({ error: null }),
  signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: "SUPABASE_MISCONFIGURED" } }),
  signInWithOAuth: async () => ({ data: { provider: null, url: null }, error: { message: "SUPABASE_MISCONFIGURED" } }),
  signUp: async () => ({ data: { user: null, session: null }, error: { message: "SUPABASE_MISCONFIGURED" } }),
};

/** Never-throwing stub client for missing env / SSG. */
function misconfiguredClient(): any {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === "from" || prop === "rpc" || prop === "schema") {
          return (..._args: unknown[]) => misconfiguredQuery();
        }
        if (prop === "auth") return AUTH_STUB;
        if (prop === "storage" || prop === "functions" || prop === "realtime" || prop === "channel") {
          return new Proxy(
            {},
            {
              get() {
                return (..._args: unknown[]) => misconfiguredQuery();
              },
            }
          );
        }
        // Symbols / inspect / serialization — never throw during Next.js SSG
        if (typeof prop === "symbol") return undefined;
        if (prop === "then") return undefined;
        if (prop === "toJSON") return () => null;
        return (..._args: unknown[]) => misconfiguredQuery();
      },
    }
  );
}

function getClient(): SupabaseClient {
  if (_client) return _client;

  const env = getSupabaseEnv();
  if (!env.ok) {
    logMisconfiguredOnce();
    return misconfiguredClient() as SupabaseClient;
  }

  _client = createBrowserClient(env.url, env.anonKey);
  return _client;
}

/** True when public env vars pass format validation (does not ping the network). */
export { isSupabaseConfigured };

/**
 * Lazy browser Supabase client. When env is missing, all APIs soft-fail
 * (no throw) so Next.js "Collecting page data" / SSG can complete without credentials.
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop, receiver) {
    if (!isSupabaseConfigured()) {
      logMisconfiguredOnce();
      return Reflect.get(misconfiguredClient() as object, prop, receiver);
    }
    return Reflect.get(getClient() as object, prop, receiver);
  },
});
