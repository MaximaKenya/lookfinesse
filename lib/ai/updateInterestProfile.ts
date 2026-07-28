import { supabase } from "@/lib/supabaseClient";

type Params = {
  userId: string;

  category: string;

  weight: number;
};

export async function updateInterestProfile({
  userId,
  category,
  weight,
}: Params) {
  const { data: existing } =
    await supabase
      .from("user_interests")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .single();

  if (existing) {
    await supabase
      .from("user_interests")
      .update({
        score:
          Number(existing.score) +
          weight,

        updated_at: new Date(),
      })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("user_interests")
      .insert({
        user_id: userId,

        category,

        score: weight,
      });
  }
}