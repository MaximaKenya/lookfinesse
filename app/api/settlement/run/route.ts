import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/requireAdmin";

/**
 * Create a settlement batch from queued / sent payouts.
 * Accepts GET (legacy) and POST (admin console).
 */
async function runSettlement() {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;

  try {
    // Prefer SENT queue items; fall back to queued for demo ops
    let { data: payouts } = await db
      .from("payout_queue")
      .select("id, vendor_id, amount, status")
      .eq("status", "SENT");

    if (!payouts?.length) {
      const queued = await db
        .from("payout_queue")
        .select("id, vendor_id, amount, status")
        .in("status", ["queued", "QUEUED"])
        .limit(50);
      payouts = queued.data ?? [];
    }

    if (!payouts?.length) {
      return NextResponse.json({
        success: true,
        message: "No payouts ready for settlement",
        result: null,
      });
    }

    const total = payouts.reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
    const { data: batch, error } = await db
      .from("settlement_batches")
      .insert({
        total_amount: total,
        payout_count: payouts.length,
        status: "PENDING",
        rail: "mpesa",
        currency: "KES",
        metadata: { source: "admin_network_console" },
      })
      .select("id, total_amount, payout_count, status")
      .maybeSingle();

    if (error) {
      console.warn("[settlement/run]", error.message);
      return NextResponse.json(
        { error: error.message, success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      result: {
        id: batch?.id,
        total_amount: total,
        payout_count: payouts.length,
        status: batch?.status ?? "PENDING",
      },
    });
  } catch (err) {
    console.error("[settlement/run]", err);
    return NextResponse.json(
      { error: "Settlement failed", success: false },
      { status: 500 }
    );
  }
}

export async function GET() {
  return runSettlement();
}

export async function POST() {
  return runSettlement();
}
