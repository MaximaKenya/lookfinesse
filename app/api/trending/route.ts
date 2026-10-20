import { NextResponse } from "next/server";

import { getTrendingTopics } from "@/lib/social/queries";

import { supabase } from "@/lib/supabaseClient";









export async function GET() {

  const [topics, hotPosts, hotReels, hotProductsDb] = await Promise.all([

    getTrendingTopics(),

    supabase

      .from("feed_posts")

      .select("id, caption, thumbnail_url, type, engagement_score, vendors(name)")

      .order("engagement_score", { ascending: false })

      .limit(10),

    supabase

      .from("reels")

      .select("id, caption, video_url, thumbnail_url, engagement_score, vendors(name)")

      .order("engagement_score", { ascending: false })

      .limit(10),

    supabase

      .from("products")

      .select("id, name, price, image_url, category")

      .eq("is_active", true)

      .order("created_at", { ascending: false })

      .limit(8),

  ]);



  const resolvedTopics = topics;

  const resolvedPosts = hotPosts.data ?? [];

  const resolvedReels = hotReels.data ?? [];

  const resolvedProducts = hotProductsDb.data ?? [];



  return NextResponse.json({

    topics: resolvedTopics,

    hotPosts: resolvedPosts,

    hotReels: resolvedReels,

    hotProducts: resolvedProducts,

  });

}

