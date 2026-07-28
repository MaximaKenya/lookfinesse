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



function getClient(): SupabaseClient {

  if (_client) return _client;



  const env = getSupabaseEnv();

  if (!env.ok) {

    logMisconfiguredOnce();

    throw new Error("SUPABASE_MISCONFIGURED");

  }



  _client = createBrowserClient(env.url, env.anonKey);

  return _client;

}



/** True when public env vars pass format validation (does not ping the network). */

export { isSupabaseConfigured };



export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {

  get(_t, prop, receiver) {

    if (!isSupabaseConfigured()) {

      logMisconfiguredOnce();

      throw new Error("SUPABASE_MISCONFIGURED");

    }

    return Reflect.get(getClient(), prop, receiver);

  },

});


