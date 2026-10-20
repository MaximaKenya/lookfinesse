import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { logAudit } from "@/lib/audit/log";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { sendPaystackPayout } from "@/lib/paystack/payout";

export async function POST(req: Request) {
  const __adminGate = await requireAdmin();
  if (!__adminGate.ok) return __adminGate.response;
  const { db: __adminDb } = __adminGate.ctx;
  void __adminDb;
  try {
    const { vendor_id, amount, phone } = await req.json();

    const { data: payout, error: payoutError } = await supabase
      .from("payouts")
      .insert({
        vendor_id,
        amount,
        status: "processing",
        phone,
      })
      .select()
      .single();

    if (payoutError || !payout) {
      return NextResponse.json({ message: "Failed to create payout" }, { status: 500 });
    }

    const transfer = await sendPaystackPayout({
      amountKes: Number(amount),
      phone,
      reason: `Vendor payout ${payout.id}`,
    });

    await supabase
      .from("payouts")
      .update({
        provider_response: transfer,
        status: transfer.status === "success" ? "paid" : "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payout.id);

    await logAudit({
      action: "payout_created",
      entity: "payout",
      entity_id: payout.id,
      metadata: { vendor_id, amount, phone, reference: transfer.reference },
    });

    return NextResponse.json({
      message: "Payout sent to Paystack",
      payoutId: payout.id,
      reference: transfer.reference,
    });
  } catch (err) {
    console.error("PAYOUT ERROR:", err);
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Payout error" },
      { status: 500 }
    );
  }
}
