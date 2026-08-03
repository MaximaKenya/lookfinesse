import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  const { count: liquidityEvents } = await supabase
    .from("financial_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "liquidity_low");

  const { data: pendingPayouts } = await supabase
    .from("payouts")
    .select("amount")
    .eq("status", "pending");

  const { data: treasuryAccounts } = await supabase
    .from("treasury_accounts")
    .select("balance");

  const pendingTotal =
    pendingPayouts?.reduce((sum, p) => sum + Number(p.amount ?? 0), 0) ?? 0;

  const treasuryTotal =
    treasuryAccounts?.reduce((sum, a) => sum + Number(a.balance ?? 0), 0) ?? 0;

  const pressure =
    treasuryTotal > 0
      ? Math.min(1, pendingTotal / treasuryTotal)
      : pendingTotal > 0
        ? 0.75
        : Number(liquidityEvents ?? 0) > 0
          ? 0.5
          : 0;

  const severity =
    pressure >= 0.75
      ? "Critical"
      : pressure >= 0.45
        ? "Elevated"
        : pressure > 0
          ? "Moderate"
          : "Stable";

  return NextResponse.json({
    pressure,
    severity,
    pendingTotal,
    treasuryTotal,
    empty: treasuryTotal === 0 && pendingTotal === 0,
  });
}
