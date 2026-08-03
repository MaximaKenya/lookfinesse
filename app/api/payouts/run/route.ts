import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";
import { runPayoutWorker } from "@/lib/payouts/payoutWorker";

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  try {
    await runPayoutWorker();
    return NextResponse.json({
      success: true,
      message: "Payout worker executed",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Worker failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
