import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { isPlatformAdmin } from "@/lib/auth/platformAdmin";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { createSupabaseServiceRole } from "@/lib/supabase/serviceRole";

export type AdminContext = {
  user: User;
  /** Cookie/session-scoped client (RLS applies). */
  supabase: SupabaseClient;
  /**
   * Prefer service role for admin reads/writes so missing RLS policies
   * never zero-out finance dashboards. Falls back to session client.
   */
  db: SupabaseClient;
};

export type RequireAdminResult =
  | { ok: true; ctx: AdminContext }
  | { ok: false; response: NextResponse };

/**
 * API gate: only platform admins (`user_roles.role=admin` or `isPlatformAdmin`).
 * Returns 401 JSON when unauthenticated, 403 when authenticated but not admin.
 * Vendors (even subscribed) never pass.
 */
export async function requireAdmin(): Promise<RequireAdminResult> {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Unauthorized", code: "AUTH_REQUIRED" },
          { status: 401 }
        ),
      };
    }

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roles = (roleRows ?? []).map((r) => r.role);
    const admin = isPlatformAdmin({
      email: user.email,
      roles,
      appMetadata: (user.app_metadata ?? null) as Record<string, unknown> | null,
    });

    if (!admin) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Forbidden — admin only", code: "ADMIN_REQUIRED" },
          { status: 403 }
        ),
      };
    }

    const service = createSupabaseServiceRole();
    return {
      ok: true,
      ctx: {
        user,
        supabase,
        db: service ?? supabase,
      },
    };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      ),
    };
  }
}
