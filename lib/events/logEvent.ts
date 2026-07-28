import { supabase } from "@/lib/supabaseClient";

type FinancialEvent = {
  event_type: string;
  entity_type: string;
  entity_id?: string;
  amount?: number;
  metadata?: Record<string, unknown>;
};

export async function logEvent(
  event: FinancialEvent
) {
  const { error } = await supabase
    .from("financial_events")
    .insert({
      event_type: event.event_type,
      entity_type: event.entity_type,
      entity_id: event.entity_id,
      amount: event.amount,
      metadata: event.metadata ?? {},
    });

  if (error) {
    console.error(
      "Failed to log financial event",
      error
    );
  }
}