import Link from "next/link";
import Image from "next/image";
import ExploreQuickLinks from "@/components/explore/ExploreQuickLinks";
import {
  getFeedPosts,
  getServices,
  getLiveSessions,
  getTrendingCreators,
  getChallenges,
  getCategories,
} from "@/lib/social/queries";

export default async function ExplorePage() {
  const [posts, services, live, creators, challenges, categories] =
    await Promise.all([
      getFeedPosts({ type: "discover", limit: 12 }),
      getServices(),
      getLiveSessions(false),
      getTrendingCreators(8),
      getChallenges(6),
      getCategories(12),
    ]);

  const liveNow = (live as any[]).filter((s) => s.is_live);

  return (
    <section className="max-w-6xl mx-auto px-4 py-6 space-y-10 pb-24">
      <header>
        <h1 className="text-3xl font-bold text-white">Explore</h1>
        <p className="text-white/40 text-sm mt-1">
          Discover fashion, beauty, fitness & wellness
        </p>
      </header>

      <ExploreQuickLinks />

      {/* Trending creators */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Trending Creators</h2>
          <Link href="/trending" className="text-xs text-white/40 hover:text-white">
            View all →
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {(creators as any[]).map((c) => {
            const v = c.vendors;
            const id = c.vendor_id ?? v?.id;
            return (
              <Link
                key={id}
                href={`/creator/${id}`}
                className="shrink-0 w-28 sm:w-32 group"
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#111] border border-white/8 group-hover:border-purple-500/30 transition-all">
                  {v?.avatar_url ? (
                    <Image
                      src={v.avatar_url}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-2xl">
                      ✨
                    </div>
                  )}
                  {c.verified && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-400 rounded-full ring-2 ring-black" />
                  )}
                </div>
                <p className="text-xs font-semibold text-white mt-2 truncate group-hover:text-purple-300">
                  {v?.business_name ?? v?.name ?? "Creator"}
                </p>
                <p className="text-[10px] text-white/35">
                  {(c.subscriber_count ?? 0).toLocaleString()} fans
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Categories grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Browse Categories</h2>
          <Link href="/shop" className="text-xs text-white/40 hover:text-white">
            Shop all →
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {(categories as any[]).map((cat) => (
            <Link
              key={cat.slug ?? cat.name}
              href={`/shop?category=${cat.slug ?? cat.name}`}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#0f0f0f] border border-white/8 hover:border-white/15 hover:bg-white/[0.04] transition-all text-center"
            >
              <span className="text-2xl">{cat.icon ?? "🏷️"}</span>
              <span className="text-[11px] font-medium text-white/70 line-clamp-2">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Live now */}
      {liveNow.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Now
            </h2>
            <Link href="/live" className="text-xs text-white/40 hover:text-white">
              View all →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {liveNow.slice(0, 4).map((s: any) => (
              <Link key={s.id} href={`/live/${s.id}`}>
                <div className="relative bg-[#0f0f0f] border border-red-500/20 rounded-3xl overflow-hidden hover:border-red-500/40 transition-all group">
                  {s.cover_url && (
                    <div className="relative aspect-video">
                      <Image
                        src={s.cover_url}
                        alt=""
                        fill
                        className="object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    </div>
                  )}
                  <div className={`p-4 ${s.cover_url ? "-mt-12 relative z-10" : ""}`}>
                    <span className="inline-flex items-center gap-1 bg-red-500/25 text-red-300 text-[10px] font-bold px-2.5 py-1 rounded-full mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      LIVE
                    </span>
                    <p className="font-semibold text-white">{s.title}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {s.vendors?.business_name ?? s.vendors?.name}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured services */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Featured Services</h2>
          <Link href="/services" className="text-xs text-white/40 hover:text-white">
            View all →
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {services.slice(0, 6).map((s: any) => (
            <Link key={s.id} href={`/services/${s.id}`}>
              <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl overflow-hidden hover:border-white/15 transition-all group">
                {s.cover_image && (
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={s.cover_image}
                      alt=""
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-white text-sm leading-snug group-hover:text-purple-300">
                      {s.title}
                    </p>
                    <span className="text-white/50 font-bold text-xs shrink-0">
                      KES {s.price?.toLocaleString()}
                    </span>
                  </div>
                  {s.short_description && (
                    <p className="text-xs text-white/40 mt-2 line-clamp-2">
                      {s.short_description}
                    </p>
                  )}
                  <span className="inline-block mt-3 text-[10px] text-white/30 capitalize bg-white/5 px-2 py-1 rounded-full">
                    {s.category}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Challenges strip */}
      {(challenges as any[]).length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Active Challenges</h2>
            <Link href="/challenges" className="text-xs text-white/40 hover:text-white">
              Join →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {(challenges as any[]).map((ch) => (
              <Link
                key={ch.id}
                href={`/challenges/${ch.id}`}
                className="shrink-0 w-64 group"
              >
                <div className="relative h-36 rounded-2xl overflow-hidden border border-white/8 group-hover:border-amber-500/30 transition-all">
                  {ch.cover_url && (
                    <Image
                      src={ch.cover_url}
                      alt=""
                      fill
                      className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                      unoptimized
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300/80">
                      {ch.category}
                    </span>
                    <p className="font-bold text-white text-sm mt-0.5 line-clamp-2">
                      {ch.title}
                    </p>
                    <p className="text-[10px] text-white/40 mt-1">
                      {(ch.participant_count ?? 0).toLocaleString()} joined
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest drops */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Latest Drops</h2>
          <Link href="/feed" className="text-xs text-white/40 hover:text-white">
            View feed →
          </Link>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {(posts as any[]).slice(0, 8).map((post: any) => (
            <Link key={post.id} href={`/creator/${post.vendor_id}`}>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#111] group">
                {(post.thumbnail_url || post.media_urls?.[0]) && (
                  <Image
                    src={post.thumbnail_url || post.media_urls[0]}
                    alt=""
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  );
}
