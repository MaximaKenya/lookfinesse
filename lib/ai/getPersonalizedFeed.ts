import { supabase } from "@/lib/supabaseClient";

export async function getPersonalizedFeed(
  userId: string
) {
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("preferences")
    .eq("user_id", userId)
    .maybeSingle();

  const prefs = (profile?.preferences ?? {}) as {
    interests?: string[];
    gender?: string;
    age_group?: string;
    budget?: string;
    style?: string;
  };

  const { data: interests } =
    await supabase
      .from("user_interests")
      .select("*")
      .eq("user_id", userId)
      .order("score", {
        ascending: false,
      });

  const categories = [
    ...(interests?.map((i) => i.category) || []),
    ...(prefs.interests ?? []),
  ];

  /*
    FETCH FEED POSTS
  */

  const { data: posts } =
    await supabase
      .from("feed_posts")
      .select(`
        *,
        products (
          id,
          category_id
        ),
        vendors (
          name,
          avatar_url
        )
      `)
      .order(
        "engagement_score",
        {
          ascending: false,
        }
      )
      .limit(100);

  /*
    AI RANKING
  */

  const ranked =
    posts?.map((post: any) => {
      let score =
        Number(
          post.engagement_score
        ) || 0;

      if (
        categories.includes(
          post.products
            ?.category_id
        )
      ) {
        score += 100;
      }

      const postType = String(post.type ?? "");
      if (prefs.interests?.includes("fitness") && ["workout", "transformation"].includes(postType)) {
        score += 40;
      }
      if (prefs.interests?.includes("beauty") && ["tutorial", "before_after"].includes(postType)) {
        score += 40;
      }
      if (prefs.interests?.includes("fashion") && ["style_drop", "product"].includes(postType)) {
        score += 40;
      }
      if (prefs.gender === "male" && postType === "workout") score += 10;
      if (prefs.gender === "female" && ["tutorial", "style_drop"].includes(postType)) score += 10;
      if (prefs.age_group === "18-24" && post.engagement_score > 50) score += 15;

      return {
        ...post,
        personalized_score: score,
      };
    }) || [];

  return ranked.sort(
    (a, b) =>
      b.personalized_score -
      a.personalized_score
  );
}