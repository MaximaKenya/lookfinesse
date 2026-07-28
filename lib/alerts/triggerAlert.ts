import { supabase } from "@/lib/supabaseClient";
import { logEvent } from "@/lib/audit/logEvent";
import { sendEmailAlert } from "./sendEmailAlert";

export async function triggerAlert(
  type: string,
  payload: any
) {
  const { data, error } = await supabase
    .from("alerts")
    .insert({
      type,
      payload,
      severity:
        payload.risk_score > 0.8
          ? "critical"
          : "warning",

      created_at: new Date(),
    })
    .select()
    .single();

  await logEvent("ALERT_TRIGGERED", {
    type,
    payload,
  });

  if (payload.risk_score > 0.8) {
    await sendEmailAlert(type, payload);
  }

  return data;
}