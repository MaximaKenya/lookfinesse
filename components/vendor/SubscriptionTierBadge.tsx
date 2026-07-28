"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { usePlatformSubscription } from "@/hooks/usePlatformSubscription";
import { getPlatformTier } from "@/lib/subscriptions/platformTiers";

export default function SubscriptionTierBadge({
  className = "",
}: {
  className?: string;
}) {
  const { tier, status, active, loading } = usePlatformSubscription();

  if (loading) {
    return (
      <span
        className={`inline-block h-6 w-16 rounded-full bg-white/5 animate-pulse ${className}`}
      />
    );
  }

  const label = active && tier ? getPlatformTier(tier)?.name ?? tier : "Free";
  const tone = active
    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
    : "border-white/10 bg-white/5 text-white/40";

  return (
    <Link
      href="/dashboard/subscription"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider hover:opacity-90 transition ${tone} ${className}`}
      title={active ? `Platform plan: ${label}` : `Status: ${status}`}
    >
      <Crown className="w-3 h-3" />
      {label}
    </Link>
  );
}
