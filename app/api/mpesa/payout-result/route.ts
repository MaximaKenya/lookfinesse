import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { createLedgerEntry } from "@/lib/finance/ledger";
import { logAudit } from "@/lib/audit/log";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("📩 MPESA PAYOUT RESULT:", JSON.stringify(body, null, 2));

    const result = body?.Result;

    if (!result) {
      return NextResponse.json({ message: "Invalid payload" });
    }

    const {
      ResultCode,
      ResultDesc,
      ReferenceData,
    } = result;

    // 🟢 GET payoutId FROM URL
    const url = new URL(req.url);
    const payoutId = url.searchParams.get("payoutId");

    if (!payoutId) {
      console.error("❌ Missing payoutId");
      return NextResponse.json({ message: "Missing payoutId" });
    }

    const status = ResultCode === 0 ? "paid" : "failed";

    // 🟢 UPDATE PAYOUT
    const { data: payout } = await supabase
      .from("payouts")
      .update({
        status,
        result_desc: ResultDesc,
        raw_result: body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId)
      .select()
      .single();

    if (!payout) {
      return NextResponse.json({ message: "Payout not found" });
    }

    // 🔥 LEDGER DEBIT (ONLY IF SUCCESS)
    if (status === "paid") {
      await createLedgerEntry({
        payment_id: payout.id, // reuse id for trace
        vendor_id: payout.vendor_id,
        type: "debit",
        category: "payout",
        amount: payout.amount,
        description: "Vendor payout via MPESA",
      });

      // 🧾 AUDIT
      await logAudit({
        action: "payout_success",
        entity: "payout",
        entity_id: payout.id,
        metadata: payout,
      });
    }

    return NextResponse.json({ message: "Payout processed" });

  } catch (err) {
    console.error("🔥 PAYOUT RESULT ERROR:", err);

    return NextResponse.json({
      message: "Error",
      error: String(err),
    });
  }
}