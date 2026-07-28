import { supabase } from "@/lib/supabaseClient";

import { logEvent } from "@/lib/events/logEvent";

import { FinancialEventType } from "@/lib/events/types";

import { updateBehaviorProfile } from "@/lib/intelligence/baselineEngine";

import { computeBehavioralRisk } from "@/lib/intelligence/behavioralRisk";

type LedgerInput = {
  payment_id?: string;

  order_id?: string;

  vendor_id?: string;

  amount: number;

  type: "credit" | "debit";

  category: string;

  description?: string;

  status?: "pending" | "completed" | "reversed";

  idempotency_key?: string;

  geo_location?: string;

  device_id?: string;
};

export async function createLedgerEntry(
  input: LedgerInput
) {
  try {
    const idempotencyKey =
      input.payment_id && input.category
        ? `${input.payment_id}-${input.category}`
        : undefined;

    /**
     * PREVENT DUPLICATE ENTRIES
     */
    if (idempotencyKey) {
      const { data: existing } =
        await supabase
          .from("ledger_entries")
          .select("id")
          .eq(
            "idempotency_key",
            idempotencyKey
          )
          .maybeSingle();

      if (existing) {
        console.log(
          "⚠️ Ledger already exists:",
          idempotencyKey
        );

        return existing;
      }
    }

    /**
     * BEHAVIORAL RISK ENGINE
     */

    let behavioralRisk = null;

    if (input.vendor_id) {
      behavioralRisk =
        await computeBehavioralRisk(
          input.vendor_id,
          {
            amount: input.amount,

            geo_location:
              input.geo_location,

            device_id:
              input.device_id,

            created_at:
              new Date().toISOString(),
          }
        );

      console.log(
        "🧠 Behavioral Risk:",
        behavioralRisk
      );
    }

    /**
     * CREATE LEDGER ENTRY
     */

    const { data, error } =
      await supabase
        .from("ledger_entries")
        .insert({
          payment_id:
            input.payment_id,

          order_id:
            input.order_id,

          vendor_id:
            input.vendor_id ?? null,

          amount: input.amount,

          type: input.type,

          category:
            input.category,

          description:
            input.description ??
            null,

          status:
            input.status ??
            "completed",

          idempotency_key:
            idempotencyKey,

          geo_location:
            input.geo_location ??
            null,

          device_id:
            input.device_id ??
            null,

          /**
           * NEW INTELLIGENCE FIELDS
           */
          behavioral_risk_score:
            behavioralRisk?.score ??
            0,

          behavioral_risk_severity:
            behavioralRisk?.severity ??
            "LOW",

          behavioral_risk_reasons:
            behavioralRisk?.reasons ??
            [],
        })
        .select()
        .single();

    if (error) {
      console.error(
        "❌ Ledger insert error:",
        error
      );

      throw error;
    }

    /**
     * UPDATE VENDOR MEMORY PROFILE
     */

    if (input.vendor_id) {
      await updateBehaviorProfile(
        input.vendor_id,
        {
          amount: input.amount,

          geo_location:
            input.geo_location,

          device_id:
            input.device_id,

          created_at:
            new Date().toISOString(),
        }
      );
    }

    /**
     * EVENT LOGGING
     */

    await logEvent({
      event_type:
        FinancialEventType.LEDGER_ENTRY_CREATED,

      entity_type: "ledger",

      entity_id: data.id,

      amount: input.amount,

      metadata: {
        category:
          input.category,

        type: input.type,

        vendor_id:
          input.vendor_id,

        behavioral_risk_score:
          behavioralRisk?.score,

        behavioral_risk_severity:
          behavioralRisk?.severity,

        behavioral_risk_reasons:
          behavioralRisk?.reasons,

        geo_location:
          input.geo_location,

        device_id:
          input.device_id,
      },
    });

    /**
     * AUTO RISK ESCALATION
     */

    if (
      behavioralRisk &&
      behavioralRisk.severity ===
        "CRITICAL"
    ) {
      await logEvent({
        event_type:
          FinancialEventType.FRAUD_DETECTED,

        entity_type: "vendor",

        entity_id:
          input.vendor_id || "unknown",

        amount: input.amount,

        metadata: {
          alert:
            "Critical behavioral anomaly detected",

          risk_score:
            behavioralRisk.score,

          reasons:
            behavioralRisk.reasons,
        },
      });

      console.warn(
        "🚨 CRITICAL BEHAVIORAL ANOMALY:",
        behavioralRisk
      );
    }

    /**
     * UPDATE WALLET BALANCE
     */

    if (
      input.vendor_id &&
      input.type === "credit" &&
      (input.status ??
        "completed") ===
        "completed"
    ) {
      await supabase.rpc(
        "increment_wallet_balance",
        {
          vendor:
            input.vendor_id,

          amount:
            input.amount,
        }
      );
    }

    return data;
  } catch (err) {
    console.error(
      "❌ createLedgerEntry failed:",
      err
    );

    throw err;
  }
}