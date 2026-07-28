import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json();

    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (!payment) throw new Error("Payment not found");

    // 🔁 REFUND ESCROW
    await supabase.rpc("refund_escrow_balance", {
      v_vendor_id: payment.vendor_id,
      v_amount: payment.amount,
    });

    // 🧾 LEDGER REVERSAL
    await supabase.from("ledger_entries").insert({
      vendor_id: payment.vendor_id,
      amount: payment.amount,
      type: "debit",
      category: "refund",
      description: "Refund issued",
    });

    // 🧾 MARK PAYMENT
    await supabase
      .from("payments")
      .update({ status: "refunded" })
      .eq("id", paymentId);

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
}