import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as fallbackClient } from "@/lib/supabaseClient";
import { createSupabaseServiceRole } from "@/lib/supabase/serviceRole";
import { postJournal } from "@/lib/finance/postJournal";
import { createLedgerEntry } from "@/lib/finance/ledger";
import { syncOrderState } from "@/lib/payments/syncOrderState";
import { syncBookingPayment } from "@/lib/payments/syncBookingState";
import { isLookfinesseMetadata, verifyTransaction } from "@/lib/paystack/client";
import { awardPoints } from "@/lib/gamification/award";

export type FulfillResult =
  | { ok: true; status: "paid" | "already_paid"; reference: string }
  | { ok: false; status: string; message: string };

function db(): SupabaseClient {
  return createSupabaseServiceRole() ?? fallbackClient;
}

async function findPayment(reference: string) {
  const client = db();
  const byRef = await client
    .from("payments")
    .select("*")
    .eq("checkout_request_id", reference)
    .maybeSingle();
  if (byRef.data) return byRef.data;

  try {
    const byProvider = await client
      .from("payments")
      .select("*")
      .eq("provider_ref", reference)
      .maybeSingle();
    if (byProvider.data) return byProvider.data;
  } catch {
    /* provider_ref column may be absent until migration 030 */
  }
  return null;
}

/**
 * Verify a Paystack reference, then grant order / booking / subscription value once.
 * Callers must not mark anything paid before this returns ok.
 */
export async function fulfillPaystackReference(reference: string): Promise<FulfillResult> {
  if (!reference.startsWith("LF-")) {
    return { ok: false, status: "ignored", message: "Reference is not a LookFinesse payment" };
  }

  const verified = await verifyTransaction(reference);
  if (!isLookfinesseMetadata(verified.metadata)) {
    return { ok: false, status: "ignored", message: "Transaction is not tagged lookfinesse" };
  }
  if (verified.status !== "success") {
    return { ok: false, status: verified.status || "pending", message: "Payment is not successful yet" };
  }
  if (verified.currency && verified.currency !== "KES") {
    return { ok: false, status: "currency", message: "Expected KES" };
  }

  const payment = await findPayment(reference);
  if (!payment) {
    return { ok: false, status: "missing", message: "No matching payment" };
  }
  if (payment.status === "paid") {
    return { ok: true, status: "already_paid", reference };
  }

  const expected = Math.round(Number(payment.amount) * 100);
  if (Number.isFinite(expected) && expected > 0 && verified.amountSubunits > 0) {
    if (Math.abs(verified.amountSubunits - expected) > 1) {
      return { ok: false, status: "amount_mismatch", message: "Verified amount does not match the order" };
    }
  }

  const client = db();
  const meta = (payment.metadata ?? {}) as Record<string, string>;
  const now = new Date().toISOString();

  const { data: updated, error } = await client
    .from("payments")
    .update({
      status: "paid",
      provider: "paystack",
      updated_at: now,
    })
    .eq("id", payment.id)
    .neq("status", "paid")
    .select()
    .maybeSingle();

  if (error) {
    return { ok: false, status: "update_failed", message: error.message };
  }
  if (!updated) {
    return { ok: true, status: "already_paid", reference };
  }

  if (updated.order_id) {
    try {
      await syncOrderState(updated.order_id);
    } catch (err) {
      console.error("[paystack] order sync", err);
    }
  }

  const bookingId = meta.booking_id || updated.booking_id;
  if ((meta.kind === "booking" || bookingId) && bookingId) {
    try {
      await syncBookingPayment(String(bookingId), "paystack");
    } catch (err) {
      console.error("[paystack] booking sync", err);
    }
  }

  if (meta.kind === "service_subscription" && meta.subscription_id) {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await client
      .from("customer_subscriptions")
      .update({
        status: "active",
        payment_method: "paystack",
        current_period_start: now,
        current_period_end: periodEnd.toISOString(),
        next_billing_at: periodEnd.toISOString(),
        updated_at: now,
      })
      .eq("id", meta.subscription_id);
  }

  if (meta.kind === "platform_sub" && meta.vendor_id) {
    await client
      .from("platform_subscriptions")
      .update({ status: "active", payment_method: "paystack", updated_at: now })
      .eq("vendor_id", meta.vendor_id);
  }

  if (meta.kind === "ad_campaign" && meta.campaign_id) {
    await client.from("ad_campaigns").update({ status: "live" }).eq("id", meta.campaign_id);
  }

  const total = Number(updated.amount);
  const vendorId = updated.vendor_id as string | null;

  try {
    await createLedgerEntry({
      payment_id: updated.id,
      order_id: updated.order_id ?? undefined,
      vendor_id: vendorId ?? undefined,
      amount: total,
      type: "credit",
      category: "escrow",
      description: "Paystack payment held in escrow",
      status: "pending",
    });
  } catch (err) {
    console.error("[paystack] ledger", err);
  }

  if (vendorId) {
    try {
      await postJournal({
        reference: `paystack-${updated.id}`,
        description: "Paystack payment",
        entries: [
          { account_id: "cash:paystack", type: "debit", amount: total },
          { account_id: `escrow:${vendorId}`, type: "credit", amount: total },
        ],
      });
    } catch (err) {
      console.error("[paystack] journal", err);
    }
  }

  const userId = meta.user_id || (updated.user_id as string | undefined);
  const points = meta.kind === "booking" ? 40 : 25;
  const badge = meta.kind === "booking" ? "booked_in" : "first_purchase";
  try {
    await awardPoints(client, userId, points, badge);
  } catch (err) {
    console.error("[paystack] points", err);
  }

  return { ok: true, status: "paid", reference };
}
