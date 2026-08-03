import { redirect } from "next/navigation";

import { isPlatformAdmin } from "@/lib/auth/platformAdmin";
import { createSupabaseServer } from "@/lib/supabaseServer";

/**
 * Server Component / layout gate for admin HTML surfaces.
 * Non-admins (including vendors) → `/dashboard`. Unauthenticated → login.
 * Only `admin@test.com` / `user_roles.role=admin` / JWT admin metadata pass.
 */
export async function requireAdminPage(opts?: {
  returnPath?: string;
  fallback?: string;
}) {
  const returnPath = opts?.returnPath ?? "/admin";
  const fallback = opts?.fallback ?? "/dashboard";

  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/login?returnUrl=${encodeURIComponent(returnPath)}`);
    }

    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const admin = isPlatformAdmin({
      email: user.email,
      roles: (roleRows ?? []).map((r) => r.role),
      appMetadata: (user.app_metadata ?? null) as Record<string, unknown> | null,
    });

    if (!admin) {
      redirect(fallback);
    }

    return user;
  } catch {
    redirect(fallback);
  }
}
