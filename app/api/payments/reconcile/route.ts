import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";

import {
  getAccessToken,
  generatePassword,
  getTimestamp,
} from "@/lib/mpesa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 🔐 ENV
// 🔁 MAIN ENTRY
export async function GET() {
  try {
    console.log("🔄 Starting reconciliation...");

    // 🔍 1. FIND STUCK PAYMENTS
    const { data: stuckPayments, error } = await supabase
      .from("payments")
      .select("*")
      .eq("status", "pending")
      .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

    if (error) {
      console.error("❌ Fetch error:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    console.log(`🧠 Found ${stuckPayments?.length || 0} stuck payments`);

    const results: any[] = [];

    // 🔁 2. PROCESS EACH PAYMENT
    for (const payment of stuckPayments || []) {
      try {
        if (payment.provider === "stripe") {
          const res = await reconcileStripe(payment);
          results.push(res);
        }

        if (payment.provider === "mpesa") {
          const res = await reconcileMpesa(payment);
          results.push(res);
        }
      } catch (err) {
        console.error("⚠️ Error processing payment:", payment.id, err);
      }
    }

    return NextResponse.json({
      message: "Reconciliation complete",
      checked: stuckPayments?.length || 0,
      results,
    });

  } catch (err) {
    console.error("🔥 Reconciliation error:", err);

    return NextResponse.json(
      { message: "Server error", error: String(err) },
      { status: 500 }
    );
  }
}

async function reconcileStripe(payment: any) {
  if (!payment.stripe_session_id) {
    return { id: payment.id, status: "skipped_no_session" };
  }

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" as any })
    : null;

  if (!stripe) {
    return { id: payment.id, status: "skipped_no_stripe_key" };
  }

  const session = await stripe.checkout.sessions.retrieve(
    payment.stripe_session_id
  );

  if (session.payment_status === "paid") {
    // ✅ FIX MISSED WEBHOOK
    await supabase
      .from("payments")
      .update({
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", payment.order_id);

    return { id: payment.id, status: "fixed_paid" };
  }

  if (session.status === "expired") {
    await supabase
      .from("payments")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    return { id: payment.id, status: "marked_failed" };
  }

  return { id: payment.id, status: "still_pending" };
}

async function reconcileMpesa(payment: any) {
  if (!payment.checkout_request_id) {
    return { id: payment.id, status: "skipped_no_checkout_id" };
  }

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

  const resultCode = String(data.ResultCode ?? data.resultCode ?? "");

  if (resultCode === "0") {
    // ✅ PAID
    await supabase
      .from("payments")
      .update({
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", payment.order_id);

    return { id: payment.id, status: "fixed_paid" };
  }

  if (resultCode && resultCode !== "") {
    // ❌ FAILED
    await supabase
      .from("payments")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    return { id: payment.id, status: "marked_failed" };
  }

  return { id: payment.id, status: "unknown" };
}