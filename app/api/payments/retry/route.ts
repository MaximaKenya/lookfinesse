import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabaseClient";
import { getRequestOrigin } from "@/lib/url";
import {
  getAccessToken,
  getTimestamp,
  generatePassword,
} from "@/lib/mpesa";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" as any })
    : null;
  try {
    const { paymentId } = await req.json();
    const origin = getRequestOrigin(req);

    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (!payment) {
      return NextResponse.json({ message: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "paid") {
      return NextResponse.json(
        { message: "Cannot retry paid payment" },
        { status: 400 }
      );
    }

    // 🔁 MPESA RETRY
    if (payment.provider === "mpesa") {
      const token = await getAccessToken();
      const timestamp = getTimestamp();
      const password = generatePassword(timestamp);

      const res = await fetch(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
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
            TransactionType: "CustomerPayBillOnline",
            Amount: payment.amount,
            PartyA: payment.phone,
            PartyB: process.env.MPESA_SHORTCODE,
            PhoneNumber: payment.phone,
            CallBackURL: `${origin}/api/mpesa/callback`,
            AccountReference: payment.order_id,
            TransactionDesc: "Retry Payment",
          }),
        }
      );

      const data = await res.json();

      // 🔥 update with new IDs
      await supabase
        .from("payments")
        .update({
          checkout_request_id: data.CheckoutRequestID,
          merchant_request_id: data.MerchantRequestID,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      return NextResponse.json({ message: "MPESA retry sent", data });
    }

    // 💳 STRIPE RETRY
    if (payment.provider === "stripe") {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "kes",
              product_data: { name: "Retry Payment" },
              unit_amount: Math.round(payment.amount * 100),
            },
            quantity: 1,
          },
        ],
        success_url: `${origin}/checkout/success?orderId=${payment.order_id}`,
        cancel_url: `${origin}/checkout/failed`,
        metadata: {
          orderId: payment.order_id,
        },
      });

      await supabase
        .from("payments")
        .update({
          stripe_session_id: session.id,
          status: "pending",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ message: "Unknown provider" });

  } catch (err) {
    console.error("🔥 Retry error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}