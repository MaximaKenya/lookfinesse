import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { requireAdmin } from "@/lib/auth/requireAdmin";

export async function POST(req: Request) {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  const body = await req.json();

  const { action, payout_id } = body;

  if (!action || !payout_id) {
    return NextResponse.json(
      { error: "Missing fields" },
      { status: 400 }
    );
  }

  if (action === "FORCE_RETRY") {
    await supabase
      .from("payout_queue")
      .update({
        status: "RETRY_SCHEDULED",
        next_retry_at: new Date().toISOString(),
      })
      .eq("id", payout_id);
  }

  if (action === "BLOCK") {
    await supabase
      .from("payout_queue")
      .update({
        status: "FAILED",
      })
      .eq("id", payout_id);
  }

  return NextResponse.json({ success: true });
}