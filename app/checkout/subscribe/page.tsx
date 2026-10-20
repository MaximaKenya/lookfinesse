"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2 } from "lucide-react";
import Link from "next/link";

type SubCheckout = {
  id: string;
  status: string;
  service_plans?: { name?: string; price_kes?: number; vendor_id?: string };
  vendors?: { business_name?: string; name?: string };
};

function SubscribeInner() {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("subscription_id");
  const [sub, setSub] = useState<SubCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!subscriptionId) {
      setLoading(false);
      return;
    }
    fetch(`/api/subscriptions/${subscriptionId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setSub)
      .finally(() => setLoading(false));
  }, [subscriptionId]);

  const amount = Number(sub?.service_plans?.price_kes ?? 0);
  const label = sub?.service_plans?.name ?? "Monthly plan";

  const pay = async () => {
    if (!sub) return;
    setError(null);
    setPaying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const vendorId = sub.service_plans?.vendor_id;

      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          userId: user?.id,
          email: user?.email,
          subscriptionId: sub.id,
          description: `Subscription: ${label}`,
          metadata: {
            app: "lookfinesse",
            kind: "service_subscription",
            subscription_id: sub.id,
            vendor_id: vendorId ?? "",
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Paystack checkout failed");
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <p className="text-white/50">Subscription not found. <Link href="/services" className="text-cyan-400">Browse services</Link></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0c] via-[#111827] to-black text-white p-6">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Subscribe</h1>
          <p className="text-white/40 text-sm mt-1">{sub.vendors?.business_name ?? sub.vendors?.name}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 space-y-3">
          <p className="font-semibold text-lg">{label}</p>
          <p className="text-3xl font-bold">KES {amount.toLocaleString()}<span className="text-sm font-normal text-white/40">/mo</span></p>
        </div>

        <p className="text-sm text-white/70">
          Paystack accepts card, M-Pesa, and bank transfer. The plan is confirmed only after Paystack verifies the payment.
        </p>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="button"
          onClick={pay}
          disabled={paying || amount <= 0}
          className="w-full bg-white text-black py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {paying ? "Opening Paystack…" : `Pay KES ${amount.toLocaleString()} with Paystack`}
        </button>
      </div>
    </div>
  );
}

export default function SubscribeCheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <SubscribeInner />
    </Suspense>
  );
}
