import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const asVendor = searchParams.get("as_vendor") === "1";
  const vendorId = searchParams.get("vendor_id");

  let q = supabase
    .from("customer_subscriptions")
    .select(`
      *,
      service_plans ( name, price_kes, benefits, includes_live_classes ),
      vendors ( name, business_name, avatar_url )
    `)
    .order("created_at", { ascending: false });

  if (asVendor && vendorId) {
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", vendorId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!vendor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    q = q.eq("vendor_id", vendorId);
  } else {
    q = q.eq("user_id", user.id);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(Array.isArray(data) ? data : []);
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to subscribe" }, { status: 401 });
  }

  const { plan_id, payment_method } = await req.json();
  if (!plan_id) {
    return NextResponse.json({ error: "plan_id required" }, { status: 400 });
  }

  const { data: plan, error: planErr } = await supabase
    .from("service_plans")
    .select("*")
    .eq("id", plan_id)
    .eq("is_active", true)
    .single();

  if (planErr || !plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: sub, error: subErr } = await supabase
    .from("customer_subscriptions")
    .insert({
      user_id: user.id,
      vendor_id: plan.vendor_id,
      plan_id: plan.id,
      status: "pending",
      payment_method: payment_method ?? null,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      next_billing_at: periodEnd.toISOString(),
    })
    .select()
    .single();

  if (subErr || !sub) {
    return NextResponse.json({ error: subErr?.message ?? "Failed" }, { status: 500 });
  }

  return NextResponse.json({
    subscription: sub,
    checkoutUrl: `/checkout/subscribe?subscription_id=${sub.id}`,
    plan,
  });
}
