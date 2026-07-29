"use client";

import { useEffect, useState } from "react";
import type { PlatformEntitlements } from "@/lib/subscriptions/platformEntitlements";
import { getPlatformEntitlements } from "@/lib/subscriptions/platformEntitlements";
import { useUserRole } from "@/hooks/useUserRole";

type SubState = {
  active: boolean;
  tier: string | null;
  status: string;
  loading: boolean;
  entitlements: PlatformEntitlements;
  adCreditsRemaining: number;
  hasRow: boolean;
  isAdmin: boolean;
  currentPeriodEnd: string | null;
};

const DEFAULT_STATE: SubState = {
  active: false,
  tier: null,
  status: "none",
  loading: true,
  entitlements: getPlatformEntitlements("starter"),
  adCreditsRemaining: 0,
  hasRow: false,
  isAdmin: false,
  currentPeriodEnd: null,
};

/** Platform admins are treated as active Elite — skip subscription checks. */
const ADMIN_ELITE_STATE: SubState = {
  active: true,
  tier: "elite",
  status: "active",
  loading: false,
  entitlements: getPlatformEntitlements("elite"),
  adCreditsRemaining: 999_999,
  hasRow: true,
  isAdmin: true,
  currentPeriodEnd: null,
};

/**
 * Subscription entitlements for the signed-in user.
 * Admins resolve to Elite immediately (before any gate can render locks/overlays).
 * While role is still loading, `loading` stays true so gates wait.
 */
export function usePlatformSubscription(): SubState {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [state, setState] = useState<SubState>(DEFAULT_STATE);

  useEffect(() => {
    if (isAdmin || roleLoading) return;

    let cancelled = false;

    fetch("/api/platform-subscriptions")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (cancelled) return;

        if (!r.ok && d?.code === "SUPABASE_UNREACHABLE") {
          setState({ ...DEFAULT_STATE, loading: false, status: "unavailable" });
          return;
        }

        // API may also flag admin (email / user_roles) even if client role lagged
        if (d?.isAdmin) {
          setState(ADMIN_ELITE_STATE);
          return;
        }

        const tier = d.tier ?? null;
        const status = d.status ?? "none";
        const periodEnd =
          d.current_period_end ?? d.trial_ends_at ?? null;
        const periodOk =
          !periodEnd || new Date(String(periodEnd)) > new Date();
        // trialing Pro unlocks all Pro modules (same as paid active)
        const active =
          !!d.active ||
          (status === "trialing" && periodOk);

        setState({
          active,
          tier,
          status,
          loading: false,
          entitlements: d.entitlements ?? getPlatformEntitlements(tier ?? "starter"),
          adCreditsRemaining: Number(d.ad_credits_remaining ?? 0),
          hasRow: (d.hasRow ?? Boolean(d.subscription)) || status === "trialing",
          isAdmin: false,
          currentPeriodEnd: periodEnd,
        });
      })
      .catch(() => {
        if (!cancelled) setState({ ...DEFAULT_STATE, loading: false, status: "unavailable" });
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, roleLoading]);

  // Admin bypass BEFORE any gate renders — elite + active, never loading
  if (isAdmin) return ADMIN_ELITE_STATE;

  // Keep loading until role resolves so gates don't flash upgrade CTAs for admins
  if (roleLoading) {
    return { ...DEFAULT_STATE, loading: true, isAdmin: false };
  }

  return state;
}
