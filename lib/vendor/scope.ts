import { createSupabaseServer } from "@/lib/supabaseServer";

export type VendorScope = {
  userId: string;
  vendorId: string;
  storeId: string | null;
};

export type VendorScopeResult =
  | { ok: true; scope: VendorScope }
  | { ok: false; reason: "unauthenticated" | "not_vendor" };

/**
 * Resolve the authenticated user's vendor + store identifiers for scoped queries.
 * vendorId prefers the vendors.id row linked to the user; falls back to auth user id.
 */
export async function resolveVendorScope(
  supabase?: Awaited<ReturnType<typeof createSupabaseServer>>
): Promise<VendorScopeResult> {
  const client = supabase ?? (await createSupabaseServer());

  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    return { ok: false, reason: "unauthenticated" };
  }

  const [{ data: roleRows }, { data: stores }, { data: vendorRow }] =
    await Promise.all([
      client.from("user_roles").select("role").eq("user_id", user.id),
      client.from("stores").select("id").eq("user_id", user.id).limit(1),
      client
        .from("vendors")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const roles = (roleRows ?? []).map((row) => row.role);
  const isVendor =
    roles.includes("vendor") ||
    roles.includes("admin") ||
    Boolean(vendorRow?.id) ||
    (stores?.length ?? 0) > 0;

  if (!isVendor) {
    return { ok: false, reason: "not_vendor" };
  }

  return {
    ok: true,
    scope: {
      userId: user.id,
      vendorId: vendorRow?.id ?? user.id,
      storeId: stores?.[0]?.id ?? null,
    },
  };
}
