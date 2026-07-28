import { supabase } from "@/lib/supabaseClient";

export async function runAMLChecks(params: {
  vendor_id: string;
  transaction_amount: number;
}) {
  const alerts = [];

  if (params.transaction_amount > 500000) {
    alerts.push({
      vendor_id: params.vendor_id,
      alert_type: "LARGE_TRANSACTION",
      severity: 8,
      description:
        "Large transaction threshold exceeded",
    });
  }

  if (alerts.length > 0) {
    await supabase
      .from("aml_alerts")
      .insert(alerts);
  }

  return alerts;
}