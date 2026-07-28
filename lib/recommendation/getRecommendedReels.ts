import { supabase } from "@/lib/supabaseClient";

export async function getRecommendedReels(
  userId: string
) {
  const { data: interests } =
    await supabase
      .from("user_interests")
      .select("*")
      .eq("user_id", userId)
      .order("score", {
        ascending: false,
      });

  const categories =
    interests?.map(
      (i) => i.category
    ) || [];

  const { data } = await supabase
    .from("reels")
    .select(`
      *,
      products (
        category_id
      )
    `)
    .in(
      "products.category_id",
      categories
    )
    .order(
      "engagement_score",
      {
        ascending: false,
      }
    )
    .limit(50);

  return data || [];
}