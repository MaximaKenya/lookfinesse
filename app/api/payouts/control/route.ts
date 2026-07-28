import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
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