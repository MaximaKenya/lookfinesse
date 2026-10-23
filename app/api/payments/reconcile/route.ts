import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { cronUnauthorized, isCronAuthorized } from "@/lib/cron/authorize";
import { paymentsEnabled } from "@/lib/config/payments";
import { isPaystackConfigured } from "@/lib/paystack/client";
import { fulfillPaystackReference } from "@/lib/paystack/fulfill";
import { runTrialReminders } from "@/lib/trial/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily reconciliation. Verifies every pending Paystack payment before granting value.
 */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return cronUnauthorized();

  const reminders = await runTrialReminders();

  if (!paymentsEnabled() || !isPaystackConfigured()) {
    return NextResponse.json({
      message: paymentsEnabled()
        ? "Paystack is not configured"
        : "Payments are paused. Trial reminders still ran.",
      checked: 0,
      results: [],
      reminders,
    });
  }

  const { data: stuckPayments, error } = await supabase
    .from("payments")
    .select("id, provider, status, checkout_request_id, provider_ref, created_at")
    .eq("provider", "paystack")
    .in("status", ["pending", "processing"])
    .lt("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
    .limit(100);

  if (error) {
    const missing = /provider_ref|column/i.test(error.message ?? "");
    if (missing) {
      const retry = await supabase
        .from("payments")
        .select("id, provider, status, checkout_request_id, created_at")
        .eq("provider", "paystack")
        .eq("status", "pending")
        .limit(100);
      if (retry.error) {
        return NextResponse.json({ message: "Could not list payments", reminders }, { status: 503 });
      }
      const retryBody = await reconcileRows(retry.data ?? []);
      return NextResponse.json({ ...retryBody, reminders });
    }
    return NextResponse.json({ message: "Could not list payments", reminders }, { status: 503 });
  }

  const body = await reconcileRows(stuckPayments ?? []);
  return NextResponse.json({ ...body, reminders });
}

async function reconcileRows(rows: { id: string; checkout_request_id?: string | null; provider_ref?: string | null }[]) {
  const results: { id: string; status: string }[] = [];
  for (const payment of rows) {
    const reference = payment.provider_ref || payment.checkout_request_id;
    if (!reference) {
      results.push({ id: payment.id, status: "skipped_no_reference" });
      continue;
    }
    try {
      const result = await fulfillPaystackReference(reference);
      results.push({ id: payment.id, status: result.ok ? result.status : result.status });
    } catch (err) {
      console.error("[reconcile]", payment.id, err);
      results.push({ id: payment.id, status: "verify_failed" });
    }
  }

  return {
    message: "Reconciliation complete",
    checked: rows.length,
    results,
  };
}
