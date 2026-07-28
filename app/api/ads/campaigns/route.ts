import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { calculateAdBudget } from "@/lib/ads/budgetCalculator";
import { getVendorWalletBalance } from "@/lib/vendor/getWalletBalance";
import { getRequestOrigin } from "@/lib/url";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServer();
  const { searchParams } = req.nextUrl;
  const vendorId = searchParams.get("vendor_id");
  const status = searchParams.get("status");

  let query = supabase
    .from("ad_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (vendorId) query = query.eq("vendor_id", vendorId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "private, max-age=15" },
  });
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer();
  const body = await req.json().catch(() => ({}));
  const origin = getRequestOrigin(req);

  const {
    vendor_id,
    product_id,
    service_id,
    title,
    headline,
    description,
    image_url,
    image_urls,
    cta_text,
    cta_url,
    target_categories,
    target_location,
    total_budget,
    start_at,
    payment_method,
    phone,
  } = body as {
    vendor_id: string;
    product_id?: string;
    service_id?: string;
    title: string;
    headline: string;
    description?: string;
    image_url?: string;
    image_urls?: string[];
    cta_text?: string;
    cta_url?: string;
    target_categories?: string[];
    target_location?: string;
    total_budget?: number;
    start_at?: string;
    payment_method?: string;
    phone?: string;
  };

  const images = (image_urls?.length ? image_urls : image_url ? [image_url] : []).filter(Boolean);
  const primaryImage = images[0];

  if (!vendor_id || !title || !headline || !primaryImage) {
    return NextResponse.json(
      { error: "Missing required fields (title, headline, image)" },
      { status: 400 }
    );
  }

  let resolvedCta = cta_url ?? "/shop";
  if (product_id) resolvedCta = `/product/${product_id}`;
  else if (service_id) resolvedCta = `/services/${service_id}`;

  const budget = calculateAdBudget(Number(total_budget ?? 3500));
  const method = payment_method ?? "wallet";

  const walletBalance = await getVendorWalletBalance(supabase, vendor_id);
  if (method === "wallet" && walletBalance < budget.totalBudget) {
    return NextResponse.json(
      {
        error: `Insufficient wallet balance. Need KES ${budget.totalBudget.toLocaleString()}, available KES ${walletBalance.toLocaleString()}`,
        wallet_balance: walletBalance,
        required: budget.totalBudget,
      },
      { status: 402 }
    );
  }

  const startDate = start_at ? new Date(start_at) : new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + budget.durationDays);

  let status = "draft";
  if (method === "wallet") status = "live";
  else if (method === "stripe" || method === "mpesa") status = "pending_payment";

  const { data: campaign, error } = await supabase
    .from("ad_campaigns")
    .insert({
      vendor_id,
      product_id: product_id ?? null,
      service_id: service_id ?? null,
      post_id: null,
      title,
      headline,
      description: description ?? null,
      image_url: primaryImage,
      image_urls: images,
      cta_text: cta_text ?? "Shop Now",
      cta_url: resolvedCta,
      target_categories: target_categories ?? [],
      target_location: target_location ?? null,
      daily_budget: budget.dailyBudget,
      total_budget: budget.totalBudget,
      bid_amount: budget.bidPerImpression,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      status,
      payment_method: method,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (method === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-03-25.dahlia" as any,
    });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "kes",
            unit_amount: budget.totalBudget * 100,
            product_data: { name: `Ad: ${title}` },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard/ads?paid=${campaign.id}`,
      cancel_url: `${origin}/dashboard/ads?cancelled=1`,
      metadata: {
        kind: "ad_campaign",
        campaign_id: campaign.id,
        vendor_id,
      },
    });
    await supabase
      .from("ad_campaigns")
      .update({ payment_ref: session.id })
      .eq("id", campaign.id);
    return NextResponse.json({ ...campaign, checkout_url: session.url }, { status: 201 });
  }

  if (method === "mpesa") {
    if (!phone) {
      return NextResponse.json({ error: "M-Pesa phone required" }, { status: 400 });
    }
    const stkRes = await fetch(`${origin}/api/mpesa/stk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        amount: budget.totalBudget,
        accountReference: `AD-${campaign.id.slice(0, 8)}`,
        description: `LookFinesse Ad: ${title}`,
        metadata: {
          kind: "ad_campaign",
          campaign_id: campaign.id,
          vendor_id,
        },
      }),
    });
    const stkData = await stkRes.json();
    if (!stkRes.ok) {
      await supabase.from("ad_campaigns").update({ status: "draft" }).eq("id", campaign.id);
      return NextResponse.json({ error: stkData.message ?? "M-Pesa failed" }, { status: 500 });
    }
    return NextResponse.json(
      { ...campaign, stk: stkData, budget_breakdown: budget },
      { status: 201 }
    );
  }

  return NextResponse.json(
    { ...campaign, budget_breakdown: budget },
    { status: 201 }
  );
}
