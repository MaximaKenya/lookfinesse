import { supabase } from "@/lib/supabaseClient";

export async function getWorkoutRecommendations(
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

  const goal =
    profile.fitness_goal;

  let query = supabase
    .from("services")
    .select("*")
    .eq("status", "active");

  if (goal === "weight_loss") {
    query = query.in("category", [
      "personal_training",
      "virtual_workout",
      "group_class",
    ]);
  }

  if (goal === "muscle_gain") {
    query = query.in("category", [
      "personal_training",
      "group_class",
    ]);
  }

  const { data } =
    await query.limit(20);

  return data || [];
}