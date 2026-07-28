import Stripe from "stripe";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabaseClient";
import { detectFraud } from "@/lib/security/fraud";
import { logAudit } from "@/lib/audit/log";
import { postJournal } from "@/lib/finance/postJournal";
import { syncOrderState } from "@/lib/payments/syncOrderState";
import { syncBookingPayment } from "@/lib/payments/syncBookingState";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return new Response("Stripe not configured", { status: 503 });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" as any });
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const body = await req.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig) return new Response("Missing signature", { status: 400 });

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return new Response("Webhook Error", { status: 400 });
  }

  try {
    // ================================
    // 💳 PAYMENT SUCCESS
    // ================================
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const { data: payment } = await supabase
        .from("payments")
        .select("*")
        .eq("stripe_session_id", session.id)
        .single();

      if (!payment) return new Response("Not found", { status: 404 });

      if (payment.status === "paid") return new Response("ok");

      const { data: updatedPayment } = await supabase
        .from("payments")
        .update({
          status: "paid",
          stripe_payment_intent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
        })
        .eq("id", payment.id)
        .select()
        .single();

      // 🔄 Sync order status to "paid"
      if (updatedPayment.order_id) {
        await syncOrderState(updatedPayment.order_id);
      }

      const meta = (updatedPayment.metadata ?? {}) as Record<string, string>;
      if (meta.kind === "booking" && (meta.booking_id || updatedPayment.booking_id)) {
        await syncBookingPayment(
          String(meta.booking_id ?? updatedPayment.booking_id),
          "stripe"
        );
      }

      if (meta.kind === "service_subscription" && meta.subscription_id) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        await supabase
          .from("customer_subscriptions")
          .update({
            status: "active",
            payment_method: "stripe",
            stripe_subscription_id: session.subscription as string | null,
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
            next_billing_at: periodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", meta.subscription_id);
      }

      const total = Number(updatedPayment.amount);

      // 🧾 JOURNAL
      await postJournal({
        reference: `stripe-${updatedPayment.id}`,
        description: "Stripe payment",
        entries: [
          { account_id: "cash:stripe", type: "debit", amount: total },
          {
            account_id: `escrow:${updatedPayment.vendor_id}`,
            type: "credit",
            amount: total,
          },
        ],
      });

      await logAudit({
        action: "payment_success",
        metadata: updatedPayment,
      });
    }

    // ================================
    // 💸 REFUND
    // ================================
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;

      const { data: payment } = await supabase
        .from("payments")
        .select("*")
        .eq("stripe_payment_intent", charge.payment_intent)
        .single();

      if (payment) {
        await postJournal({
          reference: `refund-${payment.id}`,
          description: "Stripe refund",
          entries: [
            {
              account_id: `escrow:${payment.vendor_id}`,
              type: "debit",
              amount: payment.amount,
            },
            {
              account_id: "cash:stripe",
              type: "credit",
              amount: payment.amount,
            },
          ],
        });

        await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("id", payment.id);
      }
    }

    return new Response("ok");
  } catch (err) {
    console.error(err);
    return new Response("Error", { status: 500 });
  }
}