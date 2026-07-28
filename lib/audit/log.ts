import { supabase } from "@/lib/supabaseClient";

export async function logAudit({
  action,
  table_name,
  record_id,
  entity,
  entity_id,
  actor_id,
  metadata = {},
}: {
  action: string;
  table_name?: string;
  record_id?: string;
  entity?: string;
  entity_id?: string;
  actor_id?: string;
  metadata?: any;
}) {
  await supabase.from("audit_logs").insert({
    action,
    table_name: table_name ?? entity ?? "unknown",
    record_id: record_id ?? entity_id ?? null,
    actor_id,
    metadata,
  });
}
