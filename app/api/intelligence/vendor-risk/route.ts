import { NextResponse } from "next/server";

import { isPlatformAdmin } from "@/lib/auth/platformAdmin";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { createSupabaseServiceRole } from "@/lib/supabase/serviceRole";
import { resolveVendorScope } from "@/lib/vendor/scope";

/**
 * Vendor self-scope OR platform admin full list.
 * Unauthenticated callers get 401 — never an open dump of all vendors.
 */
export async function GET() {
  try {
    const supabaseAuth = await createSupabaseServer();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const { data: roleRows } = await supabaseAuth
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roles = (roleRows ?? []).map((r) => r.role);
    const admin = isPlatformAdmin({
      email: user.email,
      roles,
      appMetadata: (user.app_metadata ?? null) as Record<string, unknown> | null,
    });

    const scopeResult = await resolveVendorScope(supabaseAuth);
    const vendorFilter = admin
      ? null
      : scopeResult.ok
        ? scopeResult.scope.vendorId
        : null;

    if (!admin && !vendorFilter) {
      return NextResponse.json(
        { error: "Forbidden", code: "VENDOR_OR_ADMIN_REQUIRED" },
        { status: 403 }
      );
    }

    const db = createSupabaseServiceRole() ?? supabaseAuth;

    let riskQuery = db
      .from("vendor_risk_scores")
      .select("vendor_id, risk_score, trust_tier, is_frozen, updated_at")
      .order("risk_score", { ascending: false })
      .limit(vendorFilter ? 1 : 20);

    if (vendorFilter) {
      riskQuery = riskQuery.eq("vendor_id", vendorFilter);
    }

    const { data: riskRows, error: riskError } = await riskQuery;
    if (riskError) {
      console.warn("vendor_risk_scores query:", riskError.message);
    }

    const vendorIds = (riskRows ?? []).map((row) => row.vendor_id);
    const { data: vendorRows } =
      vendorIds.length > 0
        ? await db
            .from("vendors")
            .select("id, business_name, name, location")
            .in("id", vendorIds)
        : { data: [] };

    const nameById = new Map(
      (vendorRows ?? []).map((v) => [
        v.id,
        v.business_name ?? v.name ?? "Vendor",
      ])
    );

    let vendors = (riskRows ?? []).map((row) => ({
      vendor_id: row.vendor_id,
      name: nameById.get(row.vendor_id) ?? row.vendor_id,
      risk: Number(row.risk_score ?? 0),
      trust_tier: row.trust_tier,
      is_frozen: row.is_frozen,
    }));

    if (vendors.length === 0) {
      const { data: fallbackVendors } = await db
        .from("vendors")
        .select("id, business_name, name")
        .limit(vendorFilter ? 1 : 20);

      const filtered = vendorFilter
        ? (fallbackVendors ?? []).filter((v) => v.id === vendorFilter)
        : fallbackVendors ?? [];

      vendors = filtered.map((v) => ({
        vendor_id: v.id,
        name: v.business_name ?? v.name ?? v.id,
        risk: 0,
        trust_tier: "UNKNOWN",
        is_frozen: false,
      }));
    }

    return NextResponse.json({ vendors });
  } catch (err) {
    console.error("vendor-risk failed", err);
    return NextResponse.json({ vendors: [], error: "Failed" }, { status: 500 });
  }
}
