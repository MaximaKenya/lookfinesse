import { getPersonalizedFeed }
  from "@/lib/ai/getPersonalizedFeed";

import { getRecommendedReels }
  from "@/lib/recommendation/getRecommendedReels";

import { getOutfitRecommendations }
  from "@/lib/ai/stylist/getOutfitRecommendations";

import { getWorkoutRecommendations }
  from "@/lib/ai/fitness/getWorkoutRecommendations";

import { getBeautyRecommendations }
  from "@/lib/ai/beauty/getBeautyRecommendations";

import { supabase }
  from "@/lib/supabaseClient";

export async function getForYouData(
  userId: string
) {
  const [
    feed,
    reels,
    outfits,
    workouts,
    beauty,
  ] = await Promise.all([
    getPersonalizedFeed(userId),

    getRecommendedReels(userId),

    getOutfitRecommendations(userId),

    getWorkoutRecommendations(userId),

    getBeautyRecommendations(userId),
  ]);

  /*
    LIVE SESSIONS
  */

  const { data: liveSessions } =
    await supabase
      .from("live_sessions")
      .select(`
        *,
        vendors (
          name,
          avatar_url
        )
      `)
      .gte(
        "scheduled_for",
        new Date().toISOString()
      )
      .order(
        "scheduled_for",
        {
          ascending: true,
        }
      )
      .limit(10);

  /*
    TRENDING SERVICES
  */

  const { data: services } =
    await supabase
      .from("services")
      .select("*")
      .eq("status", "active")
      .order(
        "bookings_count",
        {
          ascending: false,
        }
      )
      .limit(10);

  return {
    feed,

    reels,

    outfits,

    workouts,

    beauty,

    liveSessions:
      liveSessions || [],

    services:
      services || [],
  };
}