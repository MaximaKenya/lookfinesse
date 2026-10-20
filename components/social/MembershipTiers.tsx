"use client";

import { useState } from "react";
import { Award, Check, AlertCircle } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { fanTierFromName } from "@/lib/subscriptions/fanTiers";

interface Tier {
  id: string;
  name: string;
  price: number;
  description?: string;
  perks?: string[] | string;
}

function perksList(perks: string[] | string | undefined, tierName: string): string[] {
  if (Array.isArray(perks) && perks.length > 0) return perks;
  if (typeof perks === "string" && perks.trim()) {
    return perks.split(/[·•|;,]/).map((s) => s.trim()).filter(Boolean);
  }
  const fallback = fanTierFromName(tierName);
  return fallback?.features ?? [];
}

export default function MembershipTiers({
  vendorId,
  tiers,
}: {
  vendorId: string;
  tiers: Tier[];
}) {
  const { userId } = useCurrentUser();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [showSetupHint, setShowSetupHint] = useState(false);

  const displayTiers = tiers.map((t) => {
    const fb = fanTierFromName(t.name);
    return {
      ...t,
      name: fb?.name ?? t.name,
      price: t.price || fb?.price || 0,
      popular: fb?.popular,
      tagline: fb?.tagline,
      comingSoon: fb?.comingSoon,
    };
  });

  const subscribe = async (tier: (typeof displayTiers)[0]) => {
    if (!userId) {
      toast.error("Sign in to subscribe");
      return;
    }
    setLoadingTier(tier.id);
    try {
      const tierKey = tier.name.toLowerCase().replace(/\s+/g, "");

      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: tier.price,
          userId,
          description: `LookFinesse membership: ${tier.name}`,
          metadata: {
            app: "lookfinesse",
            kind: "membership",
            user_id: userId,
            vendor_id: vendorId,
            tier: tierKey,
          },
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        if (data.error.toLowerCase().includes("config") || data.error.toLowerCase().includes("paystack")) {
          setShowSetupHint(true);
        }
        toast.error(data.error);
      } else {
        toast.success(`Subscribed to ${tier.name}!`);
      }
    } catch {
      toast.error("Subscription failed");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-950/20 via-purple-950/15 to-rose-950/20 border border-amber-500/15 rounded-3xl p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="font-bold text-white">Membership Plans</h2>
          </div>
          <p className="text-xs text-white/70 mt-1">
            Support your creator with recurring perks. Cancel anytime — not the same as a free Follow.
          </p>
        </div>

      </div>

      <p className="text-xs text-white/60">
        Checkout opens on Paystack. Card, M-Pesa, and bank transfer are available there.
      </p>

      {displayTiers.length === 0 ? (
        <p className="text-sm text-white/70 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center">
          This creator has not published membership plans yet.
        </p>
      ) : (
      <div className="grid md:grid-cols-3 gap-3">
        {displayTiers.map((tier) => {
          const items = perksList(
            "perks" in tier ? (tier as Tier).perks : undefined,
            tier.name
          );
          const popular = "popular" in tier && tier.popular;

          return (
            <div
              key={tier.id}
              className={`relative border rounded-2xl p-4 flex flex-col gap-2 ${
                popular
                  ? "border-amber-500/35 bg-gradient-to-b from-amber-500/10 to-rose-500/5"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              {popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-rose-400 text-black text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  Most Popular
                </span>
              )}
              <p className="font-bold text-white pt-1">{tier.name}</p>
              {"tagline" in tier && tier.tagline && (
                <p className="text-[10px] text-white/40 -mt-1">{tier.tagline as string}</p>
              )}
              <p className="text-white font-bold text-lg">
                KES {tier.price.toLocaleString()}
                <span className="text-xs text-white/40 font-normal">/mo</span>
              </p>
              <ul className="text-[11px] text-white/55 leading-snug space-y-1.5 flex-1">
                {items.map((p) => (
                  <li key={p} className="flex gap-1.5 items-start">
                    <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
              {"comingSoon" in tier && Array.isArray((tier as { comingSoon?: string[] }).comingSoon) &&
                (tier as { comingSoon: string[] }).comingSoon.length > 0 && (
                  <p className="text-[10px] text-white/35 mt-2 leading-snug">
                    Coming soon: {(tier as { comingSoon: string[] }).comingSoon.join(" · ")}
                  </p>
                )}
              <button
                type="button"
                onClick={() => subscribe(tier)}
                disabled={loadingTier === tier.id}
                className={`mt-1 w-full disabled:opacity-50 text-xs font-semibold py-2.5 rounded-xl transition-all ${
                  popular
                    ? "bg-gradient-to-r from-amber-400 to-rose-400 text-black hover:opacity-90"
                    : "bg-white/10 border border-white/15 text-white hover:bg-white/15"
                }`}
              >
                {loadingTier === tier.id ? "Processing…" : `Join ${tier.name}`}
              </button>
            </div>
          );
        })}
      </div>
      )}

      {showSetupHint && (
        <div className="flex items-start gap-2 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <strong>Paystack is not configured.</strong>
            <p className="text-yellow-200 mt-0.5">
              Set PAYSTACK_SECRET_KEY on the server to open live checkout.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
