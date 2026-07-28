import { supabase } from "@/lib/supabaseClient";

import { logEvent } from "@/lib/audit/logEvent";

import { triggerAlert } from "@/lib/alerts/triggerAlert";

export async function executeAction(
  action: string,
  payload: any
) {
  switch (action) {
    case "freeze_payout":
      await supabase
        .from("vendors")

        .update({
          payouts_frozen: true,
        })

        .eq(
          "id",
          payload.vendor_id
        );

      break;

    case "block_transaction":
      await supabase
        .from("ledger_entries")

        .update({
          blocked: true,
        })

        .eq("id", payload.id);

      break;

    case "quarantine_vendor":
      await supabase
        .from("vendors")

        .update({
          quarantined: true,
        })

        .eq(
          "id",
          payload.vendor_id
        );

      break;

    case "escalate_cluster":
      await triggerAlert(
        "FRAUD_CLUSTER_ESCALATION",
        payload
      );

      break;
  }

  await logEvent(
    "DEFENSE_ACTION_EXECUTED",
    {
      action,
      payload,
    }
  );

  return {
    success: true,
    action,
  };
}