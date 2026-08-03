import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;

  const { data: payouts } = await supabase
    .from("payouts")
    .select("amount,status");

  const { data: fraud } = await supabase
    .from("financial_events")
    .select("id")
    .eq("event_type", "fraud_detected");

  const treasuryLiquidity =
    payouts?.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    ) || 0;

  return NextResponse.json({
    treasuryLiquidity,
    fraudAlerts: fraud?.length || 0,
  });
}