import { getForYouData } from "@/lib/ai/getForYouData";
import FeedCard from "@/components/feed/FeedCard";
import ServiceCard from "@/components/services/ServiceCard";
import Link from "next/link";
import { Sparkles, Shirt, Dumbbell, Flower2, ChevronRight, MapPin } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabaseServer";

export default async function ForYouPage() {
  let userId = "anonymous";
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id) userId = user.id;
  } catch {
    /* demo / unconfigured */
  }

  const data = await getForYouData(userId);

  return (
    <div className="min-h-screen bg-black text-white pb-10">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-pink-900/20" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full" />
        <div className="relative px-6 pt-8 pb-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">AI Curated</span>
          </div>
          <h1 className="text-4xl font-bold text-white">For You</h1>
          <p className="text-white/40 mt-1.5">
            {userId === "anonymous"
              ? "Sign in to personalize this hub"
              : "Your personalised lifestyle hub"}
          </p>
        </div>
      </div>

      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/ai/stylist", label: "AI Stylist", icon: Shirt, color: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/20" },
            { href: "/ai/fitness", label: "Gym Buddy", icon: Dumbbell, color: "from-cyan-500/20 to-blue-500/20", border: "border-cyan-500/20" },
            { href: "/ai/beauty", label: "AI Beauty", icon: Flower2, color: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/20" },
            { href: "/nearby", label: "Near me", icon: MapPin, color: "from-cyan-500/15 to-emerald-500/15", border: "border-cyan-500/20" },
          ].map(({ href, label, icon: Icon, color, border }) => (
            <Link key={href} href={href} className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform`}>
              <Icon className="w-5 h-5 text-white/70" />
              <span className="text-xs font-semibold text-white/70">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {data.reels?.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between px-6 mb-4">
            <h2 className="text-xl font-bold text-white">Reels For You</h2>
            <Link href="/reels" className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-hide">
            {data.reels.slice(0, 6).map((reel: any) => (
              <div key={reel.id} className="min-w-[160px] max-w-[160px] aspect-[9/16] rounded-2xl overflow-hidden bg-[#111] shrink-0 relative">
                {reel.video_url && (
                  <video src={reel.video_url} className="absolute inset-0 w-full h-full object-cover" muted playsInline />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <p className="text-white text-xs font-medium line-clamp-2">{reel.caption || reel.vendors?.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.outfits?.length > 0 && (
        <section className="mb-10 px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Outfit Picks</h2>
            <Link href="/shop" className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
              Shop all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.outfits.slice(0, 8).map((item: any) => (
              <FeedCard
                key={item.id}
                post={{
                  id: item.id,
                  vendor_id: item.vendor_id,
                  thumbnail_url: item.image_url,
                  caption: item.name,
                  products: item,
                  vendors: { name: "Style Pick", avatar_url: item.image_url },
                }}
              />
            ))}
          </div>
        </section>
      )}

      {data.workouts?.length > 0 && (
        <section className="mb-10 px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Workout Plans</h2>
            <Link href="/ai/fitness" className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
              Gym Buddy <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {data.workouts.slice(0, 6).map((service: any) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      )}

      {data.beauty?.length > 0 && (
        <section className="mb-10 px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Beauty Picks</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.beauty.slice(0, 8).map((item: any) => (
              <FeedCard
                key={item.id}
                post={{
                  id: item.id,
                  thumbnail_url: item.image_url,
                  caption: item.name,
                  products: item,
                  vendors: { name: "Beauty AI" },
                }}
              />
            ))}
          </div>
        </section>
      )}

      {data.liveSessions?.length > 0 && (
        <section className="mb-10 px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Live Classes
            </h2>
            <Link href="/live" className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {data.liveSessions.map((session: any) => (
              <Link key={session.id} href={`/live/${session.id}`}>
                <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5 hover:border-white/15 transition-all">
                  <span className="text-[10px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">LIVE</span>
                  <h3 className="font-bold text-white mt-2">{session.title}</h3>
                  <p className="text-sm text-white/40 mt-1">{session.vendors?.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data.services?.length > 0 && (
        <section className="px-6 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Trending Experiences</h2>
            <Link href="/nearby" className="text-xs text-white/40 hover:text-white flex items-center gap-1 transition-colors">
              Near me <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {data.services.map((service: any) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
