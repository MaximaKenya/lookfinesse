import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;
  const { db } = gate.ctx;
  const body = await req.json();

  const { action, payout_id } = body;

  if (!action || !payout_id) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  if (action === "FORCE_RETRY") {
    await db
      .from("payout_queue")
      .update({
        status: "RETRY_SCHEDULED",
      })
      .eq("id", payout_id);
  }

  if (action === "BLOCK") {
    await db
      .from("payout_queue")
      .update({
        status: "FAILED",
      })
      .eq("id", payout_id);
  }

  return NextResponse.json({ success: true });
}