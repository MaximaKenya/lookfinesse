"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";
import EngagementBar from "@/components/social/EngagementBar";
import CommentDrawer from "@/components/social/CommentDrawer";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRequireLogin } from "@/hooks/useRequireLogin";

type Props = {
  reel: {
    id: string;
    video_url?: string;
    thumbnail_url?: string;
  };
};

export function ReelDetailVideo({ reel }: Props) {
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  const fallbackVideo =
    "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

  return (
    <div
      className="relative w-full max-w-sm mx-auto bg-black rounded-3xl overflow-hidden border border-white/8"
      style={{ aspectRatio: "9 / 16", maxHeight: "min(80vh, var(--reel-viewport-h, 80vh))" }}
    >
      <video
        ref={videoRef}
        src={reel.video_url || fallbackVideo}
        poster={reel.thumbnail_url || undefined}
        loop
        muted={muted}
        playsInline
        preload="metadata"
        className="absolute inset-0 z-0 w-full h-full object-cover bg-black"
      />
      <button
        type="button"
        onClick={() => {
          if (videoRef.current) {
            videoRef.current.muted = !muted;
            setMuted(!muted);
          }
        }}
        className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur-sm rounded-full p-2.5 text-white/80 hover:text-white"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function ReelDetailComments({ reelId }: { reelId: string }) {
  const { userId } = useCurrentUser();
  const requireLogin = useRequireLogin();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const [shareUrl, setShareUrl] = useState(`/reels/${reelId}`);
  const returnUrl = `/reels/${reelId}`;

  useEffect(() => {
    setShareUrl(`${window.location.origin}/reels/${reelId}`);
  }, [reelId]);

  useEffect(() => {
    fetch(`/api/comments?reel_id=${reelId}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.comments ?? [];
        setComments(Array.isArray(list) ? list : []);
      });
  }, [reelId, commentRefreshKey]);

  const submitComment = async () => {
    if (!requireLogin(userId, returnUrl)) return;
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, reel_id: reelId, content: text }),
      });
      const comment = await res.json();
      if (!res.ok) throw new Error(comment.error);
      setComments((prev) => [comment, ...prev]);
      setText("");
      setCommentRefreshKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <EngagementBar
        reelId={reelId}
        shareUrl={shareUrl}
        onCommentClick={() => setCommentsOpen(true)}
        commentRefreshKey={commentRefreshKey}
      />

      <section id="comments" className="space-y-4">
        <h2 className="text-lg font-bold text-white">
          Comments {comments.length > 0 && <span className="text-white/40 text-sm font-normal">({comments.length})</span>}
        </h2>

        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-xs font-bold text-white/50">
                {c.content?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-white/5 rounded-2xl px-4 py-3">
                <p className="text-sm text-white/80 leading-relaxed">{c.content}</p>
                <p className="text-[11px] text-white/30 mt-1.5">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString() : "Just now"}
                </p>
              </div>
            </div>
          ))}
          {!comments.length && <p className="text-white/30 text-sm">No comments yet. Start the conversation.</p>}
        </div>

        {userId ? (
          <div className="flex gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitComment()}
            />
            <button
              type="button"
              onClick={submitComment}
              disabled={!text.trim() || submitting}
              className="bg-white text-black px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
            >
              Post
            </button>
          </div>
        ) : (
          <Link
            href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`}
            className="block text-center text-sm text-white/60 hover:text-white py-3 rounded-2xl border border-white/10"
          >
            Sign in to comment
          </Link>
        )}
      </section>

      <CommentDrawer
        reelId={reelId}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        returnUrl={returnUrl}
        onCommentAdded={() => setCommentRefreshKey((k) => k + 1)}
      />
    </>
  );
}
