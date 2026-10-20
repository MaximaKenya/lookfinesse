// /app/api/cron/auto-payouts/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { sendPaystackPayout } from "@/lib/paystack/payout";
import { cronUnauthorized, isCronAuthorized } from "@/lib/cron/authorize";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return cronUnauthorized();

  // 1. get approved payouts
  const { data: payouts } = await supabase
    .from("payouts")
    .select("*")
    .eq("status", "approved");

  for (const p of payouts || []) {
    try {
      // get vendor phone
      const { data: vendor } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", p.vendor_id)
        .single();

      if (!vendor?.phone) continue;

      await sendPaystackPayout({
        amountKes: Number(p.amount),
        phone: vendor.phone,
        reason: "LookFinesse scheduled payout",
      });

      // ✅ mark paid
      await supabase
        .from("payouts")
        .update({ status: "paid" })
        .eq("id", p.id);

    } catch (err) {
      console.error("auto payout failed", err);
    }
  }

  return NextResponse.json({ success: true });
}