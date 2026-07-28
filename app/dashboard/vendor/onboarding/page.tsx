"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function VendorOnboarding() {
  const { userId, loading } = useCurrentUser();
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!userId) return;
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, [userId]);

  const startOnboarding = async () => {
    if (!userId) return;

    const res = await fetch("/api/stripe/connect/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_id: userId,
        email: email || undefined,
      }),
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (loading) return <div className="p-6 text-zinc-500">Loading…</div>;

  if (!userId) {
    return <div className="p-6 text-zinc-400">Sign in to complete vendor onboarding.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Complete Your Setup</h1>

      <p className="text-gray-500 mb-4">
        You must complete Stripe onboarding to receive payouts.
      </p>

      <button
        onClick={startOnboarding}
        className="bg-black text-white px-4 py-2 rounded"
      >
        Start Verification
      </button>
    </div>
  );
}
