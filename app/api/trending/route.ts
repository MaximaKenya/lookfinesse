import { NextResponse } from "next/server";

import { getTrendingTopics, DEMO_PRODUCTS } from "@/lib/social/queries";

import { supabase } from "@/lib/supabaseClient";



const DEMO_TOPICS = [

  { id: "1", title: "Summer Style Drops", category: "fashion", score: 98 },

  { id: "2", title: "30-Day Shred Challenge", category: "fitness", score: 95 },

  { id: "3", title: "Glass Skin Routine", category: "beauty", score: 92 },

  { id: "4", title: "Nairobi Rooftop Looks", category: "fashion", score: 88 },

  { id: "5", title: "Home HIIT Workouts", category: "fitness", score: 85 },

  { id: "6", title: "Glow Up Sunday", category: "wellness", score: 82 },

];



const DEMO_REELS = [

  {

    id: "demo-r1",

    caption: "Ankara street style — full fit breakdown",

    video_url: null,

    engagement_score: 940,

    vendors: { name: "Nairobi Threads" },

  },

  {

    id: "demo-r2",

    caption: "10-min ab burner — no equipment",

    video_url: null,

    engagement_score: 880,

    vendors: { name: "EliteFit Gym" },

  },

  {

    id: "demo-r3",

    caption: "Glass skin routine for humid weather",

    video_url: null,

    engagement_score: 820,

    vendors: { name: "Glow Salon & Spa" },

  },

];



const DEMO_POSTS = [

  {

    id: "demo-p1",

    caption: "Desert gold blazer drop — limited run",

    thumbnail_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",

    type: "fashion",

    engagement_score: 910,

    vendors: { name: "Nairobi Threads" },

  },

  {

    id: "demo-p2",

    caption: "Morning yoga flow on the rooftop",

    thumbnail_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",

    type: "fitness",

    engagement_score: 870,

    vendors: { name: "Zen Wellness Studio" },

  },

];



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



  const resolvedTopics = topics.length ? topics : DEMO_TOPICS;

  const resolvedPosts = hotPosts.data?.length ? hotPosts.data : DEMO_POSTS;

  const resolvedReels = hotReels.data?.length ? hotReels.data : DEMO_REELS;

  const resolvedProducts = hotProductsDb.data?.length

    ? hotProductsDb.data

    : DEMO_PRODUCTS.slice(0, 8);



  return NextResponse.json({

    topics: resolvedTopics,

    hotPosts: resolvedPosts,

    hotReels: resolvedReels,

    hotProducts: resolvedProducts,

  });

}

