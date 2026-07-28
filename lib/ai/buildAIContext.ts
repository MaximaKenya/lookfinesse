import { supabase }
  from "@/lib/supabaseClient";

export async function buildAIContext(
  userId: string
) {
  /*
    USER PROFILE
  */

  const { data: profile } =
    await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

  /*
    INTERESTS
  */

  const { data: interests } =
    await supabase
      .from("user_interests")
      .select("*")
      .eq("user_id", userId)
      .order("score", {
        ascending: false,
      });

  /*
    MEMORY
  */

  const { data: memory } =
    await supabase
      .from("ai_memory")
      .select("*")
      .eq("user_id", userId)
      .order(
        "importance_score",
        {
          ascending: false,
        }
      )
      .limit(20);

  return {
    profile,

    interests,

    memory,
  };
}