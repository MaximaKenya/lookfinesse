import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data: failed } = await supabase
    .from("payouts")
    .select("*")
    .eq("status", "failed")
    .lt("retry_count", 3);

  for (const p of failed || []) {
    try {
      // 🔁 retry payout
      await fetch("/api/payouts/execute", {
        method: "POST",
        body: JSON.stringify({
          vendor_id: p.vendor_id,
          amount: p.amount,
          phone: p.phone,
          provider: p.method,
        }),
      });

      await supabase
        .from("payouts")
        .update({
          retry_count: p.retry_count + 1,
        })
        .eq("id", p.id);
    } catch (err) {
      await supabase
        .from("payouts")
        .update({
          retry_count: p.retry_count + 1,
          last_error: String(err),
        })
        .eq("id", p.id);
    }
  }

  return NextResponse.json({ message: "Retry job done" });
}