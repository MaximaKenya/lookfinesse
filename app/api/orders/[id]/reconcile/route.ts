import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { fulfillPaystackReference } from "@/lib/paystack/fulfill";
import { syncOrderState } from "@/lib/payments/syncOrderState";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { data: order } = await supabase.from("orders").select("id, status").eq("id", id).single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ status: "paid", message: "Already paid" });

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ status: "pending", message: "No payment record yet" });
  }
  if (payment.status === "paid") {
    await syncOrderState(id);
    return NextResponse.json({ status: "paid" });
  }

  const reference = payment.provider_ref || payment.checkout_request_id;
  if (!reference) {
    return NextResponse.json({ status: "pending", message: "Payment has no Paystack reference" });
  }

  try {
    const result = await fulfillPaystackReference(reference);
    return NextResponse.json({
      status: result.ok ? "paid" : result.status,
      message: result.ok ? "Payment verified" : result.message,
    });
  } catch (err) {
    return NextResponse.json(
      { status: "pending", message: err instanceof Error ? err.message : "Verification failed" },
      { status: 502 }
    );
  }
}
