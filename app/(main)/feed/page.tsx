"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import FeedCard from "@/components/feed/FeedCard";
import FeedTabs from "@/components/feed/FeedTabs";
import SearchInput from "@/components/ui/SearchInput";
import type { FeedCategory } from "@/lib/types/social";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Link from "next/link";
import { Radio, Sparkles, Shirt } from "lucide-react";
import Pagination, { getPageSlice } from "@/components/ui/Pagination";

const HeroAdCarousel = dynamic(() => import("@/components/ads/HeroAdCarousel"), { ssr: false });
const TodayLookFinesse = dynamic(() => import("@/components/feed/TodayLookFinesse"), { ssr: false });
const Stories = dynamic(() => import("@/components/feed/Stories"), { ssr: false });

export default function FeedPage() {
  const { userId } = useCurrentUser();
  const [tab, setTab] = useState<FeedCategory>("discover");
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const PAGE_SIZE = 10;

  useEffect(() => {
    setLoading(true);
    setPage(1);
    const params = new URLSearchParams({ type: tab });
    if (userId) params.set("user_id", userId);

    fetch(`/api/feed?${params}`)
      .then((r) => r.json())
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [tab, userId]);

  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      (p) =>
        (p.caption ?? "").toLowerCase().includes(q) ||
        (p.vendors?.name ?? "").toLowerCase().includes(q) ||
        (p.type ?? "").toLowerCase().includes(q)
    );
  }, [posts, search]);

  const { slice: pagedPosts, totalPages, safePage } = getPageSlice(
    filteredPosts,
    page,
    PAGE_SIZE
  );

  const onSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  return (
    <div className="feed-page mx-auto w-full max-w-xl md:max-w-2xl">
      <div className="feed-sticky-header sticky top-0 z-20 -mx-4 px-4 md:-mx-6 md:px-6 pt-4 pb-3 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Feed</h1>
            <p className="text-[11px] text-white/65 mt-0.5">Fashion · Beauty · Fitness</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/live"
              className="flex items-center gap-1 bg-red-500/15 border border-red-500/25 text-red-300 px-2.5 py-1.5 rounded-full text-[11px] font-semibold hover:bg-red-500/25 transition-all"
            >
              <Radio className="w-3 h-3" />
              Live
            </Link>
            <Link
              href="/for-you"
              className="flex items-center gap-1 bg-purple-500/15 border border-purple-500/25 text-purple-300 px-2.5 py-1.5 rounded-full text-[11px] font-semibold hover:bg-purple-500/25 transition-all"
            >
              <Sparkles className="w-3 h-3" />
              For You
            </Link>
          </div>
        </div>
        <SearchInput
          onChange={onSearch}
          placeholder="Search posts, creators…"
          debounceMs={150}
        />
      </div>

      <div className="feed-scroll-body px-4 md:px-6 pt-4 pb-8 space-y-5">
        <TodayLookFinesse />

        <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 to-pink-950/30 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Shirt className="w-5 h-5 text-purple-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Virtual Dresser</p>
              <p className="text-[11px] text-white/65 truncate">Try outfits on your AI avatar</p>
            </div>
          </div>
          <Link
            href="/ai/virtual-dresser"
            className="shrink-0 px-3 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90"
          >
            Try on
          </Link>
        </div>

        <HeroAdCarousel userId={userId} />
        <Stories />

        <div className="glass-feed-tabs rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1">
          <FeedTabs active={tab} onChange={setTab} />
        </div>

        {loading ? (
          <div className="space-y-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#0f0f0f]/90 rounded-3xl overflow-hidden border border-white/10 animate-pulse backdrop-blur-sm"
              >
                <div className="h-12 bg-white/5" />
                <div className="aspect-[4/5] bg-white/5" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-white/5 rounded-full w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 space-y-4 rounded-3xl border border-white/10 bg-white/[0.02]">
            <div className="text-5xl">✦</div>
            <p className="text-white/70 font-medium">
              {search ? "No posts match your search" : "Nothing here yet"}
            </p>
            <p className="text-sm text-white/55">
              {search ? "Try different keywords" : "Follow creators or try Discover"}
            </p>
            {!userId && !search ? (
              <Link
                href="/login?returnUrl=/feed"
                className="inline-block bg-gradient-to-r from-amber-500/90 to-rose-500/90 text-black px-6 py-2.5 rounded-2xl font-semibold text-sm hover:opacity-90 transition-all"
              >
                Sign in to personalize
              </Link>
            ) : (
              !search && (
                <Link
                  href="/explore"
                  className="inline-block bg-white text-black px-6 py-2.5 rounded-2xl font-semibold text-sm"
                >
                  Explore
                </Link>
              )
            )}
          </div>
        ) : (
          <>
            {pagedPosts.map((post) => (
              <div key={post.id} className="feed-post-card">
                <FeedCard post={post} />
              </div>
            ))}
            <Pagination page={safePage} totalPages={totalPages} onChange={setPage} className="pt-2" />
          </>
        )}
      </div>
    </div>
  );
}
