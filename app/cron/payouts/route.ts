import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function GET() {
  // 1. get unpaid vendor balances
  const { data } = await supabase
    .from("ledger_entries")
    .select("*");

  const map: Record<string, number> = {};

  for (const e of data || []) {
    if (e.category !== "sale" || e.type !== "credit") continue;
    if (!e.vendor_id) continue;

    map[e.vendor_id] = (map[e.vendor_id] || 0) + Number(e.amount);
  }

  // 2. create payout jobs
  for (const [vendor_id, amount] of Object.entries(map)) {
    if (amount < 100) continue; // minimum payout threshold

    await supabase.from("payouts").insert({
      vendor_id,
      amount,
      status: "pending",
    });
  }

  return NextResponse.json({ message: "Payout jobs generated" });
}