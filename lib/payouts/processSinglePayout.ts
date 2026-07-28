import { supabase } from "@/lib/supabaseClient";
import { getNextRetryTime } from "./retry";
import { fakePayoutRail } from "./fakePayoutRail";

import { postLedgerEntry } from "@/lib/ledger/ledgerEngine";
import { calculateRiskScore, saveRiskScore } from "@/lib/fraud/riskEngine";
import { checkFraudRules } from "@/lib/fraud/fraudRules";

export async function processSinglePayout(payoutId: string) {
  // 1. FETCH PAYOUT FIRST (CRITICAL FIX)
  const { data: payout } = await supabase
    .from("payout_queue")
    .select("*")
    .eq("id", payoutId)
    .single();

  if (!payout) return;
  if (
    payout.status !== "QUEUED" &&
    payout.status !== "RETRY_SCHEDULED"
  ) return;

  try {
    // 2. FRAUD CHECK (NOW SAFE - payout EXISTS)
    const fraudEvents = await checkFraudRules({
      vendor_id: payout.vendor_id,
      payout_amount: payout.amount,
    });

    if (fraudEvents.length > 0) {
      await supabase.from("fraud_events").insert(
        fraudEvents.map((e) => ({
          vendor_id: payout.vendor_id,
          payout_id: payout.id,
          event_type: e.type,
          severity: e.severity,
          metadata: {},
        }))
      );

      const maxSeverity = Math.max(
        ...fraudEvents.map((e) => e.severity)
      );

      if (maxSeverity >= 8) {
        throw new Error("PAYOUT BLOCKED: FRAUD RISK DETECTED");
      }
    }

    // 3. LOCK STEP
    await supabase
      .from("payout_queue")
      .update({ status: "PROCESSING" })
      .eq("id", payoutId);


    // 3.5 stops execution mid-flight if vendor becomes risky

      const { data: risk } = await supabase
  .from("vendor_risk_scores")
  .select("*")
  .eq("vendor_id", payout.vendor_id)
  .single();

if (risk?.is_frozen) {
  throw new Error("PAYOUT BLOCKED: VENDOR FROZEN");
}

    // 4. EXECUTE PAYOUT
    const success = await fakePayoutRail(payout);

    if (!success) throw new Error("Payout failed");

    // 5. MARK SUCCESS
    await supabase
      .from("payout_queue")
      .update({
        status: "SENT",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId);

    // 6. LEDGER ENTRY (SUCCESS PATH)
    await postLedgerEntry({
      vendor_id: payout.vendor_id,
      payout_id: payout.id,
      type: "DEBIT",
      amount: payout.amount,
      description: "Payout executed",
      reference: `PAYOUT-${payout.id}`,
    });

    // 7. RISK SCORING UPDATE (POST-EVENT ANALYSIS)
    const { data: recent } = await supabase
      .from("payout_queue")
      .select("*")
      .eq("vendor_id", payout.vendor_id);

    const score = await calculateRiskScore({
      vendor_id: payout.vendor_id,
      payout_amount: payout.amount,
      recent_payout_count: recent?.length ?? 0,
      failed_attempts: payout.attempt_count ?? 0,
    });

    await saveRiskScore(payout.vendor_id, score);
  } catch (err) {
    // 8. FAILURE HANDLING + RETRY LOGIC
    const attempt = (payout.attempt_count || 0) + 1;

    await supabase
      .from("payout_queue")
      .update({
        status: attempt >= 5 ? "FAILED" : "RETRY_SCHEDULED",
        attempt_count: attempt,
        next_retry_at: getNextRetryTime(attempt),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId);
  }
}