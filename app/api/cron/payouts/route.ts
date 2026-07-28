import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const { data: wallets } = await supabase
      .from("wallets")
      .select("*");

    for (const w of wallets || []) {
      if (w.balance > 1000) {
        await supabase.from("payouts").insert({
          vendor_id: w.vendor_id,
          amount: w.balance,
          status: "pending",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}