import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { sendMpesaPayout } from "@/lib/mpesa/payout";

export async function POST() {
  try {
    const { data: payouts } = await supabase
      .from("payouts")
      .select("*")
      .eq("status", "queued")
      .limit(5);

    for (const p of payouts || []) {
      try {
        const { data: vendor } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", p.vendor_id)
          .single();

        if (!vendor?.phone) throw new Error("No phone");

        await sendMpesaPayout(vendor.phone, p.amount);

        await supabase
          .from("payouts")
          .update({ status: "processing" })
          .eq("id", p.id);

      } catch (err) {
        await supabase
          .from("payouts")
          .update({
            retry_count: p.retry_count + 1,
            status: p.retry_count > 3 ? "failed" : "queued",
          })
          .eq("id", p.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Worker failed" }, { status: 500 });
  }
}