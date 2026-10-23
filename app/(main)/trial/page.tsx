"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { daysRemainingLabel, TRIAL_COPY, TRIAL_ENDED_COPY } from "@/lib/config/trial";
import { useAccountTrial } from "@/hooks/useAccountTrial";

export default function TrialPage() {
  const { state, loading } = useAccountTrial();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-amber-900/10 sm:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
          <Sparkles className="h-3.5 w-3.5" />
          LookFinesse
        </div>

        {loading ? (
          <p className="text-sm text-white/50">Loading your trial…</p>
        ) : !state?.authenticated ? (
          <SignedOut />
        ) : state.daysRemaining === 0 ? (
          <Ended paymentsEnabled={state.paymentsEnabled} />
        ) : (
          <Active
            label={
              state.daysRemaining == null ? TRIAL_COPY : daysRemainingLabel(state.daysRemaining)
            }
            ends={state.trialEnd}
          />
        )}
      </div>
    </div>
  );
}

function SignedOut() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">One month on the house</h1>
      <p className="text-sm leading-relaxed text-white/70">{TRIAL_COPY}.</p>
      <Link
        href="/register"
        className="inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black"
      >
        Create account
      </Link>
    </div>
  );
}

function Active({ label, ends }: { label: string; ends: string | null }) {
  const endLabel = ends
    ? new Date(ends).toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">{label}</h1>
      <p className="text-sm leading-relaxed text-white/70">
        {TRIAL_COPY}. Your trial started when you signed up
        {endLabel ? ` and runs through ${endLabel}` : ""}. Shop, sell, and create while it is open.
        Nothing is deleted when it ends.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black"
      >
        Go to dashboard
      </Link>
    </div>
  );
}

function Ended({ paymentsEnabled }: { paymentsEnabled: boolean }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold tracking-tight">{TRIAL_ENDED_COPY}</h1>
      <p className="text-sm leading-relaxed text-white/70">
        Your account, orders, products, and posts are still here. You can keep reading them and
        editing what you already created. New listings, campaigns, payouts, and live sessions wait
        until a plan is active.
      </p>
      {paymentsEnabled ? (
        <Link
          href="/dashboard/subscription"
          className="inline-flex rounded-2xl bg-gradient-to-r from-amber-400 to-rose-400 px-5 py-3 text-sm font-bold text-black"
        >
          Choose a plan
        </Link>
      ) : (
        <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-50">
          <p className="font-semibold">Plans are ready. Card checkout is not live yet.</p>
          <p className="mt-1 text-amber-100/80">
            {TRIAL_COPY} was the opening offer. Paystack checkout stays hidden until live keys
            arrive, and every listing you made stays in your account.
          </p>
        </div>
      )}
    </div>
  );
}
