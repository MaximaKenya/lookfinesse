import { supabase } from "@/lib/supabaseClient";

export async function getOutfitRecommendations(
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

  if (!profile) {
    return [];
  }

  /*
    MATCH PRODUCTS
  */

  let query = supabase
    .from("products")
    .select("*")
    .eq("status", "active");

  if (
    profile.favorite_categories
      ?.length
  ) {
    query = query.in(
      "category_id",
      profile.favorite_categories
    );
  }

  const { data } = await query.limit(
    20
  );

  return data || [];
}