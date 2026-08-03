import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  const [{ data: payouts }, { data: queue }] = await Promise.all([
    db
      .from("payouts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    db
      .from("payout_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return NextResponse.json({
    payouts: payouts ?? [],
    queue: queue ?? [],
  });
}
