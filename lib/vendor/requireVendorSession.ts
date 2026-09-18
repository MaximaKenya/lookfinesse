import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { resolveVendorScope, type VendorScope } from "@/lib/vendor/scope";
import { ensureVendorTrial } from "@/lib/subscriptions/ensureVendorTrial";

export type VendorSession =
  | { ok: true; supabase: SupabaseClient; scope: VendorScope }
  | { ok: false; response: NextResponse };

/**
 * Authenticated vendor write context. Uses the cookie-bound server client
 * so RLS policies see auth.uid() — never the browser anon singleton.
 */
export async function requireVendorSession(): Promise<VendorSession> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureVendorTrial(supabase, user.id, { email: user.email ?? null });
  }

  const scopeResult = await resolveVendorScope(supabase);
  if (!scopeResult.ok) {
    const status = scopeResult.reason === "unauthenticated" ? 401 : 403;
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            scopeResult.reason === "unauthenticated"
              ? "Sign in required"
              : "Vendor account required — create a store first",
          code: scopeResult.reason === "unauthenticated" ? "UNAUTHENTICATED" : "NOT_VENDOR",
        },
        { status }
      ),
    };
  }

  return { ok: true, supabase, scope: scopeResult.scope };
}
