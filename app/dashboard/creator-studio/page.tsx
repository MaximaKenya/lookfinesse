"use client";

import Link from "next/link";
import {
  Clapperboard,
  ImagePlus,
  Package,
  Megaphone,
  Radio,
  UserCircle,
  BarChart3,
  Award,
  Sparkles,
  ArrowLeft,
  CalendarCheck,
  Crown,
} from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import { useUserRole } from "@/hooks/useUserRole";
import { usePlatformSubscription } from "@/hooks/usePlatformSubscription";
import { filterCreatorStudioTiles } from "@/lib/nav/filterNavByEntitlements";

const TILES = [
  {
    href: "/dashboard/create-reel",
    label: "Create Reel",
    desc: "Short-form video for the Reels feed",
    icon: Clapperboard,
    accent: "from-pink-600/20 to-rose-600/5 border-pink-500/20",
    iconColor: "text-pink-400",
  },
  {
    href: "/dashboard/create-post",
    label: "Create Feed Post",
    desc: "Photos, carousels & product drops",
    icon: ImagePlus,
    accent: "from-purple-600/20 to-violet-600/5 border-purple-500/20",
    iconColor: "text-purple-400",
  },
  {
    href: "/dashboard/create-product",
    label: "Create Product",
    desc: "List items in your shop",
    icon: Package,
    accent: "from-cyan-600/20 to-blue-600/5 border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    href: "/dashboard/create-service",
    label: "Create Service",
    desc: "Bookable sessions & availability slots",
    icon: CalendarCheck,
    accent: "from-teal-600/20 to-emerald-600/5 border-teal-500/20",
    iconColor: "text-teal-400",
  },
  {
    href: "/dashboard/ads",
    label: "Ads & Campaigns",
    desc: "Promoted posts & hero carousel ads",
    icon: Megaphone,
    accent: "from-amber-600/20 to-orange-600/5 border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    href: "/dashboard/create-live",
    label: "Go Live",
    desc: "Start or schedule a live session",
    icon: Radio,
    accent: "from-red-600/20 to-rose-600/5 border-red-500/20",
    iconColor: "text-red-400",
  },
  {
    href: "/profile/edit",
    label: "Edit Profile",
    desc: "Avatar, banner, bio & media carousel",
    icon: UserCircle,
    accent: "from-indigo-600/20 to-purple-600/5 border-indigo-500/20",
    iconColor: "text-indigo-400",
  },
  {
    href: "/vendor/intelligence",
    label: "Analytics",
    desc: "Growth signals, revenue & engagement",
    icon: BarChart3,
    accent: "from-emerald-600/20 to-green-600/5 border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    href: "/dashboard/subscription",
    label: "Platform Plan",
    desc: "Starter, Pro & Elite tiers",
    icon: Crown,
    accent: "from-amber-600/20 to-orange-600/5 border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    href: "/dashboard/vendor/profile",
    label: "Memberships",
    desc: "Tiers, subscribers & M-Pesa / Stripe",
    icon: Award,
    accent: "from-fuchsia-600/20 to-pink-600/5 border-fuchsia-500/20",
    iconColor: "text-fuchsia-400",
  },
];

export default function CreatorStudioPage() {
  const { isVendor, loading } = useUserRole();
  const { active, tier } = usePlatformSubscription();

  const tiles = filterCreatorStudioTiles(TILES, {
    subscriptionActive: active,
    subscriptionTier: tier,
  });

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[160px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-pink-600/8 blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-3">
            <BrandLogo href="/feed" size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h1 className="text-3xl font-bold tracking-tight">Creator Studio</h1>
              </div>
              <p className="text-white/40 text-sm mt-1">
                Create content, run campaigns, and grow your brand
              </p>
            </div>
          </div>
          <Link
            href={isVendor ? "/vendor" : "/dashboard"}
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white border border-white/10 rounded-xl px-4 py-2.5 hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            {isVendor ? "Vendor Dashboard" : "Dashboard"}
          </Link>
        </div>

        {!loading && !isVendor && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
            Become a vendor to unlock live commerce, ads, and membership tiers.{" "}
            <Link href="/dashboard/create-store" className="underline font-semibold text-amber-100">
              Create a store
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.href}
                href={tile.href}
                className={`group flex flex-col gap-3 p-5 rounded-3xl border bg-gradient-to-br backdrop-blur-xl transition-all hover:scale-[1.02] hover:border-white/25 ${tile.accent}`}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/40 border border-white/10">
                  <Icon className={`w-5 h-5 ${tile.iconColor}`} />
                </div>
                <div>
                  <h2 className="font-semibold text-white group-hover:text-purple-200 transition-colors">
                    {tile.label}
                  </h2>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">{tile.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Link
            href="/dashboard/vendor/profile"
            className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition-all"
          >
            <p className="text-sm font-semibold text-white">Vendor storefront profile</p>
            <p className="text-xs text-white/40 mt-1">Business name, cover, shop links & KYC</p>
          </Link>
          <Link
            href="/dashboard/subscription"
            className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 hover:bg-amber-500/10 transition-all"
          >
            <p className="text-sm font-semibold text-amber-100">Platform subscription</p>
            <p className="text-xs text-white/40 mt-1">Unlock ads, live commerce & AI intel</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
