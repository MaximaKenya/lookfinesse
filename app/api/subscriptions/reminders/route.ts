/**
 * Cron-ready subscription reminders API
 *
 * Call daily (or hourly) via cron / Vercel Cron / external scheduler:
 *
 *   curl -X POST "https://your-domain.com/api/subscriptions/reminders" \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     -H "Content-Type: application/json"
 *
 * Set CRON_SECRET in .env.local. Optional query: ?days_ahead=3
 */
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const daysAhead = Math.min(14, Math.max(1, Number(searchParams.get("days_ahead") ?? 3)));

  const horizon = new Date();
  horizon.setDate(horizon.getDate() + daysAhead);

  const { data: subs, error } = await supabase
    .from("customer_subscriptions")
    .select(`
      id, user_id, vendor_id, next_billing_at, payment_method, status,
      service_plans ( name, price_kes ),
      vendors ( business_name, name )
    `)
    .in("status", ["active", "past_due"])
    .lte("next_billing_at", horizon.toISOString());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let notified = 0;

  for (const sub of subs ?? []) {
    const plan = sub.service_plans as { name?: string; price_kes?: number } | null;
    const vendor = sub.vendors as { business_name?: string; name?: string } | null;
    const vendorName = vendor?.business_name ?? vendor?.name ?? "Provider";
    const planName = plan?.name ?? "Membership";
    const price = plan?.price_kes ?? 0;

    const isMpesa = sub.payment_method === "mpesa";
    const ctaUrl = isMpesa
      ? `/checkout/subscribe?subscription_id=${sub.id}&renew=mpesa`
      : `/checkout/subscribe?subscription_id=${sub.id}&renew=stripe`;

    await supabase.from("notifications").insert({
      user_id: sub.user_id,
      type: "subscription_renewal",
      title: isMpesa ? "Renew with M-Pesa" : "Subscription renewing soon",
      message: `${vendorName} — ${planName} (KES ${Number(price).toLocaleString()}/mo) renews ${new Date(sub.next_billing_at).toLocaleDateString()}. Tap to renew.`,
      link_url: ctaUrl,
      is_read: false,
    });

    if (sub.status === "active" && new Date(sub.next_billing_at) <= new Date()) {
      await supabase
        .from("customer_subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("id", sub.id);
    }

    notified++;
  }

  return NextResponse.json({
    ok: true,
    notified,
    daysAhead,
    hint: "Schedule: POST /api/subscriptions/reminders with Authorization: Bearer CRON_SECRET",
  });
}

export async function GET(req: Request) {
  return POST(req);
}
