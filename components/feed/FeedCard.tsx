"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import EngagementBar from "@/components/social/EngagementBar";
import FollowButton from "@/components/social/FollowButton";
import CommentDrawer from "@/components/social/CommentDrawer";
import { useCurrentUser, trackView } from "@/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, BadgeCheck, MoreHorizontal,
  Bookmark, Share2, Flag, Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

type Props = { post: any };

const TYPE_LABELS: Record<string, string> = {
  product: "Product Drop",
  transformation: "Transformation",
  tutorial: "Tutorial",
  workout: "Workout",
  style_drop: "Style Drop",
};

export default function FeedCard({ post }: Props) {
  const { userId } = useCurrentUser();
  const router = useRouter();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (post?.id) trackView(userId, "feed_post", post.id, post.type);
  }, [post?.id, userId, post?.type]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const thumb = post.thumbnail_url || post.media_urls?.[0] || "/placeholder.png";
  const typeLabel = TYPE_LABELS[post.type] || post.type?.replace("_", " ") || "New Drop";
  const detailHref = `/feed/${post.id}`;

  const handleSave = async () => {
    if (!userId) return toast.error("Sign in to save");
    const r = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, post_id: post.id }),
    });
    const d = await r.json();
    toast.success(d.saved ? "Saved ✓" : "Removed from saved");
    setMenuOpen(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/feed/${post.id}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ url, title: post.caption ?? "LookFinesse post" }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
    setMenuOpen(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/feed/${post.id}`);
    toast.success("Link copied");
    setMenuOpen(false);
  };

  const handleReport = () => {
    toast.success("Reported — thanks for keeping LookFinesse safe");
    setMenuOpen(false);
  };

  const openDetail = (e: React.MouseEvent) => {
    // Ignore clicks on interactive children
    const target = e.target as HTMLElement;
    if (target.closest("a,button,input,textarea,video")) return;
    router.push(detailHref);
  };

  return (
    <>
      <article
        onClick={openDetail}
        className="bg-[#0f0f0f] rounded-3xl overflow-hidden border border-white/8 hover:border-white/15 transition-all cursor-pointer"
      >
        {/* Author row */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <Link
            href={`/creator/${post.vendor_id || post.vendors?.id}`}
            className="flex items-center gap-3 group"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={post.vendors?.avatar_url || "/placeholder.png"}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-purple-500/50 transition-all"
                alt=""
              />
              {post.vendors?.verified && (
                <BadgeCheck className="absolute -bottom-0.5 -right-0.5 w-4 h-4 text-blue-400 fill-blue-400/20" />
              )}
            </div>
            <div>
              <div className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors">
                {post.vendors?.name || "Creator"}
              </div>
              <div className="text-[11px] text-white/60 capitalize mt-0.5">{typeLabel}</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {post.vendor_id && <FollowButton vendorId={post.vendor_id} />}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
                className="text-white/30 hover:text-white/70 p-1.5 rounded-lg hover:bg-white/5"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  <button onClick={(e) => { e.stopPropagation(); handleSave(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5">
                    <Bookmark className="w-4 h-4" /> Save
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleCopy(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5">
                    <LinkIcon className="w-4 h-4" /> Copy link
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleReport(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 border-t border-white/8">
                    <Flag className="w-4 h-4" /> Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Media */}
        <Link href={detailHref} onClick={(e) => e.stopPropagation()}>
          <div className="relative aspect-[4/5] bg-[#111] overflow-hidden">
            <Image src={thumb} alt="" fill className="object-cover hover:scale-[1.02] transition-transform duration-500" unoptimized />
            {post.type === "style_drop" && (
              <div className="absolute top-3 left-3 bg-purple-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                Style Drop
              </div>
            )}
            {post.type === "transformation" && (
              <div className="absolute top-3 left-3 bg-pink-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                Transformation
              </div>
            )}
          </div>
        </Link>

        {/* Engagement + caption */}
        <div className="px-4 py-3">
          <EngagementBar postId={post.id} onCommentClick={() => setCommentsOpen(true)} />

          {post.caption && (
            <p className="text-[13px] text-white/70 mt-3 leading-relaxed line-clamp-2">{post.caption}</p>
          )}

          {/* Product tag */}
          {post.products && (
            <Link
              href={`/product/${post.products.id}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-3.5 flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/8 rounded-2xl px-4 py-2.5 transition-all group"
            >
              <div>
                <div className="text-white font-semibold text-sm">{post.products.name}</div>
                <div className="text-[11px] text-white/40 mt-0.5">KES {post.products.price?.toLocaleString()}</div>
              </div>
              <div className="bg-white text-black rounded-xl p-1.5 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </Link>
          )}
        </div>
      </article>

      <CommentDrawer postId={post.id} open={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </>
  );
}
