"use client";



import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import Image from "next/image";

import { TrendingUp, Zap, ChevronLeft, ChevronRight, Play, Flame, Sparkles } from "lucide-react";

import ScrollableFilterBar from "@/components/ui/ScrollableFilterBar";

import { CANONICAL_CATEGORIES } from "@/lib/categories/canonical";



const CATEGORIES = ["all", ...CANONICAL_CATEGORIES.slice(0, 6)] as const;



const CATEGORY_COLORS: Record<string, string> = {

  fitness: "text-cyan-400 bg-cyan-400/10",

  beauty: "text-pink-400 bg-pink-400/10",

  fashion: "text-purple-400 bg-purple-400/10",

  style: "text-purple-400 bg-purple-400/10",

  wellness: "text-green-400 bg-green-400/10",

  skincare: "text-rose-400 bg-rose-400/10",

};



const DEMO_REEL_VIDEOS = [

  "https://videos.pexels.com/video-files/6774633/6774633-hd_720_1366_30fps.mp4",

  "https://videos.pexels.com/video-files/6774106/6774106-hd_720_1366_30fps.mp4",

  "https://videos.pexels.com/video-files/6774852/6774852-hd_720_1366_30fps.mp4",

];



function Carousel({

  children,

  title,

  href,

  linkLabel,

}: {

  children: React.ReactNode;

  title: React.ReactNode;

  href?: string;

  linkLabel?: string;

}) {

  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {

    ref.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  };



  return (

    <section className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 md:p-6 shadow-2xl shadow-black/40">

      <div className="flex items-center justify-between mb-4">

        <h2 className="text-xl font-bold text-white flex items-center gap-2">{title}</h2>

        <div className="flex items-center gap-2">

          <button

            type="button"

            onClick={() => scroll(-1)}

            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"

            aria-label="Scroll left"

          >

            <ChevronLeft className="w-4 h-4" />

          </button>

          <button

            type="button"

            onClick={() => scroll(1)}

            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"

            aria-label="Scroll right"

          >

            <ChevronRight className="w-4 h-4" />

          </button>

          {href && (

            <Link href={href} className="text-xs text-white/60 hover:text-white ml-1">

              {linkLabel ?? "See all"} →

            </Link>

          )}

        </div>

      </div>

      <div ref={ref} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">

        {children}

      </div>

    </section>

  );

}



function ReelCard({ reel, index }: { reel: any; index: number }) {

  const videoUrl = reel.video_url || DEMO_REEL_VIDEOS[index % DEMO_REEL_VIDEOS.length];

  const [playing, setPlaying] = useState(false);



  return (

    <Link href="/reels" className="snap-start shrink-0 w-[160px] md:w-[180px] group">

      <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 bg-black/60">

        {playing ? (

          <video

            src={videoUrl}

            className="absolute inset-0 w-full h-full object-cover"

            autoPlay

            muted

            loop

            playsInline

          />

        ) : reel.thumbnail_url ? (

          <Image src={reel.thumbnail_url} alt="" fill className="object-cover" unoptimized />

        ) : (

          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-pink-900/30 to-orange-900/40" />

        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        <button

          type="button"

          onMouseEnter={() => setPlaying(true)}

          onMouseLeave={() => setPlaying(false)}

          onFocus={() => setPlaying(true)}

          onBlur={() => setPlaying(false)}

          className="absolute inset-0 flex items-center justify-center"

          aria-label="Preview reel"

        >

          {!playing && (

            <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">

              <Play className="w-4 h-4 text-white ml-0.5" fill="white" />

            </span>

          )}

        </button>

        <div className="absolute bottom-0 left-0 right-0 p-3">

          <p className="text-white text-xs font-semibold line-clamp-2">{reel.caption || "Trending reel"}</p>

          <p className="text-white/50 text-[10px] mt-0.5">{reel.vendors?.name}</p>

        </div>

        <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/90 text-black">

          Hot

        </span>

      </div>

    </Link>

  );

}



export default function TrendingPage() {

  const [data, setData] = useState<any>(null);

  const [catFilter, setCatFilter] = useState<string>("all");



  useEffect(() => {

    fetch("/api/trending")

      .then((r) => r.json())

      .then(setData)

      .catch(() => setData({ topics: [], hotPosts: [], hotReels: [], hotProducts: [] }));

  }, []);



  if (!data) {

    return (

      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-6">

        <div className="h-36 bg-white/5 rounded-3xl backdrop-blur-md" />

        <div className="h-48 bg-white/5 rounded-3xl" />

        <div className="h-48 bg-white/5 rounded-3xl" />

      </div>

    );

  }



  const filteredTopics =

    catFilter === "all"

      ? data.topics ?? []

      : (data.topics ?? []).filter((t: any) => t.category === catFilter);



  const hotProducts = data.hotProducts ?? [];



  return (

    <section className="max-w-5xl mx-auto px-4 py-8 space-y-8 pb-24">

      <header className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-950/40 via-black/80 to-rose-950/30 backdrop-blur-xl p-8 shadow-2xl">

        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.12),transparent_55%)]" />

        <div className="relative flex items-center gap-3 mb-2">

          <TrendingUp className="w-7 h-7 text-orange-400" />

          <span className="text-orange-400 text-sm font-bold uppercase tracking-wider">What&apos;s Hot</span>

          <Sparkles className="w-4 h-4 text-amber-300/80" />

        </div>

        <h1 className="relative text-3xl md:text-4xl font-black text-white">Trending Now</h1>

        <p className="relative text-white/60 mt-2 max-w-lg">

          Viral reels, creator drops & wellness moments — curated for Nairobi&apos;s lifestyle scene

        </p>

      </header>



      <ScrollableFilterBar>

        {CATEGORIES.map((c) => (

          <button

            key={c}

            type="button"

            onClick={() => setCatFilter(c)}

            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap snap-start shrink-0 capitalize transition-all backdrop-blur-md ${

              catFilter === c

                ? "bg-white text-black shadow-lg"

                : "bg-white/5 text-white/70 border border-white/10 hover:text-white hover:bg-white/10"

            }`}

          >

            {c === "all" ? "All topics" : c}

          </button>

        ))}

      </ScrollableFilterBar>



      {filteredTopics.length > 0 && (

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">

          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">

            <Zap className="w-5 h-5 text-yellow-400" />

            Hot Topics

          </h2>

          <div className="grid md:grid-cols-2 gap-3">

            {filteredTopics.map((t: any, idx: number) => (

              <Link key={t.id} href={`/feed?type=${t.category}`}>

                <div className="rounded-2xl border border-white/8 bg-black/40 backdrop-blur-md p-4 hover:border-orange-500/30 transition-all group">

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <div className="flex items-center gap-2 mb-1.5">

                        <span className="text-white/30 font-black text-lg">#{idx + 1}</span>

                        <span

                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${

                            CATEGORY_COLORS[t.category] ?? "text-white/60 bg-white/5"

                          }`}

                        >

                          {t.category}

                        </span>

                      </div>

                      <h3 className="font-bold text-white group-hover:text-orange-300 transition-colors">

                        {t.title}

                      </h3>

                    </div>

                    <span className="text-2xl font-black text-white/10">{Math.round(t.score)}</span>

                  </div>

                </div>

              </Link>

            ))}

          </div>

        </section>

      )}



      {data.hotReels?.length > 0 && (

        <Carousel title={<><Play className="w-5 h-5 text-pink-400 inline mr-2" />Trending Reels</>} href="/reels" linkLabel="All reels">

          {data.hotReels.map((r: any, i: number) => (

            <ReelCard key={r.id} reel={r} index={i} />

          ))}

        </Carousel>

      )}



      {data.hotPosts?.length > 0 && (

        <Carousel title={<><Flame className="w-5 h-5 text-orange-400 inline mr-2" />Trending Posts</>} href="/feed">

          {data.hotPosts.map((p: any) => (

            <Link

              key={p.id}

              href={p.id.startsWith("demo-") ? "/feed" : `/feed/${p.id}`}

              className="snap-start shrink-0 w-[240px] group"

            >

              <div className="rounded-2xl border border-white/10 bg-black/50 backdrop-blur-md overflow-hidden hover:border-white/25 transition-all">

                <div className="relative aspect-[4/3] bg-white/5">

                  {p.thumbnail_url ? (

                    <Image src={p.thumbnail_url} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />

                  ) : (

                    <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-fuchsia-900/30 flex items-center justify-center text-3xl">✦</div>

                  )}

                </div>

                <div className="p-3">

                  <p className="text-white/85 text-sm line-clamp-2">{p.caption || "Trending post"}</p>

                  <p className="text-white/45 text-xs mt-1">{p.vendors?.name}</p>

                </div>

              </div>

            </Link>

          ))}

        </Carousel>

      )}



      {hotProducts.length > 0 && (

        <Carousel title="🔥 Hot Products" href="/shop">

          {hotProducts.map((p: any) => (

            <Link key={p.id} href={`/shop/${p.id}`} className="snap-start shrink-0 w-[160px]">

              <div className="rounded-2xl border border-white/10 bg-black/50 overflow-hidden hover:border-emerald-500/30 transition-all">

                <div className="relative aspect-square">

                  {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />}

                </div>

                <div className="p-2.5">

                  <p className="text-xs font-semibold text-white line-clamp-1">{p.name}</p>

                  <p className="text-[10px] text-emerald-400/90">KES {p.price?.toLocaleString()}</p>

                </div>

              </div>

            </Link>

          ))}

        </Carousel>

      )}

    </section>

  );

}

