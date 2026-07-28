"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, Lock } from "lucide-react";
import { usePlatformSubscription } from "@/hooks/usePlatformSubscription";
import { useUserRole } from "@/hooks/useUserRole";
import {
  pathRequiresPlatformSub,
  pathRequiresProTier,
  pathRequiresEliteTier,
  vendorCanAccessPath,
} from "@/lib/subscriptions/platformTiers";

function pathInList(pathname: string, paths: readonly string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function gateMessage(
  pathname: string,
  tier: string | null,
  active: boolean,
  hasRow: boolean
): { title: string; body: string } {
  const needsElite = pathRequiresEliteTier(pathname);
  const needsPro = pathRequiresProTier(pathname);

  if (needsElite) {
    return {
      title: hasRow ? "Elite plan required" : "Unlock Elite features",
      body: hasRow
        ? "Unlock the full command center, AI intelligence, live commerce, staff management, and advanced payout settings with an active Elite vendor plan."
        : "Start with Starter basics for free, then upgrade to Elite for the command center, AI intelligence, live commerce, and advanced payout settings.",
    };
  }
  if (needsPro) {
    return {
      title: hasRow ? "Pro or Elite plan required" : "Upgrade to Pro",
      body: "Ads Manager, calendar ops, and vendor finance views require an active Pro or Elite vendor plan.",
    };
  }
  if (!active && hasRow) {
    return {
      title: "Renew your plan",
      body: `Your ${tier ?? "vendor"} plan is not active. Renew to restore full access to dashboard tools.`,
    };
  }
  return {
    title: "Upgrade your plan",
    body: `Your ${tier ?? "current"} plan does not include this feature. Upgrade to unlock it.`,
  };
}

export default function PlatformSubscriptionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const { isAdmin } = useUserRole();
  const { active, loading, tier, hasRow } = usePlatformSubscription();

  const gated = pathRequiresPlatformSub(pathname);
  const subscriptionPage = pathname.startsWith("/dashboard/subscription");
  const starterSurface = pathInList(pathname, [
    "/dashboard/creator-studio",
    "/dashboard/create-post",
    "/dashboard/create-reel",
    "/dashboard/create-product",
    "/dashboard/create-service",
    "/vendor/products",
    "/vendor/orders",
  ]) || pathname === "/dashboard";

  const allowed =
    isAdmin ||
    vendorCanAccessPath(pathname, active, tier, { isAdmin, hasSubscriptionRow: hasRow }) ||
    (!hasRow && starterSurface && !pathRequiresEliteTier(pathname) && !pathRequiresProTier(pathname));

  if (loading || !gated || allowed || subscriptionPage) {
    return <>{children}</>;
  }

  const { title, body } = gateMessage(pathname, tier, active, hasRow);

  return (
    <div className="relative min-h-[60vh]">
      <div className="pointer-events-none select-none opacity-30 blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
        <div className="max-w-md w-full rounded-3xl border border-amber-500/25 bg-gradient-to-br from-amber-950/40 via-black to-rose-950/30 p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
            <Lock className="w-7 h-7 text-amber-300" />
          </div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <p className="text-sm text-white/70 leading-relaxed">
            {body}
            {tier && !active && hasRow ? ` Your ${tier} plan is not active.` : ""}
          </p>
          <Link
            href="/dashboard/subscription"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-rose-500 text-black font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-all"
          >
            <Crown className="w-4 h-4" />
            View plans
          </Link>
        </div>
      </div>
    </div>
  );
}
