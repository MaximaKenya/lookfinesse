"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  Calendar,
  Clapperboard,
  CreditCard,
  Crown,
  Package,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

import SubscriptionTierBadge from "@/components/vendor/SubscriptionTierBadge";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePlatformSubscription } from "@/hooks/usePlatformSubscription";

interface VendorMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  walletBalance: number;
}

function KpiCard({
  label,
  value,
  href,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  href: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/8 bg-white/[0.03] p-5 hover:bg-white/[0.06] hover:border-white/15 transition-all"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/30">{label}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <ArrowUpRight className="h-3.5 w-3.5 text-white/20 group-hover:text-white/60 mt-3 transition" />
    </Link>
  );
}

const QUICK_ACTIONS = [
  {
    href: "/dashboard/creator-studio",
    label: "Creator Studio",
    icon: Clapperboard,
    desc: "Posts, reels & ads",
    accent: "text-pink-300",
  },
  {
    href: "/vendor/finance",
    label: "Finance",
    icon: Wallet,
    desc: "Wallets & payouts",
    accent: "text-green-300",
  },
  {
    href: "/vendor/products",
    label: "Products",
    icon: Package,
    desc: "Inventory studio",
    accent: "text-purple-300",
  },
  {
    href: "/dashboard/calendar",
    label: "Calendar",
    icon: Calendar,
    desc: "Bookings & slots",
    accent: "text-cyan-300",
  },
  {
    href: "/dashboard/subscription",
    label: "Platform Plan",
    icon: Crown,
    desc: "Starter, Pro, Elite",
    accent: "text-amber-300",
  },
  {
    href: "/vendor/intelligence",
    label: "AI Intel",
    icon: BrainCircuit,
    desc: "Growth signals",
    accent: "text-fuchsia-300",
  },
];

export default function VendorDashboard() {
  const { userId, loading: authLoading } = useCurrentUser();
  const { active: subActive, tier } = usePlatformSubscription();
  const [metrics, setMetrics] = useState<VendorMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      setLoading(false);
      return;
    }

    fetch("/api/vendor/dashboard", { credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.metrics) setMetrics(json.metrics);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId, authLoading]);

  const kpis = useMemo(
    () => [
      {
        label: "Wallet",
        value: `KES ${Number(metrics?.walletBalance ?? 0).toLocaleString()}`,
        href: "/vendor/finance",
        icon: Wallet,
        accent: "text-green-300",
      },
      {
        label: "Revenue",
        value: `KES ${Number(metrics?.monthlyRevenue ?? 0).toLocaleString()}`,
        href: "/vendor/finance",
        icon: TrendingUp,
        accent: "text-cyan-300",
      },
      {
        label: "Orders",
        value: String(metrics?.totalOrders ?? 0),
        href: "/vendor/orders",
        icon: ShoppingBag,
        accent: "text-purple-300",
      },
      {
        label: "Products",
        value: String(metrics?.activeProducts ?? 0),
        href: "/vendor/products",
        icon: Package,
        accent: "text-amber-300",
      },
    ],
    [metrics]
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-white/50">Sign in to access your vendor command center.</p>
        <Link
          href="/login?returnUrl=/dashboard/vendor"
          className="inline-block bg-white text-black px-6 py-3 rounded-2xl font-bold"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 pb-16">
      {/* Header with subscription badge */}
      <header className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-zinc-900/80 via-black to-cyan-950/30 p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300/80">
              <Activity className="w-3.5 h-3.5" />
              Vendor Command Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Your hub
            </h1>
            <p className="text-sm text-white/40 max-w-lg">
              KPIs, quick actions, subscription status, and links to finance, products, and Creator Studio.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <SubscriptionTierBadge />
            {!subActive && (
              <Link
                href="/dashboard/subscription"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-black text-xs font-bold px-3 py-1.5"
              >
                <Sparkles className="w-3 h-3" />
                Upgrade
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Subscription strip */}
      <Link
        href="/dashboard/subscription"
        className="flex items-center justify-between gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 hover:bg-amber-500/10 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/25 shrink-0">
            <Crown className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm">
              {subActive ? `${tier ?? "Active"} plan` : "Unlock platform features"}
            </p>
            <p className="text-xs text-white/40 truncate">
              {subActive
                ? "Ads, live commerce & advanced analytics included"
                : "Starter from KES 1,499/mo — ads, live & AI intel"}
            </p>
          </div>
        </div>
        <ArrowUpRight className="w-4 h-4 text-amber-300 shrink-0" />
      </Link>

      {/* KPIs from real API */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="text-sm font-semibold text-white/30 uppercase tracking-widest mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon, desc, accent }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-white/8 bg-[#0f0f0f] p-4 hover:border-white/15 hover:bg-white/[0.04] transition-all"
            >
              <Icon className={`w-5 h-5 ${accent} mb-3`} />
              <p className="font-semibold text-sm text-white">{label}</p>
              <p className="text-[11px] text-white/35 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Pending orders alert */}
      {(metrics?.pendingOrders ?? 0) > 0 && (
        <Link
          href="/vendor/orders"
          className="flex items-center justify-between rounded-2xl border border-yellow-500/25 bg-yellow-500/10 px-5 py-4"
        >
          <span className="text-sm text-yellow-200">
            {metrics?.pendingOrders} pending order
            {(metrics?.pendingOrders ?? 0) > 1 ? "s" : ""} need fulfillment
          </span>
          <ArrowUpRight className="w-4 h-4 text-yellow-300" />
        </Link>
      )}

      {/* Finance shortcut */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/dashboard/vendor/wallet"
          className="flex items-center gap-3 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 hover:bg-cyan-500/10 transition"
        >
          <CreditCard className="w-5 h-5 text-cyan-300" />
          <div>
            <p className="font-semibold text-white text-sm">Request payout</p>
            <p className="text-xs text-white/40">M-Pesa or bank transfer</p>
          </div>
        </Link>
        <Link
          href="/vendor"
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:bg-white/[0.06] transition"
        >
          <Activity className="w-5 h-5 text-white/60" />
          <div>
            <p className="font-semibold text-white text-sm">Full command center</p>
            <p className="text-xs text-white/40">Deep ops & intelligence</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
