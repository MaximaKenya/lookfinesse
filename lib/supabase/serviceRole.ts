import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client with the service role key (bypasses RLS).
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is unset — callers must fall back
 * to the user-scoped client.
 */
export function createSupabaseServiceRole(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  return createClient(url.replace(/\/$/, ""), key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
