import { supabase } from "@/lib/supabaseClient";

export async function saveConversation(data: {
  role: string;
  content: string;
}) {
  await supabase.from("copilot_messages").insert(data);
}