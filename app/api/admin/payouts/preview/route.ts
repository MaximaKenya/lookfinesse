import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data } = await supabase
    .from("ledger_entries")
    .select("vendor_id, amount, category, type");

  const map: Record<string, number> = {};

  for (const entry of data || []) {
    if (entry.category !== "sale" || entry.type !== "credit") continue;
    if (!entry.vendor_id) continue;

    map[entry.vendor_id] = (map[entry.vendor_id] || 0) + Number(entry.amount);
  }

  const payouts = Object.entries(map).map(([vendor_id, balance]) => ({
    vendor_id,
    balance,
  }));

  return NextResponse.json({ payouts });
}