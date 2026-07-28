"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Plus, Bookmark, FolderOpen, Heart } from "lucide-react";
import Pagination, { getPageSlice } from "@/components/ui/Pagination";

const DEMO_SAVED = [
  {
    id: "demo-sv1",
    post_id: "demo-post-1",
    feed_posts: {
      caption: "Glass skin in 3 steps 🌟 Full routine breakdown — save this!",
      thumbnail_url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600",
    },
    reels: null,
  },
  {
    id: "demo-sv2",
    post_id: "demo-post-2",
    feed_posts: {
      caption: "6-week transformation done. No excuses, only results 💪",
      thumbnail_url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600",
    },
    reels: null,
  },
  {
    id: "demo-sv3",
    reel_id: "demo-reel-1",
    feed_posts: null,
    reels: {
      caption: "GRWM: Full glam in 10 minutes 💄",
      thumbnail_url: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600",
    },
  },
  {
    id: "demo-sv4",
    post_id: "demo-post-3",
    feed_posts: {
      caption: "New season Ankara is here 🔥 Shop the link in bio.",
      thumbnail_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
    },
    reels: null,
  },
  {
    id: "demo-sv5",
    post_id: "demo-post-4",
    feed_posts: {
      caption: "5 breathing exercises to reduce cortisol and improve focus 🧘",
      thumbnail_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600",
    },
    reels: null,
  },
  {
    id: "demo-sv6",
    reel_id: "demo-reel-2",
    feed_posts: null,
    reels: {
      caption: "Nairobi rooftop photoshoot BTS 📸",
      thumbnail_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
    },
  },
];

function savedItemHref(item: {
  id: string;
  post_id?: string;
  reel_id?: string;
  feed_posts?: { id?: string } | null;
  reels?: { id?: string } | null;
}): string {
  if (item.reels || item.reel_id) {
    return `/reels/${item.reel_id || item.reels?.id || item.id}`;
  }
  return `/feed/${item.post_id || item.feed_posts?.id || item.id}`;
}

export default function SavedPage() {
  const { userId, loading: authLoading } = useCurrentUser();
  const [saved, setSaved] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"saved" | "collections">("saved");
  const [dataLoading, setDataLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    if (!userId) return;
    setDataLoading(true);
    Promise.all([
      fetch(`/api/saved?user_id=${userId}`).then((r) => r.json()),
      fetch(`/api/collections?user_id=${userId}`).then((r) => r.json()),
    ])
      .then(([savedData, colData]) => {
        setSaved(Array.isArray(savedData) ? savedData : []);
        setCollections(Array.isArray(colData) ? colData : []);
      })
      .catch(() => {})
      .finally(() => setDataLoading(false));
  }, [userId]);

  const createCollection = async () => {
    if (!userId) return;
    const name = prompt("Collection name");
    if (!name) return;
    await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, name }),
    });
    const res = await fetch(`/api/collections?user_id=${userId}`);
    setCollections(await res.json());
  };

  // While auth is still loading, show skeleton
  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-4 animate-pulse">
        <div className="h-10 bg-white/5 rounded-2xl w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Not logged in → sign-in prompt
  if (!userId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-white">Saved</h1>
          <p className="text-white/40 text-sm mt-1">Moodboards, outfits, workouts & beauty</p>
        </header>

        <div className="text-center py-16 space-y-5">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <Bookmark className="w-8 h-8 text-white/30" />
          </div>
          <div className="space-y-2">
            <p className="text-white font-semibold text-lg">Save what inspires you</p>
            <p className="text-white/40 text-sm max-w-xs mx-auto">
              Sign in to bookmark posts, reels, and create collections
            </p>
          </div>
          <Link
            href="/login?returnUrl=/saved"
            className="inline-block bg-gradient-to-r from-amber-500/90 to-rose-500/90 text-black px-8 py-3 rounded-2xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-amber-900/20"
          >
            Sign In
          </Link>
          <p className="text-white/30 text-xs">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300">
              Sign up free
            </Link>
          </p>
        </div>

        {/* Preview of what saved looks like */}
        <div className="mt-8">
          <p className="text-xs text-white/20 text-center mb-4 uppercase tracking-widest">Preview</p>
          <div className="grid grid-cols-3 gap-2 opacity-40 pointer-events-none select-none">
            {DEMO_SAVED.slice(0, 6).map((s) => {
              const post = s.feed_posts || s.reels;
              if (!post) return null;
              return (
                <div key={s.id} className="relative aspect-square rounded-2xl overflow-hidden bg-[#111]">
                  <img
                    src={post.thumbnail_url}
                    className="w-full h-full object-cover"
                    alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <Heart className="absolute bottom-2 right-2 w-4 h-4 text-white/60" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const displaySaved = saved.length > 0 ? saved : DEMO_SAVED;
  const isDemo = saved.length === 0;
  const { slice: pagedSaved, totalPages, safePage } = getPageSlice(displaySaved, page, PAGE_SIZE);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white">Saved</h1>
        <p className="text-white/40 text-sm mt-1">Moodboards, outfits, workouts & beauty</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            activeTab === "saved" ? "bg-white text-black" : "bg-white/5 text-white/50 border border-white/8"
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Saved {displaySaved.length > 0 && `(${displaySaved.length})`}
        </button>
        <button
          onClick={() => setActiveTab("collections")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            activeTab === "collections" ? "bg-white text-black" : "bg-white/5 text-white/50 border border-white/8"
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Collections {collections.length > 0 && `(${collections.length})`}
        </button>
      </div>

      {activeTab === "saved" && (
        <>
          {isDemo && !dataLoading && (
            <p className="text-xs text-white/25 mb-4 text-center">
              Demo items — start saving posts from the feed to see your own saves here
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {pagedSaved.map((s) => {
              const post = s.feed_posts || s.reels;
              if (!post) return null;
              return (
                <Link
                  key={s.id}
                  href={savedItemHref(s)}
                  className="bg-[#0f0f0f] border border-white/8 rounded-2xl overflow-hidden group hover:border-white/15 transition-all block"
                >
                  {(post.thumbnail_url || post.video_url) && (
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={post.thumbnail_url || post.video_url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt=""
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  <p className="px-3 py-2 text-xs text-white/50 truncate">{post.caption || "Saved item"}</p>
                </Link>
              );
            })}
          </div>
          <Pagination page={safePage} totalPages={totalPages} onChange={setPage} className="mt-6" />
        </>
      )}

      {activeTab === "collections" && (
        <div className="grid grid-cols-2 gap-4">
          {collections.map((c) => (
            <Link key={c.id} href={`/collections/${c.id}`}>
              <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5 hover:bg-white/5 hover:border-white/15 transition-all group">
                <FolderOpen className="w-8 h-8 text-white/20 mb-3 group-hover:text-purple-400 transition-colors" />
                <span className="font-semibold text-white text-sm">{c.name}</span>
                {c.description && (
                  <p className="text-xs text-white/40 mt-1 line-clamp-2">{c.description}</p>
                )}
              </div>
            </Link>
          ))}
          <button
            onClick={createCollection}
            className="border border-dashed border-white/15 rounded-3xl p-5 flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/60 hover:border-white/30 transition-all"
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">New Collection</span>
          </button>
        </div>
      )}
    </div>
  );
}
