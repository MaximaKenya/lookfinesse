// /app/api/cron/auto-payouts/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { sendMpesaPayout } from "@/lib/mpesa/payout";

export async function GET() {
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

      // 💸 send money
      await sendMpesaPayout(vendor.phone, p.amount);

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