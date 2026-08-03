import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { tierFromKycStatus, TRUST_TIER_LABELS, TRUST_TIER_UNLOCKS, type TrustTier } from "@/lib/trust/tiers";

/** Sync vendor trust_tier from KYC status; return badge payload for storefront/feed. */
export async function GET(req: Request) {
  try {
    const vendorId = new URL(req.url).searchParams.get("vendor_id");
    if (!vendorId) return NextResponse.json({ error: "Missing vendor_id" }, { status: 400 });

    const supabase = await createSupabaseServer();
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id, name, business_name, is_verified, trust_tier, trust_badge")
      .eq("id", vendorId)
      .maybeSingle();

    let tier = (vendor?.trust_tier as TrustTier) || "none";
    if (vendor?.is_verified && tier === "none") tier = "basic";

    // Prefer latest KYC
    const { data: kyc } = await supabase
      .from("vendor_kyc")
      .select("status, business_registration")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (kyc) {
      tier = tierFromKycStatus(kyc.status, !!kyc.business_registration);
      if (tier === "business" && vendor?.is_verified) {
        // Elite unlock when already verified + business docs (admin can set elite explicitly)
        const { data: elite } = await supabase
          .from("vendors")
          .select("trust_tier")
          .eq("id", vendorId)
          .maybeSingle();
        if (elite?.trust_tier === "elite") tier = "elite";
      }
    }

    return NextResponse.json({
      vendor_id: vendorId,
      tier,
      label: TRUST_TIER_LABELS[tier],
      unlocks: TRUST_TIER_UNLOCKS[tier],
      is_verified: !!vendor?.is_verified || tier !== "none",
      badge: vendor?.trust_badge || TRUST_TIER_LABELS[tier],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Trust badge failed";
    return NextResponse.json({
      tier: "none",
      label: TRUST_TIER_LABELS.none,
      unlocks: TRUST_TIER_UNLOCKS.none,
      error: message,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vendor_id, tier } = body as { vendor_id?: string; tier?: TrustTier };
    if (!vendor_id || !tier) {
      return NextResponse.json({ error: "Missing vendor_id or tier" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { error } = await supabase
      .from("vendors")
      .update({
        trust_tier: tier,
        trust_badge: TRUST_TIER_LABELS[tier],
        is_verified: tier !== "none",
      })
      .eq("id", vendor_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, tier, label: TRUST_TIER_LABELS[tier] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
