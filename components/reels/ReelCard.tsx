"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import EngagementBar from "@/components/social/EngagementBar";
import CommentDrawer from "@/components/social/CommentDrawer";
import FollowButton from "@/components/social/FollowButton";
import { useCurrentUser, trackView } from "@/hooks/useCurrentUser";
import { ShoppingBag, BadgeCheck, Volume2, VolumeX, Calendar } from "lucide-react";

type Props = { reel: any };

const FALLBACK_VIDEO =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

export default function ReelCard({ reel }: Props) {
  const { userId } = useCurrentUser();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);
  const [muted, setMuted] = useState(true);
  const [inView, setInView] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const [shareUrl, setShareUrl] = useState(`/reels/${reel.id}`);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/reels/${reel.id}`);
  }, [reel.id]);

  const viewedRef = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    viewedRef.current = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.55;
        setInView(visible);
        if (visible && reel?.id && !viewedRef.current) {
          viewedRef.current = true;
          trackView(userId, "reel", reel.id, "reel");
        }
      },
      { threshold: [0.55, 0.75, 1] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reel?.id, userId]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [inView]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const vendorName = reel.vendors?.name || reel.vendors?.business_name || "Creator";
  const vendorId = reel.vendor_id || reel.vendors?.id;
  const poster =
    reel.thumbnail_url ||
    reel.poster_url ||
    reel.vendors?.avatar_url ||
    undefined;

  return (
    <>
      <div ref={rootRef} className="reel-slide">
        <div className="reel-frame">
          <video
            ref={videoRef}
            src={reel.video_url || FALLBACK_VIDEO}
            poster={poster}
            className="absolute inset-0 z-0 w-full h-full object-cover"
            loop
            muted={muted}
            playsInline
            preload="metadata"
          />

          <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/15 to-transparent pointer-events-none" />
          <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/45 via-transparent to-transparent pointer-events-none" />

          <Link
            href={`/reels/${reel.id}`}
            className="absolute inset-0 z-[2]"
            aria-label="Open reel"
          />

          <div className="absolute top-0 left-0 right-0 z-10 pt-3 pr-3 flex justify-end gap-2 pointer-events-none">
            <button
              type="button"
              onClick={toggleMute}
              className="pointer-events-auto bg-black/50 backdrop-blur-md rounded-full p-2.5 text-white/90 hover:text-white border border-white/10"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-12 z-10 p-4 pb-safe pointer-events-none">
            <div className="space-y-3 min-w-0 pointer-events-auto">
              <div className="flex items-center gap-2.5">
                <Link href={`/creator/${vendorId}`} className="flex items-center gap-2.5 group min-w-0">
                  <img
                    src={
                      reel.vendors?.avatar_url ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(vendorName)}`
                    }
                    alt=""
                    className="w-10 h-10 rounded-full border-2 border-white/30 object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-white text-sm flex items-center gap-1 group-hover:text-rose-200 transition-colors truncate drop-shadow-sm">
                      {vendorName}
                      {reel.vendors?.verified && (
                        <BadgeCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      )}
                    </div>
                  </div>
                </Link>
                {vendorId && (
                  <div className="ml-auto shrink-0">
                    <FollowButton vendorId={vendorId} />
                  </div>
                )}
              </div>

              {reel.caption && (
                <Link href={`/reels/${reel.id}`} className="block">
                  <p className="text-white/90 text-sm leading-relaxed line-clamp-2 drop-shadow-md">{reel.caption}</p>
                </Link>
              )}

              {reel.products && (
                <Link
                  href={`/product/${reel.products.id}`}
                  className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-lg border border-white/20 rounded-2xl px-4 py-2.5 hover:bg-black/55 transition-all max-w-full"
                >
                  <ShoppingBag className="w-4 h-4 text-rose-200 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{reel.products.name}</div>
                    <div className="text-white/70 text-xs">
                      KES {reel.products.price?.toLocaleString()} · Shop
                    </div>
                  </div>
                </Link>
              )}

              {reel.services && !reel.products && (
                <Link
                  href={`/services/${reel.services.id}`}
                  className="inline-flex items-center gap-3 bg-black/40 backdrop-blur-lg border border-white/20 rounded-2xl px-4 py-2.5 hover:bg-black/55 transition-all max-w-full"
                >
                  <Calendar className="w-4 h-4 text-rose-200 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{reel.services.title}</div>
                    <div className="text-white/70 text-xs">
                      KES {reel.services.price?.toLocaleString()} · Book
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 right-0 z-10 reel-actions-rail flex flex-col items-center gap-3 p-3 pb-safe pointer-events-auto">
            <EngagementBar
              reelId={reel.id}
              shareUrl={shareUrl}
              onCommentClick={() => setCommentsOpen(true)}
              commentRefreshKey={commentRefreshKey}
              vertical
              initialEngagement={
                reel.reaction_count != null || reel.comment_count != null
                  ? {
                      reaction_counts: reel.reaction_counts,
                      reaction_count: reel.reaction_count,
                      comment_count: reel.comment_count,
                      user_reaction: reel.user_reaction,
                    }
                  : null
              }
            />
          </div>
        </div>
      </div>

      <CommentDrawer
        reelId={reel.id}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        returnUrl={`/reels/${reel.id}`}
        onCommentAdded={() => setCommentRefreshKey((k) => k + 1)}
      />
    </>
  );
}
