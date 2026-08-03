"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { REACTION_EMOJI, type ReactionType } from "@/lib/types/social";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { Bookmark, MessageCircle, Share2, Heart, MoreHorizontal, Flag, Link2 } from "lucide-react";
import { toast } from "sonner";
import { whatsappShareUrl } from "@/lib/whatsapp/share";

type EngagementSeed = {
  reaction_counts?: Partial<Record<ReactionType, number>>;
  reaction_count?: number;
  comment_count?: number;
  user_reaction?: ReactionType | null;
};

type Props = {
  postId?: string;
  reelId?: string;
  shareUrl?: string;
  onCommentClick?: () => void;
  vertical?: boolean;
  showMore?: boolean;
  /** Bump to refetch comment count after a new comment is posted. */
  commentRefreshKey?: number;
  /**
   * When provided (e.g. from GET /api/feed batch), skip per-item GET
   * /api/reactions and /api/comments. Detail pages omit this to fetch live.
   */
  initialEngagement?: EngagementSeed | null;
};

export default function EngagementBar({
  postId,
  reelId,
  shareUrl,
  onCommentClick,
  vertical = false,
  showMore = true,
  commentRefreshKey = 0,
  initialEngagement = null,
}: Props) {
  const { userId } = useCurrentUser();
  const requireLogin = useRequireLogin();
  const router = useRouter();
  const hasSeed = initialEngagement != null;
  const [userReaction, setUserReaction] = useState<ReactionType | null>(
    initialEngagement?.user_reaction ?? null
  );
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [reactionCount, setReactionCount] = useState(initialEngagement?.reaction_count ?? 0);
  const [reactionCounts, setReactionCounts] = useState<Partial<Record<ReactionType, number>>>(
    initialEngagement?.reaction_counts ?? {}
  );
  const [commentCount, setCommentCount] = useState(initialEngagement?.comment_count ?? 0);
  const moreRef = useRef<HTMLDivElement>(null);

  const returnUrl =
    shareUrl ??
    (typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : reelId
        ? `/reels/${reelId}`
        : "/reels");

  useEffect(() => {
    if (hasSeed) return;
    const params = new URLSearchParams();
    if (postId) params.set("post_id", postId);
    else if (reelId) params.set("reel_id", reelId);
    if (userId) params.set("user_id", userId);

    fetch(`/api/reactions?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setUserReaction(data.userReaction ?? null);
        setReactionCount(data.totalCount ?? 0);
        const byType: Partial<Record<ReactionType, number>> = {};
        for (const row of data.counts ?? []) {
          byType[row.reaction_type as ReactionType] = row.count;
        }
        setReactionCounts(byType);
      })
      .catch(() => {});
  }, [postId, reelId, userId, hasSeed]);

  useEffect(() => {
    if (!postId && !reelId) return;
    // List view: seed covers initial count; only refetch when comments change.
    if (hasSeed && commentRefreshKey === 0) return;

    const params = new URLSearchParams();
    if (postId) params.set("post_id", postId);
    else if (reelId) params.set("reel_id", reelId);

    fetch(`/api/comments?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCommentCount(data.length);
          return;
        }
        setCommentCount(typeof data?.count === "number" ? data.count : data?.comments?.length ?? 0);
      })
      .catch(() => {});
  }, [postId, reelId, commentRefreshKey, hasSeed]);

  useEffect(() => {
    if (!userId || (!postId && !reelId)) return;
    const params = new URLSearchParams({ user_id: userId });
    if (reelId) params.set("reel_id", reelId);
    else if (postId) params.set("post_id", postId);

    fetch(`/api/saved?${params}`)
      .then((r) => r.json())
      .then((data) => setSaved(!!data.saved))
      .catch(() => {});
  }, [userId, postId, reelId]);

  useEffect(() => {
    if (!showMoreMenu) return;
    const close = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [showMoreMenu]);

  const react = async (type: ReactionType) => {
    if (!requireLogin(userId, returnUrl)) return;

    const prevReaction = userReaction;
    const prevCount = reactionCount;

    if (prevReaction === type) {
      setUserReaction(null);
      setReactionCount((c) => Math.max(0, c - 1));
    } else if (!prevReaction) {
      setUserReaction(type);
      setReactionCount((c) => c + 1);
    } else {
      setUserReaction(type);
    }
    setShowPicker(false);

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, post_id: postId, reel_id: reelId, reaction_type: type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUserReaction(data.userReaction ?? null);
      setReactionCount(data.totalCount ?? 0);
      const byType: Partial<Record<ReactionType, number>> = {};
      for (const row of data.counts ?? []) {
        byType[row.reaction_type as ReactionType] = row.count;
      }
      if (Object.keys(byType).length) setReactionCounts(byType);
    } catch {
      setUserReaction(prevReaction);
      setReactionCount(prevCount);
      toast.error("Could not update reaction");
    }
  };

  const save = async () => {
    if (!requireLogin(userId, returnUrl)) return;

    const prev = saved;
    setSaved(!prev);

    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, post_id: postId, reel_id: reelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(data.saved);
      toast.success(data.saved ? "Saved" : "Removed from saved");
    } catch {
      setSaved(prev);
      toast.error("Could not update saved");
    }
  };

  const share = async () => {
    const url = shareUrl ?? window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ url, title: "Check this out on LookFinesse" });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* user cancelled share sheet */
    }
  };

  const shareWhatsApp = () => {
    const url = shareUrl ?? window.location.href;
    const text = `Check this out on LookFinesse\n${url}`;
    window.open(whatsappShareUrl(text), "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    const url = shareUrl ?? window.location.href;
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
    setShowMoreMenu(false);
  };

  const report = async () => {
    if (!requireLogin(userId, returnUrl)) return;
    setShowMoreMenu(false);
    try {
      await fetch("/api/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          entity_type: reelId ? "reel" : "feed_post",
          entity_id: reelId ?? postId,
          event_type: "report",
        }),
      });
      toast.success("Report submitted. We'll review it shortly.");
    } catch {
      toast.error("Could not submit report");
    }
  };

  const openComments = () => {
    if (onCommentClick) {
      onCommentClick();
      return;
    }
    if (reelId) router.push(`/reels/${reelId}#comments`);
  };

  const hasReacted = userReaction !== null;
  const reactionEmoji = userReaction ? REACTION_EMOJI[userReaction] : null;

  const reactionButton = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className={vertical ? "flex flex-col items-center gap-1" : "flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"}
        aria-label="React"
      >
        <div
          className={
            vertical
              ? `w-11 h-11 rounded-full flex items-center justify-center ${hasReacted ? "bg-red-500/20" : "bg-white/10"} backdrop-blur-sm`
              : `${hasReacted ? "bg-red-500/15 text-red-400" : "text-white/60 hover:text-white hover:bg-white/5"} flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all`
          }
        >
          {reactionEmoji ? (
            <span className={vertical ? "text-xl" : "text-base"}>{reactionEmoji}</span>
          ) : (
            <Heart className={`w-5 h-5 ${hasReacted ? "fill-red-400 text-red-400" : vertical ? "text-white" : ""}`} />
          )}
          {!vertical && reactionCount > 0 && <span className="text-xs font-semibold">{reactionCount}</span>}
        </div>
        {vertical && reactionCount > 0 && (
          <span className="text-white text-xs font-semibold">{reactionCount}</span>
        )}
      </button>
      {showPicker && (
        <div
          className={`absolute ${vertical ? "bottom-full mb-2 right-0" : "bottom-full mb-2 left-0"} flex gap-1 bg-[#1a1a1a] border border-white/10 rounded-2xl p-2 z-20`}
        >
          {(Object.keys(REACTION_EMOJI) as ReactionType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => react(type)}
              className={`relative text-xl p-1.5 rounded-xl hover:bg-white/10 ${userReaction === type ? "ring-1 ring-white/30 bg-white/10" : ""}`}
            >
              {REACTION_EMOJI[type]}
              {(reactionCounts[type] ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-white/15 text-[9px] font-bold text-white/80 leading-[14px] text-center">
                  {reactionCounts[type]}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const commentButton = (
    <button type="button" onClick={openComments} className={vertical ? "flex flex-col items-center gap-1" : "flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"} aria-label="Comment">
      <div className={vertical ? "w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center" : ""}>
        <MessageCircle className="w-5 h-5 text-white" />
      </div>
      {commentCount > 0 && (
        <span className={`text-xs font-semibold ${vertical ? "text-white" : "text-white/70"}`}>{commentCount}</span>
      )}
    </button>
  );

  const shareButton = (
    <button type="button" onClick={share} className={vertical ? "flex flex-col items-center gap-1" : "flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"} aria-label="Share">
      <div className={vertical ? "w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center" : ""}>
        <Share2 className="w-5 h-5 text-white" />
      </div>
    </button>
  );

  const saveButton = (
    <button
      type="button"
      onClick={save}
      className={
        vertical
          ? "flex flex-col items-center gap-1"
          : `ml-auto px-3 py-2 rounded-xl transition-all ${saved ? "text-yellow-400 bg-yellow-500/10" : "text-white/60 hover:text-white hover:bg-white/5"}`
      }
      aria-label="Save"
    >
      <div className={`${vertical ? "w-11 h-11 rounded-full backdrop-blur-sm flex items-center justify-center" : ""} ${saved ? (vertical ? "bg-yellow-500/20" : "") : vertical ? "bg-white/10" : ""}`}>
        <Bookmark className={`w-5 h-5 ${saved ? "fill-yellow-400 text-yellow-400" : "text-white"}`} />
      </div>
    </button>
  );

  const moreButton = showMore ? (
    <div className="relative" ref={moreRef}>
      <button
        type="button"
        onClick={() => setShowMoreMenu(!showMoreMenu)}
        className={vertical ? "flex flex-col items-center gap-1" : "flex items-center gap-1.5 px-3 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all"}
        aria-label="More options"
      >
        <div className={vertical ? "w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center" : ""}>
          <MoreHorizontal className="w-5 h-5 text-white" />
        </div>
      </button>
      {showMoreMenu && (
        <div className={`absolute ${vertical ? "bottom-full mb-2 right-0" : "top-full mt-2 right-0"} min-w-[160px] bg-[#1a1a1a] border border-white/10 rounded-2xl py-1 z-20 shadow-xl`}>
          <button type="button" onClick={report} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5">
            <Flag className="w-4 h-4" /> Report
          </button>
          <button type="button" onClick={copyLink} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5">
            <Link2 className="w-4 h-4" /> Copy link
          </button>
          <button
            type="button"
            onClick={() => {
              shareWhatsApp();
              setShowMoreMenu(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#25D366] hover:bg-white/5"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
        </div>
      )}
    </div>
  ) : null;

  if (vertical) {
    return (
      <div className="flex flex-col items-center gap-5">
        {reactionButton}
        {commentButton}
        {shareButton}
        {saveButton}
        {moreButton}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {reactionButton}
      {commentButton}
      {shareButton}
      {saveButton}
      {moreButton}
    </div>
  );
}
