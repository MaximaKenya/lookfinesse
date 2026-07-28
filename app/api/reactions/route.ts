import { NextResponse } from "next/server";
import { toggleReaction, getReactionSummaries } from "@/lib/social/engagement";
import type { ReactionType } from "@/lib/types/social";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("post_id") ?? undefined;
  const reelId = searchParams.get("reel_id") ?? undefined;
  const userId = searchParams.get("user_id") ?? undefined;

  if (!postId && !reelId) {
    return NextResponse.json({ error: "post_id or reel_id required" }, { status: 400 });
  }

  const summary = await getReactionSummaries({ postId, reelId, userId });
  const totalCount = summary.counts.reduce((sum, row) => sum + row.count, 0);

  return NextResponse.json({ ...summary, totalCount });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, post_id, reel_id, reaction_type } = body;

  if (!user_id || !reaction_type || (!post_id && !reel_id)) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const result = await toggleReaction({
    userId: user_id,
    postId: post_id,
    reelId: reel_id,
    reactionType: reaction_type as ReactionType,
  });

  const summary = await getReactionSummaries({
    postId: post_id,
    reelId: reel_id,
    userId: user_id,
  });
  const totalCount = summary.counts.reduce((sum, row) => sum + row.count, 0);

  return NextResponse.json({
    ...result,
    ...summary,
    totalCount,
    userReaction: summary.userReaction,
  });
}
