import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { resolveVendorScope } from "@/lib/vendor/scope";

export async function GET() {
  const supabaseAuth = await createSupabaseServer();
  const scopeResult = await resolveVendorScope(supabaseAuth);
  const vendorFilter = scopeResult.ok ? scopeResult.scope.vendorId : null;

  let riskQuery = supabase
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
      ? await supabase
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
}
