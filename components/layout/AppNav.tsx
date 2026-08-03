"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Clapperboard,
  Compass,
  Calendar,
  User,
  ShoppingBag,
  Radio,
  MapPin,
  TrendingUp,
  Trophy,
  Search,
  Bookmark,
  Bell,
  Sparkles,
  Shirt,
  Dumbbell,
  Flower2,
  ChevronRight,
  Menu,
  X,
  Store,
  Video,
  LayoutDashboard,
  Wallet,
  BrainCircuit,
  Megaphone,
  Lock,
  LogOut,
  Flame,
  Ruler,
} from "lucide-react";

import BrandLogo from "@/components/brand/BrandLogo";
import AuthHeaderActions from "@/components/layout/AuthHeaderActions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useUserRole } from "@/hooks/useUserRole";
import { usePlatformSubscription } from "@/hooks/usePlatformSubscription";
import { mapNavItemsWithLocks } from "@/lib/nav/filterNavByEntitlements";
import { vendorCanAccessPath } from "@/lib/subscriptions/platformTiers";
import { resolveDashboardNav } from "@/lib/nav/dashboardHome";
import { signOutAndRedirect } from "@/lib/logout";

const MOBILE_NAV_BASE = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/reels", label: "Reels", icon: Clapperboard },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/services", label: "Book", icon: Calendar },
  { href: "/profile", label: "Me", icon: User },
] as const;

const SIDEBAR_GROUPS = [
  {
    label: "Discover",
    items: [
      { href: "/feed", label: "Feed", icon: Home },
      { href: "/reels", label: "Reels", icon: Clapperboard },
      { href: "/for-you", label: "For You", icon: Sparkles },
      { href: "/explore", label: "Explore", icon: Compass },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/shop", label: "Shop", icon: ShoppingBag },
      { href: "/services", label: "Services", icon: Calendar },
      { href: "/live", label: "Live", icon: Radio },
      { href: "/drops", label: "Drops", icon: Flame },
    ],
  },
  {
    label: "Social",
    items: [
      { href: "/trending", label: "Trending", icon: TrendingUp },
      { href: "/challenges", label: "Challenges", icon: Trophy },
      { href: "/nearby", label: "Nearby", icon: MapPin },
      { href: "/search", label: "Search", icon: Search },
    ],
  },
  {
    label: "My Space",
    items: [
      { href: "/profile", label: "Profile", icon: User },
      { href: "/bookings", label: "Bookings", icon: Calendar },
      { href: "/saved", label: "Saved", icon: Bookmark },
      { href: "/notifications", label: "Notifications", icon: Bell },
      { href: "/fit-profile", label: "Fit Profile", icon: Ruler },
    ],
  },
  {
    label: "AI",
    items: [
      { href: "/ai/stylist", label: "AI Stylist", icon: Shirt },
      { href: "/ai/virtual-dresser", label: "Virtual Dresser", icon: Sparkles },
      { href: "/ai/fitness", label: "AI Fitness", icon: Dumbbell },
      { href: "/ai/beauty", label: "AI Beauty", icon: Flower2 },
    ],
  },
];

const ADMIN_SIDEBAR_GROUP = {
  label: "Admin",
  items: [
    { href: "/admin", label: "Mission Control", icon: LayoutDashboard },
    { href: "/finance", label: "Financial Control", icon: Wallet },
    { href: "/intelligence", label: "AI Intelligence", icon: BrainCircuit },
  ],
} as const;

export default function AppNav() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userId: authUserId } = useCurrentUser();
  const { isVendor, isAdmin, loading: roleLoading, userId: roleUserId } = useUserRole();
  const { active: subActive, tier: subTier, hasRow: subHasRow, isAdmin: subIsAdmin } =
    usePlatformSubscription();

  const loggedIn = !!(authUserId ?? roleUserId);
  const adminUnlocked = isAdmin || subIsAdmin;
  // Admin is treated as vendor for cockpit CTAs; isAdmin unlocks every entitlement gate
  const showVendorTools = !roleLoading && (isVendor || adminUnlocked);
  const dashboardNav = resolveDashboardNav({
    loggedIn,
    isAdmin: adminUnlocked,
    isVendor: isVendor || adminUnlocked,
    roleLoading,
  });

  const navCtx = {
    role: (adminUnlocked ? "admin" : isVendor ? "vendor" : "shopper") as
      | "admin"
      | "vendor"
      | "shopper",
    isAdmin: adminUnlocked,
    isVendor: isVendor || adminUnlocked,
    subscriptionActive: adminUnlocked ? true : subActive,
    subscriptionTier: adminUnlocked ? "elite" : subTier,
    hasSubscriptionRow: adminUnlocked ? true : subHasRow,
  };

  const vendorLinkAllowed = (href: string) => {
    if (adminUnlocked) return true;
    if (!isVendor) return true;
    return vendorCanAccessPath(href, subActive, subTier, {
      isAdmin: adminUnlocked,
      hasSubscriptionRow: subHasRow,
    });
  };

  const showCreatorStudio = vendorLinkAllowed("/dashboard/creator-studio");
  const showCommandCenter = vendorLinkAllowed("/vendor");
  const commandCenterHref = "/vendor";
  const creatorStudioHref = "/dashboard/creator-studio";

  const sidebarGroups = [
    ...SIDEBAR_GROUPS.map((group) => ({
      ...group,
      items:
        (isVendor || adminUnlocked) && group.label === "My Space"
          ? [
              ...group.items,
              { href: creatorStudioHref, label: "Creator Studio", icon: Video },
            ]
          : group.items,
    })),
    ...(adminUnlocked ? [ADMIN_SIDEBAR_GROUP] : []),
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-64 flex-col bg-black/95 backdrop-blur-xl border-r border-white/8">
        <div className="px-5 py-5 border-b border-white/8 flex flex-col gap-3">
          <BrandLogo href="/feed" size="md" className="max-w-[180px]" />
          <div className="flex justify-end">
            <AuthHeaderActions />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-hide">
          {sidebarGroups.map((group) => (
            <div key={group.label}>
              <p className="nav-sidebar-label px-3 mb-1.5">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {mapNavItemsWithLocks(group.items, navCtx).map(
                  ({ href, label, icon: Icon, locked, upgradeHref }) => {
                  const active = isActive(href);
                  const targetHref = locked ? upgradeHref : href;
                  return (
                    <li key={href}>
                      <Link
                        href={targetHref}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? "nav-sidebar-link-active"
                            : locked
                              ? "text-white/60 hover:text-amber-200 hover:bg-amber-500/5"
                              : "nav-sidebar-link hover:bg-white/5"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            active ? "text-purple-400" : locked ? "text-amber-400/70" : ""
                          }`}
                        />
                        {label}
                        {locked && (
                          <Lock className="w-3 h-3 ml-auto text-amber-400/80 shrink-0" />
                        )}
                        {active && !locked && (
                          <ChevronRight className="w-3 h-3 ml-auto text-white/30" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/8 space-y-2">
          {dashboardNav && (
            /* Dashboard CTA: href is /dashboard or /dashboard/admin — never /feed */
            <Link
              href={dashboardNav.href}
              data-testid="nav-dashboard-link"
              className="flex items-center gap-2.5 bg-gradient-to-r from-violet-600/35 to-fuchsia-600/25 hover:from-violet-600/45 hover:to-fuchsia-600/35 border border-violet-400/40 rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.15)] transition-all"
            >
              <LayoutDashboard className="w-5 h-5 shrink-0 text-violet-200" />
              {dashboardNav.label}
            </Link>
          )}
          {!roleLoading && showVendorTools && (
            <>
              {showCreatorStudio && (
              <Link
                href={creatorStudioHref}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/25 rounded-xl px-4 py-3 text-sm font-medium text-purple-200 hover:text-white transition-all"
              >
                <Video className="w-4 h-4" />
                Creator Studio
              </Link>
              )}
              {showCommandCenter && (
              <Link
                href={commandCenterHref}
                className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 rounded-xl px-4 py-3 text-sm font-medium text-cyan-100 hover:text-white transition-all"
              >
                <Store className="w-4 h-4" />
                Command Center
              </Link>
              )}
              {vendorLinkAllowed("/dashboard/ads") && (
              <Link
                href="/dashboard/ads"
                className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 rounded-xl px-4 py-3 text-sm font-medium text-amber-100 hover:text-white transition-all"
              >
                <Megaphone className="w-4 h-4" />
                Ads & Campaigns
              </Link>
              )}
              <Link
                href="/dashboard/subscription"
                className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 rounded-xl px-4 py-3 text-sm font-medium text-amber-100 hover:text-white transition-all"
              >
                Platform Plan
              </Link>
            </>
          )}
          {loggedIn && (
            <button
              type="button"
              onClick={() => void signOutAndRedirect("/login")}
              className="flex w-full items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200 hover:bg-rose-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-[60] bg-black/90 backdrop-blur-xl border-b border-white/8 safe-area-inset-top">
        <div className="flex items-center gap-2 px-3 h-14 min-w-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
            className="relative z-[62] shrink-0 p-2 -ml-1 rounded-xl text-white/80 hover:text-white hover:bg-white/10"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1 min-w-0 flex justify-center">
            <BrandLogo href="/feed" size="sm" />
          </div>

          <div className="flex items-center gap-1 shrink-0 relative z-[61]">
            <AuthHeaderActions />
            <Link
              href="/search"
              aria-label="Search"
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
            >
              <Search className="w-5 h-5" />
            </Link>
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full ring-2 ring-black" />
            </Link>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`md:hidden fixed top-0 right-0 bottom-0 z-[80] w-72 bg-[#0a0a0a] border-l border-white/8 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <span className="text-white font-bold">Menu</span>
          <button onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
        <nav className="overflow-y-auto h-full py-4 px-3 space-y-5 pb-20 scrollbar-hide">
          {sidebarGroups.map((group) => (
            <div key={group.label}>
              <p className="nav-sidebar-label px-3 mb-1.5">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {mapNavItemsWithLocks(group.items, navCtx).map(
                  ({ href, label, icon: Icon, locked, upgradeHref }) => {
                  const active = isActive(href);
                  const targetHref = locked ? upgradeHref : href;
                  return (
                    <li key={href}>
                      <Link
                        href={targetHref}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? "nav-sidebar-link-active"
                            : locked
                              ? "text-white/60 hover:text-amber-200"
                              : "nav-sidebar-link hover:bg-white/5"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${active ? "text-purple-400" : locked ? "text-amber-400/70" : ""}`}
                        />
                        {label}
                        {locked && <Lock className="w-3 h-3 ml-auto text-amber-400/80" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div className="px-3 pt-2 space-y-2">
            {dashboardNav && (
              /* Dashboard CTA: href is /dashboard or /dashboard/admin — never /feed */
              <Link
                href={dashboardNav.href}
                data-testid="nav-dashboard-link-mobile"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2.5 bg-gradient-to-r from-violet-600/35 to-fuchsia-600/25 border border-violet-400/40 rounded-xl px-4 py-3.5 text-sm font-semibold text-white"
              >
                <LayoutDashboard className="w-5 h-5 shrink-0 text-violet-200" />
                {dashboardNav.label}
              </Link>
            )}
            {!roleLoading && showVendorTools && (
              <>
                {showCreatorStudio && (
                <Link
                  href={creatorStudioHref}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/25 rounded-xl px-4 py-3 text-sm font-medium text-purple-200"
                >
                  <Video className="w-4 h-4" />
                  Creator Studio
                </Link>
                )}
              {showCommandCenter && (
              <Link
                href={commandCenterHref}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/25 rounded-xl px-4 py-3 text-sm font-medium text-cyan-100"
              >
                <Store className="w-4 h-4" />
                Command Center
              </Link>
              )}
              {vendorLinkAllowed("/dashboard/ads") && (
              <Link
                href="/dashboard/ads"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 text-sm font-medium text-amber-100"
              >
                <Megaphone className="w-4 h-4" />
                Ads & Campaigns
              </Link>
              )}
              <Link
                href="/dashboard/subscription"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 text-sm font-medium text-amber-100"
              >
                Platform Plan
              </Link>
              </>
            )}
            {loggedIn && (
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  void signOutAndRedirect("/login");
                }}
                className="flex w-full items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            )}
          </div>
        </nav>
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-black/95 backdrop-blur-xl border-t border-white/8">
        <div className="grid grid-cols-5 h-16 px-1">
          {MOBILE_NAV_BASE.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 transition-all ${
                  active ? "text-white" : "text-white/55"
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    active ? "bg-white/10" : ""
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-all ${active ? "scale-110" : ""}`}
                  />
                </div>
                <span
                  className={`text-[9px] font-semibold tracking-wide ${
                    active ? "text-purple-300" : ""
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
