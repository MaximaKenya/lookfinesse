import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  const { count: fraudCount } = await supabase
    .from("financial_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", "fraud_detected");

  const { count: pendingPayouts } = await supabase
    .from("payouts")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { data: ledger } = await supabase
    .from("ledger_entries")
    .select("type, amount")
    .limit(500);

  const credits =
    ledger?.filter((e) => e.type === "credit").length ?? 0;
  const debits =
    ledger?.filter((e) => e.type === "debit").length ?? 0;
  const total = credits + debits;

  const healthScore =
    total === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            Math.round(
              100 -
                Number(fraudCount ?? 0) * 8 -
                Number(pendingPayouts ?? 0) * 2 +
                (credits / Math.max(total, 1)) * 20
            )
          )
        );

  return NextResponse.json({
    score: healthScore,
    empty: total === 0,
    label:
      total === 0
        ? "No marketplace activity yet"
        : healthScore >= 80
          ? "Infrastructure Healthy"
          : healthScore >= 50
            ? "Moderate Stability"
            : "Elevated Risk",
  });
}
