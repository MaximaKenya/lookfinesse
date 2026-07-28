import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/requireUser";
import { addComment, getComments, getCommentCount } from "@/lib/social/engagement";
import { queueSentimentAnalysis } from "@/lib/ai/sentimentAnalysis";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("post_id") ?? undefined;
  const reelId = searchParams.get("reel_id") ?? undefined;

  if (!postId && !reelId) {
    return NextResponse.json({ error: "post_id or reel_id required" }, { status: 400 });
  }

  try {
    const comments = await getComments(postId, reelId);
    const count = await getCommentCount(postId, reelId);
    return NextResponse.json({ comments, count });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load comments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { post_id, reel_id, content } = await req.json();
  if (!content?.trim()) {
    return NextResponse.json({ error: "Missing content" }, { status: 400 });
  }
  if (!post_id && !reel_id) {
    return NextResponse.json({ error: "post_id or reel_id required" }, { status: 400 });
  }

  try {
    const comment = await addComment({
      userId: auth.user.id,
      postId: post_id,
      reelId: reel_id,
      content: content.trim(),
    });

    queueSentimentAnalysis({
      sourceType: "comment",
      sourceId: comment.id,
      userId: auth.user.id,
      text: content,
    }).catch(() => {});

    return NextResponse.json(comment);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Comment failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
