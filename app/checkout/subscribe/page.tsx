"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CreditCard, Smartphone, Loader2 } from "lucide-react";
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
  const router = useRouter();
  const [sub, setSub] = useState<SubCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<"mpesa" | "card">("mpesa");
  const [phone, setPhone] = useState("");
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

      if (method === "mpesa") {
        if (!phone.trim()) throw new Error("Enter M-Pesa number");
        const res = await fetch("/api/mpesa/stk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: phone.trim(),
            amount,
            userId: user?.id,
            accountReference: `SUB-${sub.id.slice(0, 8)}`,
            description: `Subscription: ${label}`,
            metadata: {
              kind: "service_subscription",
              subscription_id: sub.id,
              vendor_id: vendorId,
            },
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "M-Pesa failed");
        router.push(`/bookings?sub=pending`);
      } else {
        const res = await fetch("/api/stripe/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            userId: user?.id,
            subscriptionId: sub.id,
            description: `Subscription: ${label}`,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Stripe failed");
        if (data.url) window.location.href = data.url;
      }
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

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMethod("mpesa")}
            className={`flex items-center justify-center gap-2 p-3 rounded-2xl border ${method === "mpesa" ? "bg-white text-black" : "border-white/10 text-white/60"}`}
          >
            <Smartphone className="w-4 h-4" /> M-Pesa
          </button>
          <button
            type="button"
            onClick={() => setMethod("card")}
            className={`flex items-center justify-center gap-2 p-3 rounded-2xl border ${method === "card" ? "bg-white text-black" : "border-white/10 text-white/60"}`}
          >
            <CreditCard className="w-4 h-4" /> Card
          </button>
        </div>

        {method === "mpesa" && (
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="2547XXXXXXXX"
            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white"
          />
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="button"
          onClick={pay}
          disabled={paying}
          className="w-full bg-white text-black py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {paying ? "Processing…" : `Pay KES ${amount.toLocaleString()}`}
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
