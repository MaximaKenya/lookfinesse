"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { FolderOpen } from "lucide-react";
import Link from "next/link";

export default function CollectionPage() {
  const { id } = useParams<{ id: string }>();
  const { userId } = useCurrentUser();
  const [items, setItems] = useState<any[]>([]);
  const [collection, setCollection] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/saved?user_id=${userId}`)
      .then((r) => r.json())
      .then((saved) => setItems(saved.filter((s: any) => s.collection_id === id)));
    fetch(`/api/collections?user_id=${userId}`)
      .then((r) => r.json())
      .then((cols) => setCollection(cols.find((c: any) => c.id === id)));
  }, [userId, id]);

  return (
    <section className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <header className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/8 flex items-center justify-center shrink-0">
          <FolderOpen className="w-7 h-7 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">{collection?.name ?? "Collection"}</h1>
          {collection?.description && <p className="text-white/40 mt-1">{collection.description}</p>}
          <p className="text-sm text-white/25 mt-1">{items.length} items</p>
        </div>
      </header>

      {/* Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((s) => {
            const post = s.feed_posts || s.reels;
            return (
              <div key={s.id} className="bg-[#0f0f0f] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all group">
                {post?.thumbnail_url && (
                  <div className="relative aspect-square overflow-hidden">
                    <img
                      src={post.thumbnail_url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <p className="px-3 py-2 text-xs text-white/50 truncate">{post?.caption}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <FolderOpen className="w-12 h-12 text-white/15 mx-auto" />
          <p className="text-white/30 text-sm">This collection is empty</p>
          <Link href="/feed" className="inline-block bg-white text-black px-6 py-2.5 rounded-2xl font-semibold text-sm">
            Browse Feed
          </Link>
        </div>
      )}
    </section>
  );
}
