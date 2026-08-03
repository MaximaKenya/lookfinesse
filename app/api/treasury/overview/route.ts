import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  const { data: accounts } = await db.from("treasury_accounts").select("*");
  const { data: pools } = await db.from("liquidity_pools").select("*");
  const { data: forecasts } = await db
    .from("payout_forecasts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    accounts: accounts ?? [],
    pools: pools ?? [],
    forecasts: forecasts ?? [],
  });
}
