import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getPayoutDelay } from "@/lib/payouts/scheduler";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST(req: Request) {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  const body = await req.json();

  const { vendor_id, amount, currency } = body;

  const { data: risk } = await supabase
    .from("vendor_risk_scores")
    .select("*")
    .eq("vendor_id", vendor_id)
    .single();

  const delay = getPayoutDelay(risk?.trust_tier ?? "STANDARD");

  const nextRetryAt =
    delay === Infinity ? null : new Date(Date.now() + delay).toISOString();

  const { data, error } = await supabase
    .from("payout_queue")
    .insert([
      {
        vendor_id,
        amount,
        currency,
        status: "QUEUED",
        attempt_count: 0,
        priority: 1,
        next_retry_at: nextRetryAt,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, payout: data });
}
