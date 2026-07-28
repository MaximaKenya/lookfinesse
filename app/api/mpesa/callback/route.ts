import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { detectFraud } from "@/lib/security/fraud";
import { logAudit } from "@/lib/audit/log";
import { syncOrderState } from "@/lib/payments/syncOrderState";
import { syncBookingPayment } from "@/lib/payments/syncBookingState";
import { postJournal } from "@/lib/finance/postJournal";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stk = body?.Body?.stkCallback;

    if (!stk) {
      return NextResponse.json({ message: "Invalid callback" });
    }

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = stk;

    const metadata = CallbackMetadata?.Item || [];

    const getValue = (name: string) =>
      metadata.find((i: any) => i.Name === name)?.Value;

    const receipt = getValue("MpesaReceiptNumber");
    const amount = Number(getValue("Amount"));
    const phone = getValue("PhoneNumber");

    const status = ResultCode === 0 ? "paid" : "failed";

    // 🔍 Fetch payment
    const { data: payment } = await supabase
      .from("payments")
      .select("*")
      .eq("checkout_request_id", CheckoutRequestID)
      .single();

    if (!payment) {
      return NextResponse.json({ message: "Payment not found" });
    }

    // 🔒 Idempotency
    if (payment.status === "paid") {
      return NextResponse.json({ message: "Already processed" });
    }

    // 🚨 Fraud pre-check
    if (status === "paid" && Number(payment.amount) !== amount) {
      await supabase.from("fraud_logs").insert({
        tenant_id: payment.vendor_id,
        reason: "Amount mismatch",
        payload: body,
      });

      throw new Error("Amount mismatch");
    }

    // 🔥 Update payment
    const { data: updatedPayment } = await supabase
      .from("payments")
      .update({
        status,
        mpesa_receipt: receipt,
        phone,
        raw_callback: body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
      .select()
      .single();

    // 🔄 Order state — skip for non-order payments (membership, ads, platform sub)
    let orderStatus: string | null = null;
    if (updatedPayment.order_id) {
      orderStatus = await syncOrderState(updatedPayment.order_id);
    }

    if (status === "paid") {
      const meta = (updatedPayment.metadata ?? {}) as Record<string, string>;
      const kind = meta.kind;

      if (kind === "platform_sub" && meta.vendor_id) {
        await supabase
          .from("platform_subscriptions")
          .update({
            status: "active",
            payment_ref: receipt,
            updated_at: new Date().toISOString(),
          })
          .eq("vendor_id", meta.vendor_id);
      }

      if (kind === "ad_campaign" && meta.campaign_id) {
        await supabase
          .from("ad_campaigns")
          .update({ status: "live", payment_ref: receipt })
          .eq("id", meta.campaign_id);
      }

      if (kind === "booking" && (meta.booking_id || updatedPayment.booking_id)) {
        await syncBookingPayment(
          String(meta.booking_id ?? updatedPayment.booking_id),
          "mpesa"
        );
      }

      if (kind === "service_subscription" && meta.subscription_id) {
        const periodEnd = new Date();
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        await supabase
          .from("customer_subscriptions")
          .update({
            status: "active",
            payment_method: "mpesa",
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
            next_billing_at: periodEnd.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", meta.subscription_id);
      }

      const total = Number(updatedPayment.amount);

      // Side-effects wrapped individually so a failure in one doesn't roll back the order update
      try {
        // 🧾 JOURNAL (Mpesa → Escrow)
        const escrowAccount = updatedPayment.vendor_id
          ? `escrow:${updatedPayment.vendor_id}`
          : "escrow:platform";

        await postJournal({
          reference: `mpesa-${updatedPayment.id}`,
          description: "Mpesa payment",
          entries: [
            { account_id: "cash:mpesa", type: "debit", amount: total },
            { account_id: escrowAccount, type: "credit", amount: total },
          ],
        });
      } catch (journalErr) {
        console.error("⚠️ Journal failed (non-fatal):", journalErr);
      }

      try {
        // 🧾 Invoice
        await supabase.from("invoices").insert({
          tenant_id: updatedPayment.vendor_id ?? null,
          order_id: updatedPayment.order_id,
          vendor_id: updatedPayment.vendor_id ?? null,
          amount: total,
        });
      } catch (invoiceErr) {
        console.error("⚠️ Invoice failed (non-fatal):", invoiceErr);
      }

      try {
        // 🧾 Audit
        await logAudit({
          action: "payment_success",
          entity: "payment",
          entity_id: updatedPayment.id,
          metadata: updatedPayment,
        });
      } catch (auditErr) {
        console.error("⚠️ Audit log failed (non-fatal):", auditErr);
      }
    }

    // 🔍 Async fraud
    setTimeout(async () => {
      try {
        const fraud = await detectFraud(updatedPayment);
        if (fraud.flagged) {
          await supabase.from("fraud_logs").insert({
            tenant_id: updatedPayment.vendor_id,
            reason: fraud.reason,
            payload: updatedPayment,
          });
        }
      } catch {}
    }, 0);

    return NextResponse.json({ message: "Callback processed", orderStatus });

  } catch (err) {
    console.error("❌ CALLBACK ERROR:", err);
    return NextResponse.json(
      { message: "Callback error", error: String(err) },
      { status: 500 }
    );
  }
}