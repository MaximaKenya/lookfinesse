import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

/** Legacy risk dashboard endpoint — prefers /api/admin/risk/overview. */
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  const { data: vendors } = await db
    .from("vendor_risk_scores")
    .select("*")
    .order("risk_score", { ascending: false });

  const { data: fraud } = await db
    .from("fraud_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: payouts } = await db
    .from("payout_queue")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({
    vendors: vendors ?? [],
    fraud_events: fraud ?? [],
    payouts: payouts ?? [],
  });
}
