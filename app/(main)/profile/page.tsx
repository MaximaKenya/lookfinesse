"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/lib/supabaseClient";
import {
  Flame, Calendar, Bookmark, Trophy, Shirt, Dumbbell, Flower2, Store,
  LogIn, BadgeCheck, Pencil, Settings, Wallet, ShoppingBag, BrainCircuit,
  ShieldAlert, Activity, ArrowUpRight, Sparkles, Coins, LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOutAndRedirect } from "@/lib/logout";
import { MediaViewer, type MediaValue } from "@/components/ui/MediaUploader";

export default function ProfilePage() {
  const { userId, loading } = useCurrentUser();
  const { isAdmin, isVendor } = useUserRole();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [gamification, setGamification] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
    if (userId) {
      fetch(`/api/profile?user_id=${userId}`).then((r) => r.json()).then(setProfile).catch(() => {});
      fetch(`/api/gamification?user_id=${userId}`).then((r) => r.json()).then(setGamification).catch(() => {});
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-white/5 rounded-3xl" />
          <div className="h-12 bg-white/5 rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || (email ? email.split("@")[0] : "Explorer");
  const initials = displayName.charAt(0).toUpperCase();

  const avatarMedia: MediaValue = {
    mode: (profile?.avatar_carousel?.length ? "carousel" : profile?.avatar_media_type === "video" ? "video" : "image") as MediaValue["mode"],
    url: profile?.avatar_url ?? "",
    items: Array.isArray(profile?.avatar_carousel) && profile.avatar_carousel.length > 0
      ? profile.avatar_carousel
      : profile?.avatar_url
      ? [{ url: profile.avatar_url, type: profile.avatar_media_type === "video" ? "video" : "image" }]
      : [],
  };
  const bannerMedia: MediaValue = {
    mode: (profile?.banner_carousel?.length ? "carousel" : profile?.banner_media_type === "video" ? "video" : "image") as MediaValue["mode"],
    url: profile?.banner_url ?? "",
    items: Array.isArray(profile?.banner_carousel) && profile.banner_carousel.length > 0
      ? profile.banner_carousel
      : profile?.banner_url
      ? [{ url: profile.banner_url, type: profile.banner_media_type === "video" ? "video" : "image" }]
      : [],
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      {/* Unified profile header — dark glass, mobile-safe */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl">
        {/* Banner */}
        <div className="relative h-36 sm:h-44 min-h-[9rem] bg-gradient-to-br from-purple-900/50 via-[#0f0f0f] to-pink-900/40">
          {bannerMedia.items.length > 0 ? (
            <MediaViewer value={bannerMedia} className="absolute inset-0 w-full h-full" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          {userId && (
            <Link
              href="/profile/edit"
              className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white text-xs font-medium px-3 py-2 rounded-xl border border-white/15 hover:bg-black/70"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </Link>
          )}
        </div>

        {/* Avatar + identity + stats */}
        <div className="relative px-5 pb-5 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-2 ring-purple-500/40 border-4 border-black shrink-0 shadow-xl">
              {avatarMedia.items.length > 0 ? (
                <MediaViewer value={avatarMedia} className="w-full h-full" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1 sm:pt-0 sm:pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate max-w-full">
                  {displayName}
                </h1>
                {userId && <BadgeCheck className="w-5 h-5 text-blue-400 shrink-0" />}
              </div>
              <p className="text-white/40 text-sm mt-0.5 truncate">{email || "Guest"}</p>
              {profile?.bio && (
                <p className="text-white/60 text-sm mt-2 leading-relaxed line-clamp-3">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-white/8">
            <div className="text-center flex-1">
              <div className="text-xl font-bold text-white">
                {gamification?.streak?.current_streak ?? 0}
              </div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider">streak</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center flex-1">
              <div className="text-xl font-bold text-white">
                {gamification?.achievements?.length ?? 0}
              </div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider">badges</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <Link
              href="/profile/edit"
              className="flex-1 text-center group"
            >
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/8 group-hover:bg-white/15 border border-white/10 mx-auto">
                <Settings className="w-4 h-4 text-white/50 group-hover:text-white" />
              </div>
              <div className="text-[10px] text-white/30 uppercase tracking-wider mt-1">settings</div>
            </Link>
          </div>
        </div>
      </div>

      {gamification?.streak && (
        <div className="bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/25 rounded-3xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <p className="text-3xl font-bold text-white">{gamification.streak.current_streak} days</p>
            <p className="text-xs text-white/40 mt-0.5">Longest: {gamification.streak.longest_streak} days</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-white/30 uppercase tracking-widest mb-3 px-1">My Space</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { href: "/bookings", label: "My Bookings", icon: Calendar, color: "text-cyan-400" },
            { href: "/saved", label: "Saved", icon: Bookmark, color: "text-yellow-400" },
            { href: "/challenges", label: "Challenges", icon: Trophy, color: "text-purple-400" },
            { href: "/dashboard", label: "Vendor Dashboard", icon: Store, color: "text-green-400" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-4 hover:bg-white/5 hover:border-white/15 transition-all flex items-center gap-3"
            >
              <link.icon className={`w-5 h-5 ${link.color} shrink-0`} />
              <span className="font-medium text-sm text-white/80">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {userId && isVendor && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold text-white/30 uppercase tracking-widest">
              Vendor Cockpit
            </h2>
            <Link href="/vendor" className="text-[11px] text-cyan-300 hover:underline inline-flex items-center gap-1">
              Open
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/vendor", label: "Overview", icon: Activity, color: "text-cyan-400", desc: "Command center" },
              { href: "/vendor/finance", label: "Finance", icon: Wallet, color: "text-green-400", desc: "Wallets & payouts" },
              { href: "/vendor/products", label: "Products", icon: ShoppingBag, color: "text-purple-400", desc: "Inventory & listings" },
              { href: "/vendor/intelligence", label: "AI Intel", icon: BrainCircuit, color: "text-fuchsia-400", desc: "Growth signals" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-[#0f0f0f] border border-white/8 rounded-2xl p-4 hover:bg-white/5 hover:border-white/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <link.icon className={`w-5 h-5 ${link.color} shrink-0`} />
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white" />
                </div>
                <div className="mt-3 font-semibold text-sm text-white">{link.label}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{link.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {userId && isAdmin && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-semibold text-white/30 uppercase tracking-widest">
              Admin Console
            </h2>
            <Link href="/admin" className="text-[11px] text-green-300 hover:underline inline-flex items-center gap-1">
              Mission control
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: "/admin/live", label: "Live Ops", icon: Activity, color: "text-purple-400", desc: "Realtime streams" },
              { href: "/finance", label: "Finance", icon: Coins, color: "text-green-400", desc: "Treasury & escrow" },
              { href: "/intelligence", label: "AI Intel", icon: Sparkles, color: "text-fuchsia-400", desc: "Marketplace signals" },
              { href: "/admin/compliance", label: "Compliance", icon: ShieldAlert, color: "text-orange-400", desc: "AML & sanctions" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-[#0f0f0f] border border-white/8 rounded-2xl p-4 hover:bg-white/5 hover:border-white/15 transition-all"
              >
                <div className="flex items-center justify-between">
                  <link.icon className={`w-5 h-5 ${link.color} shrink-0`} />
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/30 group-hover:text-white" />
                </div>
                <div className="mt-3 font-semibold text-sm text-white">{link.label}</div>
                <div className="text-[11px] text-white/40 mt-0.5">{link.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-white/30 uppercase tracking-widest mb-3 px-1">AI Tools</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/ai/stylist", label: "AI Stylist", icon: Shirt, color: "from-purple-500/20 to-pink-500/20 border-purple-500/20" },
            { href: "/ai/fitness", label: "AI Fitness", icon: Dumbbell, color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/20" },
            { href: "/ai/beauty", label: "AI Beauty", icon: Flower2, color: "from-pink-500/20 to-rose-500/20 border-pink-500/20" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`bg-gradient-to-br ${link.color} border rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform`}
            >
              <link.icon className="w-5 h-5 text-white/70" />
              <span className="text-xs font-semibold text-white/60 text-center">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {!userId && (
        <div className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-black/40 to-rose-500/10 backdrop-blur-xl p-6 text-center space-y-4">
          <Link
            href="/login?returnUrl=/profile"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/90 to-rose-500/90 text-black px-8 py-3.5 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-amber-900/30"
          >
            <LogIn className="w-5 h-5" />
            Sign In to unlock your profile
          </Link>
          <p className="text-white/40 text-sm">
            New here?{" "}
            <Link href="/register" className="text-amber-300 hover:text-amber-200 font-medium">
              Join LookFinesse free
            </Link>
          </p>
        </div>
      )}

      {userId && (
        <button
          type="button"
          onClick={() => signOutAndRedirect(router)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md py-3.5 text-sm font-semibold text-white/70 hover:text-rose-200 hover:border-rose-500/25 hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      )}
    </div>
  );
}
