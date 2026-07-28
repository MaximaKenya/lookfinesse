// /app/api/mpesa/payout-callback/route.ts

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { ResultCode, ResultDesc, OriginatorConversationID } = body;

    // 🔍 Find payout using reference
    const { data: payout } = await supabase
      .from("payouts")
      .select("*")
      .eq("reference", OriginatorConversationID)
      .single();

    if (!payout) {
      return NextResponse.json({ message: "Payout not found" });
    }

    // ✅ SUCCESS
    if (ResultCode === 0) {
      // 1. mark payout paid
      await supabase
        .from("payouts")
        .update({ status: "paid" })
        .eq("id", payout.id);

      // 2. mark ledger completed
      await supabase
        .from("ledger_entries")
        .update({ status: "completed" })
        .eq("idempotency_key", `reserve-${payout.id}`);

      // 3. audit
      await supabase.from("audit_logs").insert({
        action: "payout_success",
        metadata: body,
      });
    } else {
      // ❌ FAILURE → REFUND ESCROW

      // 1. return funds to escrow
      await supabase.rpc("refund_escrow_balance", {
        v_vendor_id: payout.vendor_id,
        v_amount: payout.amount,
      });

      // 2. mark payout failed
      await supabase
        .from("payouts")
        .update({ status: "failed", failure_reason: ResultDesc })
        .eq("id", payout.id);

      // 3. mark ledger failed
      await supabase
        .from("ledger_entries")
        .update({ status: "failed" })
        .eq("idempotency_key", `reserve-${payout.id}`);

      // 4. audit
      await supabase.from("audit_logs").insert({
        action: "payout_failed",
        metadata: body,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ payout webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}