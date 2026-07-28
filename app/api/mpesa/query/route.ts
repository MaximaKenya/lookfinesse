import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import {
  getAccessToken,
  getTimestamp,
  generatePassword,
} from "@/lib/mpesa";
import { syncOrderState } from "@/lib/payments/syncOrderState";

/**
 * POST /api/mpesa/query
 * Queries Safaricom for STK push status and reconciles order/payment.
 * Used as a fallback when the sandbox callback can't reach localhost.
 */
export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ message: "Missing orderId" }, { status: 400 });
    }

    // 1. Look up the pending payment for this order
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ message: "Payment not found", status: "pending" }, { status: 404 });
    }

    // Already settled — return current status immediately
    if (payment.status === "paid") {
      return NextResponse.json({ status: "paid", message: "Already paid" });
    }
    if (payment.status === "failed") {
      return NextResponse.json({ status: "failed", message: "Payment failed" });
    }

    if (!payment.checkout_request_id) {
      return NextResponse.json({ message: "No checkout_request_id on payment", status: "pending" });
    }

    // 2. Query Safaricom for the transaction status
    const accessToken = await getAccessToken();
    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);

    const queryRes = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
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

    const rawText = await queryRes.text();
    let queryData: any = null;
    try {
      queryData = rawText ? JSON.parse(rawText) : null;
    } catch {
      console.error("Failed to parse Safaricom query response:", rawText);
      return NextResponse.json({ message: "Safaricom query parse error", status: "pending" });
    }

    console.log("📡 STK QUERY RESPONSE:", queryData);

    if (!queryData) {
      return NextResponse.json({ message: "Empty response from Safaricom", status: "pending" });
    }

    // ResultCode 0 = success, 1032 = cancelled, 1037 = timeout
    const resultCode = Number(queryData.ResultCode);
    const newStatus = resultCode === 0 ? "paid" : resultCode !== undefined ? "failed" : null;

    if (!newStatus) {
      // Query itself returned an error (e.g. still processing)
      return NextResponse.json({
        message: queryData.ResultDesc || queryData.errorMessage || "Still processing",
        status: "pending",
      });
    }

    // 3. Update payment row
    const { data: updatedPayment } = await supabase
      .from("payments")
      .update({
        status: newStatus,
        mpesa_receipt: queryData.MpesaReceiptNumber || null,
        raw_callback: queryData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .select()
      .single();

    // 4. Sync order state
    await syncOrderState(orderId);

    return NextResponse.json({
      status: newStatus,
      message: newStatus === "paid" ? "Payment confirmed" : "Payment failed or cancelled",
      resultCode,
      resultDesc: queryData.ResultDesc,
    });

  } catch (err) {
    console.error("❌ STK QUERY ERROR:", err);
    return NextResponse.json(
      { message: "Query error", error: String(err), status: "pending" },
      { status: 500 }
    );
  }
}
