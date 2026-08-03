"use client";

import { useState } from "react";
import TrustBadgeCard from "@/components/vendor/TrustBadgeCard";
import { useVendorContext } from "@/hooks/useVendorContext";
import { TRUST_TIER_UNLOCKS } from "@/lib/trust/tiers";

export default function KYCPage() {
  const { vendorId } = useVendorContext();
  const [form, setForm] = useState({
    full_name: "",
    id_number: "",
    document_url: "",
    business_registration: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendor/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "KYC submission failed");
        return;
      }

      if (vendorId && form.business_registration) {
        await fetch("/api/vendor/trust-badge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendor_id: vendorId, tier: "basic" }),
        }).catch(() => {});
      }

      alert("KYC submitted — admin approval unlocks Business / Elite badges");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Vendor Verification</h1>
        <p className="text-sm text-white/45 mt-1">
          Light ID + business docs unlock payouts, Elite ads, and Verified badges on storefronts & feed.
        </p>
      </div>

      <TrustBadgeCard vendorId={vendorId} />

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/50 space-y-1">
        <p className="font-semibold text-white/70">Tier unlocks</p>
        {(["basic", "business", "elite"] as const).map((t) => (
          <p key={t}>
            <span className="text-cyan-300 capitalize">{t}</span>: {TRUST_TIER_UNLOCKS[t].join(" · ")}
          </p>
        ))}
      </div>

      <div className="space-y-3">
        <input
          placeholder="Full Name"
          className="border border-white/10 bg-white/5 text-white p-2 w-full rounded-xl"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <input
          placeholder="ID Number"
          className="border border-white/10 bg-white/5 text-white p-2 w-full rounded-xl"
          value={form.id_number}
          onChange={(e) => setForm({ ...form, id_number: e.target.value })}
        />
        <input
          placeholder="ID document URL"
          className="border border-white/10 bg-white/5 text-white p-2 w-full rounded-xl"
          value={form.document_url}
          onChange={(e) => setForm({ ...form, document_url: e.target.value })}
        />
        <input
          placeholder="Business registration (optional → Business tier)"
          className="border border-white/10 bg-white/5 text-white p-2 w-full rounded-xl"
          value={form.business_registration}
          onChange={(e) => setForm({ ...form, business_registration: e.target.value })}
        />
        <button
          onClick={submit}
          disabled={submitting}
          className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl w-full font-semibold disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit KYC"}
        </button>
      </div>
    </div>
  );
}
