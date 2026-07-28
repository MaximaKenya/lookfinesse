"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Crown, Loader2, Smartphone } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

type Plan = {
  id: string;
  name: string;
  description?: string;
  price_kes: number;
  benefits: string[];
  includes_live_classes: boolean;
};

export default function ServicePlansSubscribe({
  vendorId,
  serviceId,
}: {
  vendorId: string;
  serviceId?: string;
}) {
  const { userId } = useCurrentUser();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams({ vendor_id: vendorId });
    if (serviceId) qs.set("service_id", serviceId);
    fetch(`/api/service-plans?${qs}`)
      .then((r) => r.json())
      .then((d) => setPlans(Array.isArray(d) ? d : []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, [vendorId, serviceId]);

  const subscribe = async (planId: string, method: "mpesa" | "stripe") => {
    if (!userId) {
      toast.error("Sign in to subscribe");
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setSubscribing(planId);
    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_id: planId, payment_method: method }),
    });
    const data = await res.json().catch(() => ({}));
    setSubscribing(null);
    if (res.ok && data.checkoutUrl) {
      router.push(`${data.checkoutUrl}&method=${method}`);
    } else {
      toast.error(data.error ?? "Subscribe failed");
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-6 animate-pulse h-32" />
    );
  }

  if (plans.length === 0) return null;

  return (
    <section className="rounded-3xl border border-white/8 bg-gradient-to-br from-purple-950/20 via-[#0f0f0f] to-cyan-950/20 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Crown className="w-5 h-5 text-amber-400" />
        <h2 className="font-bold text-white">Monthly Memberships</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4 space-y-3"
          >
            <div>
              <p className="font-bold text-white">{plan.name}</p>
              {plan.description && (
                <p className="text-xs text-white/40 mt-1">{plan.description}</p>
              )}
            </div>
            <p className="text-2xl font-bold text-white">
              KES {Number(plan.price_kes).toLocaleString()}
              <span className="text-xs font-normal text-white/40">/mo</span>
            </p>
            {Array.isArray(plan.benefits) && plan.benefits.length > 0 && (
              <ul className="text-xs text-white/50 space-y-1">
                {plan.benefits.slice(0, 4).map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
            )}
            {plan.includes_live_classes && (
              <p className="text-[10px] text-cyan-400/80 uppercase tracking-wider">Includes live classes</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                disabled={subscribing === plan.id}
                onClick={() => subscribe(plan.id, "mpesa")}
                className="flex-1 flex items-center justify-center gap-1 bg-white text-black py-2 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {subscribing === plan.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Smartphone className="w-3 h-3" />
                )}
                M-Pesa
              </button>
              <button
                type="button"
                disabled={subscribing === plan.id}
                onClick={() => subscribe(plan.id, "stripe")}
                className="flex-1 flex items-center justify-center gap-1 border border-white/15 text-white py-2 rounded-xl text-xs font-bold disabled:opacity-50"
              >
                <CreditCard className="w-3 h-3" /> Card
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
