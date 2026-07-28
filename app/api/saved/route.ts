import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { toggleSave, getSavedPosts } from "@/lib/social/engagement";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");
  const reelId = searchParams.get("reel_id");
  const postId = searchParams.get("post_id");

  if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

  if (reelId || postId) {
    const supabase = await createSupabaseServer();
    let query = supabase.from("saved_posts").select("id").eq("user_id", userId);
    if (reelId) query = query.eq("reel_id", reelId);
    else if (postId) query = query.eq("post_id", postId);
    const { data } = await query.maybeSingle();
    return NextResponse.json({ saved: !!data });
  }

  const saved = await getSavedPosts(userId);
  return NextResponse.json(saved);
}

export async function POST(req: Request) {
  const { user_id, post_id, reel_id, collection_id } = await req.json();
  if (!user_id || (!post_id && !reel_id)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  const result = await toggleSave({ userId: user_id, postId: post_id, reelId: reel_id, collectionId: collection_id });
  return NextResponse.json(result);
}
