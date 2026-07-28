import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { queueSentimentAnalysis } from "@/lib/ai/sentimentAnalysis";

type SyncBody = {
  source_types?: ("feed_post" | "comment" | "review" | "booking_note")[];
  limit?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as SyncBody;
    const limit = Math.min(body.limit ?? 50, 200);
    const sourceTypes = body.source_types ?? ["feed_post", "comment"];
    let synced = 0;

    if (sourceTypes.includes("feed_post")) {
      const { data: posts } = await supabase
        .from("feed_posts")
        .select("id, vendor_id, caption")
        .not("caption", "is", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      for (const post of posts ?? []) {
        if (!post.caption?.trim()) continue;
        await queueSentimentAnalysis({
          sourceType: "feed_post",
          sourceId: post.id,
          userId: post.vendor_id,
          text: post.caption,
        });
        synced += 1;
      }
    }

    if (sourceTypes.includes("comment")) {
      const { data: comments } = await supabase
        .from("post_comments")
        .select("id, user_id, content")
        .not("content", "is", null)
        .order("created_at", { ascending: false })
        .limit(limit);

      for (const comment of comments ?? []) {
        if (!comment.content?.trim()) continue;
        await queueSentimentAnalysis({
          sourceType: "comment",
          sourceId: comment.id,
          userId: comment.user_id,
          text: comment.content,
        });
        synced += 1;
      }
    }

    return NextResponse.json({ success: true, synced });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 }
    );
  }
}
