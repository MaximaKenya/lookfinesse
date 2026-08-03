import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
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