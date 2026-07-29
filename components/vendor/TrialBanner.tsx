"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { usePlatformSubscription } from "@/hooks/usePlatformSubscription";
import { trialDaysRemaining } from "@/lib/subscriptions/ensureVendorTrial";

/**
 * Dashboard banner: "Free trial — X days left" with CTA to subscribe.
 */
export default function TrialBanner() {
  const { status, currentPeriodEnd, loading, isAdmin, active } =
    usePlatformSubscription();

  if (loading || isAdmin || status !== "trialing" || !active) return null;

  const days = trialDaysRemaining(status, currentPeriodEnd);
  if (days <= 0) return null;

  return (
    <div
      data-testid="trial-banner"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-950/40 via-black to-orange-950/30 px-4 py-3"
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10">
          <Sparkles className="h-4 w-4 text-amber-300" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-100">
            Free trial — {days} day{days === 1 ? "" : "s"} left
          </p>
          <p className="text-xs text-amber-200/60 mt-0.5">
            Full Pro access until your trial ends. Subscribe to keep ads, finance &amp; live tools.
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/subscription"
        className="shrink-0 inline-flex items-center justify-center rounded-xl bg-amber-400 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-300 transition"
      >
        Subscribe after trial
      </Link>
    </div>
  );
}
