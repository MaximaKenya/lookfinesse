import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabaseServer";

export async function buildAIContext(userId: string, client?: SupabaseClient) {
  let supabase = client;
  if (!supabase) {
    try {
      supabase = await createSupabaseServer();
    } catch {
      return { profile: null, interests: [], memory: [] };
    }
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: interests } = await supabase
    .from("user_interests")
    .select("*")
    .eq("user_id", userId)
    .order("score", { ascending: false })
    .limit(12);

  const { data: memory } = await supabase
    .from("ai_memory")
    .select("*")
    .eq("user_id", userId)
    .order("importance_score", { ascending: false })
    .limit(20);

  return {
    profile,
    interests: interests ?? [],
    memory: memory ?? [],
  };
}
