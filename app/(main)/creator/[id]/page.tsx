import Link from "next/link";
import FeedCard from "@/components/feed/FeedCard";
import FollowButton from "@/components/social/FollowButton";
import { getCreatorProfile, getServices } from "@/lib/social/queries";
import { BadgeCheck, MapPin, Star, Users, ShoppingBag, Award, Calendar } from "lucide-react";
import MembershipTiers from "@/components/social/MembershipTiers";
import { supabase } from "@/lib/supabaseClient";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, vendor, posts, followerCount, resolvedId } = await getCreatorProfile(id);

  // Fetch real membership tiers, subscriber count, and creator services in parallel.
  // Use Promise.allSettled so missing tables/columns don't blow up the whole page.
  const [tiersRes, subscribersRes, servicesAll] = await Promise.allSettled([
    supabase
      .from("membership_tiers")
      .select("id, name, price, perks")
      .eq("vendor_id", resolvedId)
      .order("price", { ascending: true }),
    supabase
      .from("memberships")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", resolvedId)
      .eq("status", "active"),
    getServices(),
  ]);
  const tiers = tiersRes.status === "fulfilled" ? tiersRes.value.data ?? [] : [];
  const subscriberCount =
    subscribersRes.status === "fulfilled" ? subscribersRes.value.count ?? 0 : 0;
  const allServices = servicesAll.status === "fulfilled" ? servicesAll.value : [];
  const creatorServices = allServices.filter((s: any) => s.vendor_id === resolvedId).slice(0, 3);

  if (!vendor) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="text-5xl">👤</div>
        <p className="text-white/40 font-medium">Creator not found</p>
        <Link href="/explore" className="inline-block bg-white text-black px-6 py-2.5 rounded-2xl font-semibold text-sm">
          Explore creators
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Cover + avatar */}
      <header className="relative">
        <div className="relative h-48 bg-gradient-to-br from-purple-900/40 via-[#0f0f0f] to-pink-900/30 overflow-hidden">
          {profile?.cover_image ? (
            <img src={profile.cover_image} alt="" className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-pink-900/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>

        <div className="px-4 -mt-14 relative z-10">
          <div className="flex items-end justify-between gap-4">
            <div className="relative">
              <img
                src={vendor.avatar_url || "/placeholder.png"}
                alt=""
                className="w-24 h-24 rounded-full border-4 border-black object-cover ring-2 ring-purple-500/30"
              />
              {profile?.verified && (
                <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-0.5">
                  <BadgeCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mb-3">
              <FollowButton vendorId={resolvedId} />
              <a
                href="#membership"
                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              >
                <Award className="w-3.5 h-3.5" />
                Subscribe
              </a>
            </div>
          </div>

          {/* Name + stats */}
          <div className="mt-3 space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                {vendor.name ?? vendor.business_name}
                {profile?.verified && <BadgeCheck className="w-5 h-5 text-blue-400" />}
              </h1>
              {vendor.location && (
                <p className="text-sm text-white/40 flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {vendor.location}
                </p>
              )}
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-5 flex-wrap">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{followerCount}</div>
                <div className="text-[11px] text-white/30">followers</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-xl font-bold text-white">{posts.length}</div>
                <div className="text-[11px] text-white/30">posts</div>
              </div>
              {(subscriberCount ?? 0) > 0 && (
                <>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-400 flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {subscriberCount}
                    </div>
                    <div className="text-[11px] text-white/30">members</div>
                  </div>
                </>
              )}
              {profile?.rating && (
                <>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-400 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      {profile.rating.toFixed(1)}
                    </div>
                    <div className="text-[11px] text-white/30">rating</div>
                  </div>
                </>
              )}
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-white/60 text-sm leading-relaxed">{profile.bio}</p>
            )}

            {/* Specialties */}
            {profile?.specialty && profile.specialty.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.specialty.map((s: string) => (
                  <span key={s} className="text-xs bg-white/8 border border-white/10 px-3 py-1 rounded-full text-white/60 capitalize">
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <Link
                href={
                  creatorServices[0]
                    ? `/services/${creatorServices[0].id}/book?creator=${resolvedId}`
                    : `/services?category=${profile?.specialty?.[0] ?? "fitness"}`
                }
                className="flex items-center gap-1.5 bg-white text-black px-5 py-2 rounded-xl font-semibold text-sm hover:bg-white/90 transition-all"
              >
                <Calendar className="w-4 h-4" />
                Book Session
              </Link>
              <Link
                href={`/shop?creator=${id}`}
                className="flex items-center gap-1.5 bg-white/8 border border-white/10 text-white/70 px-5 py-2 rounded-xl font-semibold text-sm hover:bg-white/12 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                Shop
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Services to book */}
      {creatorServices.length > 0 && (
        <section className="px-4 mt-8 space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" /> Book a session
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {creatorServices.map((s: any) => (
              <Link
                key={s.id}
                href={`/services/${s.id}/book?creator=${resolvedId}`}
                className="bg-[#0f0f0f] border border-white/8 rounded-2xl overflow-hidden hover:border-white/20 transition-all group"
              >
                {s.cover_image && (
                  <img src={s.cover_image} alt={s.title} className="w-full aspect-video object-cover group-hover:scale-[1.03] transition-transform" />
                )}
                <div className="p-3 space-y-1">
                  <p className="font-semibold text-white text-sm line-clamp-1">{s.title}</p>
                  <p className="text-xs text-white/40">KES {s.price?.toLocaleString()} · {s.duration_minutes ?? 60} min</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Three clear engagement options */}
      <section id="membership" className="px-4 mt-8 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-white/60" />
              <p className="font-semibold text-white text-sm">Follow</p>
              <span className="ml-auto text-[10px] uppercase tracking-wider bg-white/8 text-white/40 px-1.5 py-0.5 rounded-full">Free</span>
            </div>
            <p className="text-xs text-white/40">See posts in your feed and get notifications.</p>
            <FollowButton vendorId={resolvedId} />
          </div>
          <div className="bg-[#0f0f0f] border border-purple-500/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              <p className="font-semibold text-white text-sm">Subscribe</p>
              <span className="ml-auto text-[10px] uppercase tracking-wider bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-full">Paid</span>
            </div>
            <p className="text-xs text-white/40">Recurring membership. Pick a tier below.</p>
            <a href="#tiers" className="block text-center bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold py-1.5 rounded-xl">See tiers</a>
          </div>
          <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <p className="font-semibold text-white text-sm">Book a session</p>
              <span className="ml-auto text-[10px] uppercase tracking-wider bg-cyan-500/15 text-cyan-300 px-1.5 py-0.5 rounded-full">One-off</span>
            </div>
            <p className="text-xs text-white/40">Pay per service/appointment.</p>
            <Link
              href={creatorServices[0] ? `/services/${creatorServices[0].id}/book?from_creator=${resolvedId}` : "/services"}
              className="block text-center bg-white text-black text-xs font-semibold py-1.5 rounded-xl hover:bg-white/90"
            >
              {creatorServices[0] ? "Book a session" : "Browse services"}
            </Link>
          </div>
        </div>
      </section>

      {/* Membership tiers */}
      <section id="tiers" className="px-4 mt-6">
        <MembershipTiers vendorId={resolvedId} tiers={tiers ?? []} />
      </section>

      {/* Affiliate link */}
      <section className="px-4 mt-4">
        <div className="bg-[#0f0f0f] border border-white/8 rounded-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white/60">Earn with this creator</span>
          </div>
          <Link
            href={`/affiliate/${resolvedId}`}
            className="text-xs text-cyan-400 font-semibold hover:text-cyan-300"
          >
            Get affiliate link →
          </Link>
        </div>
      </section>

      {/* Posts */}
      <section className="px-4 mt-8 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Posts</h2>
          <span className="text-xs text-white/30">{posts.length} posts</span>
        </div>
        {posts.length === 0 ? (
          <p className="text-white/30 text-sm py-8 text-center">No posts yet</p>
        ) : (
          posts.map((post: any) => (
            <FeedCard key={post.id} post={{ ...post, vendors: vendor }} />
          ))
        )}
      </section>
    </div>
  );
}
