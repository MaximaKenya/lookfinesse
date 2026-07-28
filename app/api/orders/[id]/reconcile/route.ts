import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { getAccessToken, generatePassword, getTimestamp } from "@/lib/mpesa";
import { syncOrderState } from "@/lib/payments/syncOrderState";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    // 1. Get the order
    const { data: order } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", id)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status === "paid") {
      return NextResponse.json({ status: "paid", message: "Already paid" });
    }

    // 2. Get the payment row
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", id)
      .single();

    if (!payment) {
      return NextResponse.json({ status: "pending", message: "No payment record found yet" });
    }

    if (payment.status === "paid") {
      // Sync order just in case
      await syncOrderState(id);
      return NextResponse.json({ status: "paid", message: "Payment confirmed" });
    }

    if (payment.status === "failed") {
      return NextResponse.json({ status: "failed", message: "Payment failed" });
    }

    // 3. For M-Pesa: query STK status directly
    if (payment.provider === "mpesa" && payment.checkout_request_id) {
      try {
        const token = await getAccessToken();
        const timestamp = getTimestamp();
        const password = generatePassword(timestamp);

        const res = await fetch(
          "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              BusinessShortCode: process.env.MPESA_SHORTCODE,
              Password: password,
              Timestamp: timestamp,
              CheckoutRequestID: payment.checkout_request_id,
            }),
          }
        );

        const data = await res.json();
        console.log("🔍 STK Query result:", JSON.stringify(data));

        // ResultCode comes back as string "0" or number 0
        const resultCode = String(data.ResultCode ?? data.resultCode ?? "");

        if (resultCode === "0") {
          // Payment confirmed — update payment row
          await supabase
            .from("payments")
            .update({ status: "paid", updated_at: new Date().toISOString() })
            .eq("id", payment.id);

          // Sync order
          await syncOrderState(id);

          return NextResponse.json({ status: "paid", message: "Payment confirmed via M-Pesa query" });
        }

        if (resultCode === "1032") {
          // User cancelled
          await supabase
            .from("payments")
            .update({ status: "failed", updated_at: new Date().toISOString() })
            .eq("id", payment.id);

          await syncOrderState(id);

          return NextResponse.json({ status: "failed", message: "Payment was cancelled" });
        }

        if (resultCode === "1037") {
          // Timeout
          await supabase
            .from("payments")
            .update({ status: "failed", updated_at: new Date().toISOString() })
            .eq("id", payment.id);

          await syncOrderState(id);

          return NextResponse.json({ status: "failed", message: "Payment request timed out" });
        }

        // Still pending or unknown result
        return NextResponse.json({
          status: "pending",
          message: "Payment not confirmed yet — please wait and try again",
          stkQueryResult: data.ResultDesc || data.errorMessage || "Still processing",
        });
      } catch (stkErr) {
        console.error("STK query failed:", stkErr);
        return NextResponse.json({
          status: "pending",
          message: "Could not reach M-Pesa — please wait a moment",
        });
      }
    }

    // Fallback: just re-read payment from DB
    return NextResponse.json({
      status: payment.status ?? "pending",
      message: "Payment status checked",
    });
  } catch (err) {
    console.error("Reconcile error:", err);
    return NextResponse.json({ status: "pending", message: "Error checking payment" }, { status: 500 });
  }
}
