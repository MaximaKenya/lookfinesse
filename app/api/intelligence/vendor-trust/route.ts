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
      .select(
        "vendor_id, risk_score, trust_tier, is_frozen, payout_velocity, fraud_flags"
      )
      .order("risk_score", { ascending: true })
      .limit(vendorFilter ? 1 : 25);

    if (vendorFilter) {
      riskQuery = riskQuery.eq("vendor_id", vendorFilter);
    }

    const { data: riskRows, error } = await riskQuery;

    if (error) {
      console.warn("vendor-trust query:", error.message);
      return NextResponse.json([]);
    }

    const vendorIds = (riskRows ?? []).map((row) => row.vendor_id);
    const { data: vendors } =
      vendorIds.length > 0
        ? await db
            .from("vendors")
            .select("id, business_name, name")
            .in("id", vendorIds)
        : { data: [] };

    const nameById = new Map(
      (vendors ?? []).map((v) => [v.id, v.business_name ?? v.name ?? v.id])
    );

    return NextResponse.json(
      (riskRows ?? []).map((row) => ({
        vendor_id: row.vendor_id,
        vendor_name: nameById.get(row.vendor_id) ?? row.vendor_id,
        trust_score: Math.max(0, 100 - Number(row.risk_score ?? 0)),
        treasury_risk: Number(row.risk_score ?? 0),
        fraud_flags: Number(row.fraud_flags ?? 0),
        payout_velocity: Number(row.payout_velocity ?? 0),
        trust_tier: row.trust_tier,
        is_frozen: row.is_frozen,
      }))
    );
  } catch (err) {
    console.error("vendor-trust failed", err);
    return NextResponse.json([]);
  }
}
