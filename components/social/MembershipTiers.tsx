"use client";

import { useState } from "react";
import { Award, Check, CreditCard, Smartphone, AlertCircle } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { FAN_TIER_DEFAULTS, fanTierFromName } from "@/lib/subscriptions/fanTiers";

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

type Payment = "mpesa" | "stripe";

export default function MembershipTiers({
  vendorId,
  tiers,
}: {
  vendorId: string;
  tiers: Tier[];
}) {
  const { userId } = useCurrentUser();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment>("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [showSetupHint, setShowSetupHint] = useState(false);

  const displayTiers =
    tiers.length > 0
      ? tiers.map((t) => {
          const fb = fanTierFromName(t.name);
          return {
            ...t,
            name: fb?.name ?? t.name,
            price: t.price || fb?.price || 499,
            popular: fb?.popular,
            tagline: fb?.tagline,
            comingSoon: fb?.comingSoon,
          };
        })
      : FAN_TIER_DEFAULTS.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          popular: t.popular,
          tagline: t.tagline,
          perks: t.features,
          comingSoon: t.comingSoon,
        }));

  const subscribe = async (tier: (typeof displayTiers)[0]) => {
    if (!userId) {
      toast.error("Sign in to subscribe");
      return;
    }
    setLoadingTier(tier.id);
    try {
      const tierKey = tier.name.toLowerCase().replace(/\s+/g, "");

      if (payment === "mpesa") {
        if (!mpesaPhone || mpesaPhone.length < 9) {
          toast.error("Enter your M-Pesa phone number");
          setLoadingTier(null);
          return;
        }
        const res = await fetch("/api/mpesa/stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: mpesaPhone,
            amount: tier.price,
            accountReference: `LF-${vendorId.slice(0, 6)}-${tier.id}`,
            description: `LookFinesse Membership: ${tier.name}`,
            metadata: {
              user_id: userId,
              vendor_id: vendorId,
              tier: tierKey,
              kind: "membership",
            },
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          if (data.message?.toLowerCase().includes("config") || data.error?.toLowerCase().includes("credentials")) {
            setShowSetupHint(true);
          }
          toast.error(data.message ?? data.error ?? "M-Pesa STK push failed");
        } else {
          toast.success("Check your phone to complete payment");
        }
        return;
      }

      const res = await fetch("/api/stripe/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          vendorId,
          tier: tierKey,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        if (data.error.toLowerCase().includes("stripe") || data.error.toLowerCase().includes("config")) {
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
          <p className="text-xs text-white/40 mt-1">
            Support your creator with recurring perks. Cancel anytime — not the same as a free Follow.
          </p>
        </div>

        <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => setPayment("mpesa")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              payment === "mpesa" ? "bg-emerald-500/20 text-emerald-300" : "text-white/50"
            }`}
          >
            <Smartphone className="w-3 h-3" /> M-Pesa
          </button>
          <button
            type="button"
            onClick={() => setPayment("stripe")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              payment === "stripe" ? "bg-rose-500/20 text-rose-300" : "text-white/50"
            }`}
          >
            <CreditCard className="w-3 h-3" /> Card
          </button>
        </div>
      </div>

      {payment === "mpesa" && (
        <input
          value={mpesaPhone}
          onChange={(e) => setMpesaPhone(e.target.value.replace(/\D/g, "").slice(0, 12))}
          placeholder="M-Pesa phone (e.g. 0712345678)"
          inputMode="numeric"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40"
        />
      )}

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

      {showSetupHint && (
        <div className="flex items-start gap-2 text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <strong>Payment provider not configured.</strong>
            <p className="text-yellow-300/80 mt-0.5">
              Add Stripe or M-Pesa credentials in `.env.local` to enable live fan subscriptions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
