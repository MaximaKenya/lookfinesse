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
      ? await supabase
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

  const vendors = (riskRows ?? []).map((row) => ({
    vendor_id: row.vendor_id,
    name: nameById.get(row.vendor_id) ?? row.vendor_id,
    risk: Number(row.risk_score ?? 0),
    trust_tier: row.trust_tier,
    is_frozen: row.is_frozen,
  }));

  if (vendors.length === 0) {
    const { data: fallbackVendors } = await supabase
      .from("vendors")
      .select("id, business_name, name")
      .limit(vendorFilter ? 1 : 20);

    if (vendorFilter) {
      const match = (fallbackVendors ?? []).find((v) => v.id === vendorFilter);
      if (match) {
        return NextResponse.json({
          vendors: [
            {
              vendor_id: match.id,
              name: match.business_name ?? match.name ?? "Vendor",
              risk: 0,
            },
          ],
        });
      }
    }

    return NextResponse.json({
      vendors: (fallbackVendors ?? []).map((v) => ({
        vendor_id: v.id,
        name: v.business_name ?? v.name ?? "Vendor",
        risk: 0,
      })),
    });
  }

  return NextResponse.json({ vendors });
}
