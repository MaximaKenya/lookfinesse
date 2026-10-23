"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { daysRemainingLabel } from "@/lib/config/trial";
import { useAccountTrial } from "@/hooks/useAccountTrial";

export default function AccountTrialBanner() {
  const { state, loading } = useAccountTrial();
  if (loading || !state?.authenticated) return null;

  const ended = state.daysRemaining === 0;
  const label =
    state.daysRemaining == null ? state.copy : ended ? state.endedCopy : daysRemainingLabel(state.daysRemaining);

  if (ended) {
    return (
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-rose-400/30 bg-gradient-to-r from-rose-950/50 via-black to-amber-950/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-rose-100">{state.endedCopy}</p>
          <p className="mt-0.5 text-xs text-rose-100/70">
            Your account and everything you created are still here. Read access stays open.
          </p>
        </div>
        <Link
          href="/trial"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-white/90"
        >
          Choose a plan
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-400/25 bg-gradient-to-r from-amber-950/40 via-black to-rose-950/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10">
          <Sparkles className="h-4 w-4 text-amber-200" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-50">{label}</p>
          <p className="mt-0.5 text-xs text-amber-100/70">{state.copy}</p>
        </div>
      </div>
      <Link
        href="/trial"
        className="inline-flex shrink-0 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-400/15 px-4 py-2 text-xs font-semibold text-amber-50 hover:bg-amber-400/25"
      >
        Trial details
      </Link>
    </div>
  );
}
