"use client";

import { TRIAL_COPY } from "@/lib/config/trial";
import { useAccountTrial } from "@/hooks/useAccountTrial";

type Props = {
  children: React.ReactNode;
  payLabel: string;
};

/**
 * Hides card / Paystack checkout until PAYMENTS_ENABLED is on.
 * The pay button stays in the tree only when the server says payments are live.
 */
export default function PaymentsPausedNotice({ children, payLabel }: Props) {
  const { state, loading } = useAccountTrial();
  const enabled = state?.paymentsEnabled === true;

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/50">
        Checking checkout…
      </div>
    );
  }

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm leading-relaxed text-amber-50">
        <p className="font-semibold">Card checkout is paused</p>
        <p className="mt-1 text-amber-100/80">
          {TRIAL_COPY}. Paystack stays ready and turns back on when live keys arrive.{" "}
          {payLabel} is hidden until then.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
