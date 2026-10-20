import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cronUnauthorized, isCronAuthorized } from "@/lib/cron/authorize";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return cronUnauthorized();

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