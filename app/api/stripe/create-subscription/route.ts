import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getRequestOrigin } from "@/lib/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fallback prices (KES) when membership_tiers table has no stripe_price_id yet
const TIER_PRICES_KES: Record<string, number> = {
  fan: 499,
  insider: 999,
  elite: 2499,
};

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" as any });

  try {
    const body = await req.json();

    // Support both legacy { priceId, userId } and new { userId, vendorId, tier }
    let priceId: string | undefined = body.priceId;
    const userId: string = body.userId ?? body.user_id;
    const vendorId: string | undefined = body.vendorId ?? body.vendor_id;
    const tier: string = body.tier ?? "fan";

    if (!priceId && vendorId) {
      // Look up stripe_price_id from membership_tiers
      const { data: tierRow } = await supabase
        .from("membership_tiers")
        .select("stripe_price_id, price, name")
        .eq("vendor_id", vendorId)
        .ilike("name", tier)
        .maybeSingle();

      if (tierRow?.stripe_price_id) {
        priceId = tierRow.stripe_price_id;
      } else {
        // Create a Stripe Price on the fly (unit_amount in cents; KES has no subunit)
        const amountKES = tierRow?.price ?? TIER_PRICES_KES[tier] ?? 499;
        const stripePrice = await stripe.prices.create({
          currency: "kes",
          unit_amount: amountKES * 100,
          recurring: { interval: "month" },
          product_data: { name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Membership` },
        });
        priceId = stripePrice.id;

        // Persist for next time
        if (tierRow) {
          await supabase
            .from("membership_tiers")
            .update({ stripe_price_id: priceId })
            .eq("vendor_id", vendorId)
            .ilike("name", tier);
        }
      }
    }

    if (!priceId) {
      return NextResponse.json({ error: "priceId required" }, { status: 400 });
    }

    const origin = getRequestOrigin(req);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/creator/${vendorId ?? ""}?sub=success`,
      cancel_url: `${origin}/creator/${vendorId ?? ""}`,
      metadata: { userId, vendorId: vendorId ?? "", tier },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[create-subscription]", err);
    return NextResponse.json({ error: err.message ?? "Subscription failed" }, { status: 500 });
  }
}
