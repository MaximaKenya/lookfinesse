import { supabase } from "@/lib/supabaseClient";

type Params = {
  userId: string;

  entityType: string;

  entityId?: string;

  eventType: string;

  watchTime?: number;

  metadata?: any;
};

export async function trackBehavior({
  userId,
  entityType,
  entityId,
  eventType,
  watchTime,
  metadata,
}: Params) {
  await supabase
    .from("user_behavior_events")
    .insert({
      user_id: userId,

      entity_type: entityType,

      entity_id: entityId,

      event_type: eventType,

      watch_time: watchTime || 0,

      metadata,
    });
}