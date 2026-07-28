import { supabase } from "@/lib/supabaseClient";

import { logEvent } from "@/lib/events/logEvent";

import { FinancialEventType } from "@/lib/events/types";

/**
 * SINGLE SOURCE OF TRUTH STATE MACHINE
 * - ONLY this function is allowed to update order status
 * - Called ONLY from callback
 */
export async function syncOrderState(orderId: string) {
  // 1. Get payment
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .single();

  if (!payment) return;

  // 2. Determine final order state
  let status: "pending" | "paid" | "failed" = "pending";

  if (payment.status === "paid") status = "paid";
  if (payment.status === "failed") status = "failed";

  // 3. Update order ONLY if needed
  const { error } = await supabase
  .from("orders")
  .update({
    status,
    updated_at: new Date().toISOString(),
  })
  .eq("id", orderId);

if (error) {
  throw error;
}

if (status === "paid") {
  await logEvent({
    event_type:
      FinancialEventType.ORDER_PAID,

    entity_type: "order",

    entity_id: orderId,

    amount: payment.amount,

    metadata: {
      payment_id: payment.id,
    },
  });
}

if (status === "failed") {
  await logEvent({
    event_type:
      FinancialEventType.ORDER_FAILED,

    entity_type: "order",

    entity_id: orderId,

    amount: payment.amount,

    metadata: {
      payment_id: payment.id,
    },
  });
}

  return status;
}