import { supabase } from "@/lib/supabaseClient";

export async function logEvent(
  event: string,
  data: any
) {
  await supabase.from("audit_logs").insert({
    event,
    data,
    timestamp: new Date(),
  });
}