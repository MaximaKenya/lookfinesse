"use client";

import { useState } from "react";
import EngagementBar from "@/components/social/EngagementBar";
import CommentDrawer from "@/components/social/CommentDrawer";

export default function FeedPostComments({ postId }: { postId: string }) {
  const [commentsOpen, setCommentsOpen] = useState(false);

  return (
    <>
      <EngagementBar postId={postId} onCommentClick={() => setCommentsOpen(true)} />
      <CommentDrawer postId={postId} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </>
  );
}
