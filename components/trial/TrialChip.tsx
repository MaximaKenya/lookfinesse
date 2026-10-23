"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { daysRemainingLabel } from "@/lib/config/trial";
import { useAccountTrial } from "@/hooks/useAccountTrial";

export default function TrialChip({ compact = false }: { compact?: boolean }) {
  const { state, loading } = useAccountTrial();
  if (loading || !state?.authenticated) return null;

  const ended = state.active === false && state.daysRemaining === 0;
  const label =
    state.daysRemaining == null
      ? state.copy
      : ended
        ? state.endedCopy
        : daysRemainingLabel(state.daysRemaining);

  return (
    <Link
      href="/trial"
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-tight transition ${
        ended
          ? "border-rose-400/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25"
          : "border-amber-400/35 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
      }`}
      title={state.copy}
    >
      <Sparkles className="h-3 w-3 shrink-0" />
      <span className="truncate">
        {compact && state.daysRemaining != null && !ended
          ? `${state.daysRemaining}d`
          : label}
      </span>
    </Link>
  );
}
