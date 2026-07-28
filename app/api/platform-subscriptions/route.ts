import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import {
  guardSupabaseEnv,
  isNetworkError,
  supabaseUnreachableResponse,
} from "@/lib/api/supabaseRoute";
import { resolveVendorScope } from "@/lib/vendor/scope";
import { getPlatformTier } from "@/lib/subscriptions/platformTiers";
import { getPlatformEntitlements } from "@/lib/subscriptions/platformEntitlements";
import { getVendorSubscriptionState } from "@/lib/subscriptions/vendorSubscription";
import { getRequestOrigin } from "@/lib/url";

export const runtime = "nodejs";

export async function GET() {
  const envGuard = guardSupabaseEnv();
  if (envGuard) {
    return NextResponse.json(
      { active: false, tier: null, status: "none", code: "SUPABASE_MISCONFIGURED" },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  }

  try {
    const supabase = await createSupabaseServer();
    const scopeResult = await resolveVendorScope(supabase);

    if (!scopeResult.ok) {
      return NextResponse.json(
        { active: false, tier: null, status: "none" },
        { headers: { "Cache-Control": "private, max-age=30" } }
      );
    }

    const { vendorId } = scopeResult.scope;
    const subState = await getVendorSubscriptionState(supabase, vendorId);

    const { data: sub } = await supabase
      .from("platform_subscriptions")
      .select("*")
      .eq("vendor_id", vendorId)
      .maybeSingle();

    return NextResponse.json(
      {
        active: subState.active,
        tier: subState.tier,
        status: subState.status,
        entitlements: subState.entitlements,
        ad_credits_remaining: subState.adCreditsRemaining,
        hasRow: subState.hasRow,
        current_period_end: sub?.current_period_end ?? null,
        subscription: sub ?? null,
      },
      { headers: { "Cache-Control": "private, max-age=30" } }
    );
  } catch (err) {
    if (isNetworkError(err)) {
      return supabaseUnreachableResponse(err instanceof Error ? err.message : undefined);
    }
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const scopeResult = await resolveVendorScope(supabase);

  if (!scopeResult.ok) {
    return NextResponse.json({ error: "Vendor account required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const tierId = String(body.tier ?? "starter");
  const paymentMethod = String(body.payment_method ?? "mpesa");
  const phone = body.phone ? String(body.phone) : undefined;

  const tier = getPlatformTier(tierId);
  if (!tier) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const { vendorId, userId } = scopeResult.scope;
  const origin = getRequestOrigin(req);

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: existing } = await supabase
    .from("platform_subscriptions")
    .select("id")
    .eq("vendor_id", vendorId)
    .maybeSingle();

  const entitlements = getPlatformEntitlements(tier.id);

  const row = {
    vendor_id: vendorId,
    user_id: userId,
    tier: tier.id,
    price_kes: tier.price,
    payment_method: paymentMethod,
    status: "pending",
    ad_credits_remaining: entitlements.adCreditsMonthly,
    current_period_start: new Date().toISOString(),
    current_period_end: periodEnd.toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await supabase.from("platform_subscriptions").update(row).eq("id", existing.id);
  } else {
    await supabase.from("platform_subscriptions").insert(row);
  }

  if (paymentMethod === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia" as any,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "kes",
            unit_amount: tier.price * 100,
            recurring: { interval: "month" },
            product_data: {
              name: `LookFinesse ${tier.name} — Platform`,
              description: tier.tagline,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/subscription?success=1`,
      cancel_url: `${origin}/dashboard/subscription?cancelled=1`,
      metadata: { vendorId, userId, tier: tier.id, kind: "platform_sub" },
    });

    return NextResponse.json({ url: session.url, method: "stripe" });
  }

  if (paymentMethod === "mpesa") {
    if (!phone || phone.length < 9) {
      return NextResponse.json({ error: "M-Pesa phone required" }, { status: 400 });
    }

    const stkRes = await fetch(`${origin}/api/mpesa/stk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        amount: tier.price,
        accountReference: `LF-PLAT-${tier.id}`,
        description: `LookFinesse ${tier.name} Platform`,
        metadata: {
          kind: "platform_sub",
          vendor_id: vendorId,
          user_id: userId,
          tier: tier.id,
        },
      }),
    });

    const data = await stkRes.json();
    if (!stkRes.ok) {
      return NextResponse.json({ error: data.message ?? data.error ?? "M-Pesa failed" }, { status: 500 });
    }
    return NextResponse.json({ success: true, method: "mpesa", ...data });
  }

  return NextResponse.json({ error: "Unsupported payment method" }, { status: 400 });
}
