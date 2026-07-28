import { supabase } from "@/lib/supabaseClient";

export async function logComplianceEvent(params: {
  vendor_id: string;
  event_type: string;
  details: Record<string, unknown>;
}) {
  await supabase
    .from("compliance_audit_logs")
    .insert([
      {
        ...params,
      },
    ]);
}