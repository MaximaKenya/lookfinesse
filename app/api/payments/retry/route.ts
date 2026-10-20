import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getRequestOrigin } from "@/lib/url";
import { initializeTransaction, isPaystackConfigured, newPaystackReference, paystackCallbackUrl } from "@/lib/paystack/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!isPaystackConfigured()) {
    return NextResponse.json({ message: "Paystack is not configured" }, { status: 503 });
  }
  try {
    const { paymentId } = await req.json();
    const origin = getRequestOrigin(req);

    const { data: payment } = await supabase.from("payments").select("*").eq("id", paymentId).single();
    if (!payment) return NextResponse.json({ message: "Payment not found" }, { status: 404 });
    if (payment.status === "paid") {
      return NextResponse.json({ message: "This payment is already complete" }, { status: 400 });
    }

    const reference = newPaystackReference();
    const meta = { ...((payment.metadata ?? {}) as Record<string, string>), app: "lookfinesse" };
    const session = await initializeTransaction({
      email: "checkout@lookfinesse.app",
      amountKes: Number(payment.amount),
      reference,
      callbackUrl: paystackCallbackUrl(origin),
      metadata: meta,
    });

    await supabase
      .from("payments")
      .update({
        provider: "paystack",
        status: "pending",
        checkout_request_id: session.reference,
        provider_ref: session.reference,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    return NextResponse.json({ url: session.authorization_url, reference: session.reference });
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Could not retry payment" },
      { status: 500 }
    );
  }
}
