"use client";

import { useState } from "react";
import { Check, Crown, CreditCard, Smartphone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PLATFORM_TIERS } from "@/lib/subscriptions/platformTiers";

type Payment = "mpesa" | "stripe";

export default function SubscriptionPage() {
  const [payment, setPayment] = useState<Payment>("mpesa");
  const [phone, setPhone] = useState("");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const subscribe = async (tierId: string) => {
    setLoadingTier(tierId);
    try {
      const res = await fetch("/api/platform-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: tierId,
          payment_method: payment,
          phone: payment === "mpesa" ? phone : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Subscription failed");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toast.success("Check your phone to complete M-Pesa payment");
    } catch {
      toast.error("Subscription failed");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-10">
        <div className="text-center mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            Vendor Platform Plans
          </div>
          <h1 className="text-3xl md:text-4xl font-black">Grow on LookFinesse</h1>
          <p className="text-white/45 text-sm max-w-xl mx-auto">
            Sell, create, advertise, and go live — pick the tier that matches your ambition.
            Small price steps make upgrading a no-brainer.
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setPayment("mpesa")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                payment === "mpesa" ? "bg-emerald-500/20 text-emerald-300" : "text-white/50"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" /> M-Pesa
            </button>
            <button
              type="button"
              onClick={() => setPayment("stripe")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                payment === "stripe" ? "bg-rose-500/20 text-rose-300" : "text-white/50"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Card
            </button>
          </div>
        </div>

        {payment === "mpesa" && (
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 12))}
            placeholder="M-Pesa phone (e.g. 0712345678)"
            inputMode="numeric"
            className="max-w-sm mx-auto block w-full mb-8 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/40"
          />
        )}

        <div className="grid md:grid-cols-3 gap-4">
          {PLATFORM_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-3xl border p-6 flex flex-col ${
                tier.popular
                  ? "border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-rose-500/5 shadow-lg shadow-amber-500/10"
                  : "border-white/10 bg-white/[0.03]"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-rose-400 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                <Crown className={`w-5 h-5 ${tier.popular ? "text-amber-300" : "text-white/40"}`} />
                <h2 className="text-lg font-bold">{tier.name}</h2>
              </div>
              <p className="text-xs text-white/40 mb-4">{tier.tagline}</p>
              <p className="text-2xl font-black mb-4">
                KES {tier.price.toLocaleString()}
                <span className="text-sm font-normal text-white/40">/mo</span>
              </p>
              <ul className="space-y-2 flex-1 mb-4">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2 text-xs text-white/70">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
              </ul>
              {tier.comingSoon && tier.comingSoon.length > 0 && (
                <p className="text-[10px] text-white/35 mb-4 leading-snug">
                  Coming soon: {tier.comingSoon.join(" · ")}
                </p>
              )}
              <button
                type="button"
                onClick={() => subscribe(tier.id)}
                disabled={loadingTier === tier.id}
                className={`w-full py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 ${
                  tier.popular
                    ? "bg-gradient-to-r from-amber-400 to-rose-400 text-black hover:opacity-90"
                    : "bg-white/10 border border-white/15 text-white hover:bg-white/15"
                }`}
              >
                {loadingTier === tier.id ? "Processing…" : `Choose ${tier.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
