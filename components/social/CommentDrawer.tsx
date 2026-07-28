"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { X, Send } from "lucide-react";
import Link from "next/link";

type Props = {
  postId?: string;
  reelId?: string;
  open: boolean;
  onClose: () => void;
  returnUrl?: string;
  onCommentAdded?: () => void;
};

function parseCommentsPayload(data: unknown): { comments: any[]; count: number } {
  if (Array.isArray(data)) return { comments: data, count: data.length };
  if (data && typeof data === "object") {
    const payload = data as { comments?: unknown[]; count?: number };
    const comments = Array.isArray(payload.comments) ? payload.comments : [];
    return {
      comments,
      count: typeof payload.count === "number" ? payload.count : comments.length,
    };
  }
  return { comments: [], count: 0 };
}

export default function CommentDrawer({ postId, reelId, open, onClose, returnUrl, onCommentAdded }: Props) {
  const { userId } = useCurrentUser();
  const requireLogin = useRequireLogin();
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const authReturnUrl =
    returnUrl ??
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : reelId
        ? `/reels/${reelId}`
        : "/reels");

  useEffect(() => {
    if (!open) return;
    const params = postId ? `post_id=${postId}` : `reel_id=${reelId}`;
    fetch(`/api/comments?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const parsed = parseCommentsPayload(data);
        setComments(parsed.comments);
      });
  }, [open, postId, reelId]);

  const submit = async () => {
    if (!requireLogin(userId, authReturnUrl)) return;
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, post_id: postId, reel_id: reelId, content: text }),
      });
      const comment = await res.json();
      if (!res.ok) throw new Error(comment.error);
      setComments((prev) => [comment, ...prev]);
      setText("");
      onCommentAdded?.();
    } catch {
      /* toast handled by API errors in future */
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-[#0f0f0f] border border-white/10 rounded-t-3xl md:rounded-3xl max-h-[75vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h3 className="text-base font-bold text-white">
            Comments {comments.length > 0 && <span className="text-white/40 text-sm font-normal ml-1">{comments.length}</span>}
          </h3>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-hide">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-xs font-bold text-white/50">
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
          {!comments.length && (
            <div className="text-center py-10">
              <p className="text-white/30 text-sm">No comments yet</p>
              <p className="text-white/20 text-xs mt-1">Be the first to comment</p>
            </div>
          )}
        </div>

        <div className="px-4 py-4 border-t border-white/8 flex gap-3 items-center">
          {userId ? (
            <>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-colors"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
              />
              <button
                type="button"
                onClick={submit}
                disabled={!text.trim() || submitting}
                className="bg-white text-black w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-white/90 transition-all shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href={`/login?returnUrl=${encodeURIComponent(authReturnUrl)}`}
              className="flex-1 text-center text-sm text-white/60 hover:text-white py-2.5 rounded-2xl border border-white/10"
            >
              Sign in to comment
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
