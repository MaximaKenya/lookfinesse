"use client";



import { useEffect, useState } from "react";

import type { PlatformEntitlements } from "@/lib/subscriptions/platformEntitlements";

import { getPlatformEntitlements } from "@/lib/subscriptions/platformEntitlements";



type SubState = {

  active: boolean;

  tier: string | null;

  status: string;

  loading: boolean;

  entitlements: PlatformEntitlements;

  adCreditsRemaining: number;

  hasRow: boolean;

};



const DEFAULT_STATE: SubState = {

  active: false,

  tier: null,

  status: "none",

  loading: true,

  entitlements: getPlatformEntitlements("starter"),

  adCreditsRemaining: 0,

  hasRow: false,

};



export function usePlatformSubscription(): SubState {

  const [state, setState] = useState<SubState>(DEFAULT_STATE);



  useEffect(() => {

    let cancelled = false;



    fetch("/api/platform-subscriptions")

      .then(async (r) => {

        const d = await r.json().catch(() => ({}));

        if (cancelled) return;



        if (!r.ok && d?.code === "SUPABASE_UNREACHABLE") {

          setState({ ...DEFAULT_STATE, loading: false, status: "unavailable" });

          return;

        }



        const tier = d.tier ?? null;

        setState({

          active: !!d.active,

          tier,

          status: d.status ?? "none",

          loading: false,

          entitlements: d.entitlements ?? getPlatformEntitlements(tier ?? "starter"),

          adCreditsRemaining: Number(d.ad_credits_remaining ?? 0),

          hasRow: d.hasRow ?? Boolean(d.subscription),

        });

      })

      .catch(() => {

        if (!cancelled) setState({ ...DEFAULT_STATE, loading: false, status: "unavailable" });

      });



    return () => {

      cancelled = true;

    };

  }, []);



  return state;

}


