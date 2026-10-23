"use client";

import { useEffect, useState } from "react";

export type AccountTrialState = {
  authenticated: boolean;
  isAdmin: boolean;
  paymentsEnabled: boolean;
  copy: string;
  endedCopy: string;
  daysRemaining: number | null;
  active: boolean;
  trialStart: string | null;
  trialEnd: string | null;
};

let cached: { at: number; data: AccountTrialState | null } | null = null;
let inflight: Promise<AccountTrialState | null> | null = null;

function loadAccountTrial(): Promise<AccountTrialState | null> {
  if (cached && Date.now() - cached.at < 30_000) return Promise.resolve(cached.data);
  if (!inflight) {
    inflight = fetch("/api/trial", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AccountTrialState | null) => {
        cached = { at: Date.now(), data };
        return data;
      })
      .catch(() => null)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useAccountTrial() {
  const [state, setState] = useState<AccountTrialState | null>(cached?.data ?? null);
  const [loading, setLoading] = useState(cached == null);

  useEffect(() => {
    let cancel = false;
    loadAccountTrial().then((data) => {
      if (!cancel) {
        setState(data);
        setLoading(false);
      }
    });
    return () => {
      cancel = true;
    };
  }, []);

  return { state, loading };
}
