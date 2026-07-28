import { supabase } from "@/lib/supabaseClient";

export async function getBeautyRecommendations(
  userId: string
) {
  const { data: profile } =
    await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

  if (!profile) {
    return [];
  }

  const prefs =
    profile.beauty_preferences ||
    [];

  const { data } =
    await supabase
      .from("products")
      .select("*")
      .contains(
        "tags",
        prefs
      )
      .limit(20);

  return data || [];
}