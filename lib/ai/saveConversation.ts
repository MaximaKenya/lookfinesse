import type { SupabaseClient } from "@supabase/supabase-js";

export async function saveConversation(
  supabase: SupabaseClient,
  data: {
    userId: string;
    role: string;
    content: string;
    metadata?: Record<string, unknown>;
  }
) {
  await supabase.from("copilot_messages").insert({
    user_id: data.userId,
    role: data.role,
    content: data.content,
    metadata: data.metadata ?? {},
  });
}
