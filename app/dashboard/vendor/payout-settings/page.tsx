"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Save,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { useCurrentUser } from "@/hooks/useCurrentUser";

type PayoutMethod = "mpesa" | "stripe" | "bank";

const METHODS: {
  id: PayoutMethod;
  label: string;
  helper: string;
  icon: React.ElementType;
  accent: string;
}[] = [
  {
    id: "mpesa",
    label: "M-Pesa",
    helper: "Instant mobile money — Kenya",
    icon: Smartphone,
    accent: "from-emerald-500/20 to-green-600/10 border-emerald-500/25 text-emerald-200",
  },
  {
    id: "stripe",
    label: "Stripe",
    helper: "Cards & international rails",
    icon: CreditCard,
    accent: "from-violet-500/20 to-indigo-600/10 border-violet-500/25 text-violet-200",
  },
  {
    id: "bank",
    label: "Bank transfer",
    helper: "Local or SWIFT settlement",
    icon: Building2,
    accent: "from-cyan-500/20 to-blue-600/10 border-cyan-500/25 text-cyan-200",
  },
];

export default function PayoutSettingsPage() {
  const { userId, loading } = useCurrentUser();
  const [method, setMethod] = useState<PayoutMethod>("mpesa");
  const [frequency, setFrequency] = useState("weekly");
  const [autoPayout, setAutoPayout] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verified] = useState<"pending" | "verified">("pending");

  const [mpesaPhone, setMpesaPhone] = useState("");
  const [stripeAccount, setStripeAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [swiftCode, setSwiftCode] = useState("");

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/payout-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: userId,
          frequency,
          auto_payout: autoPayout,
          method,
          mpesa_phone: mpesaPhone,
          stripe_account: stripeAccount,
          bank_name: bankName,
          account_name: accountName,
          account_number: accountNumber,
          swift_code: swiftCode,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Payout settings saved");
    } catch {
      toast.error("Could not save — try again");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/50" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-white/70">Sign in to manage payout settings.</p>
        <Link href="/login" className="mt-4 inline-block text-amber-300 hover:text-white text-sm font-semibold">
          Sign in →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10 space-y-8">
      <header className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-400/80">Finance</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Payout settings</h1>
        <p className="text-sm text-white/70 leading-relaxed max-w-xl">
          Configure how LookFinesse sends your earnings — M-Pesa, Stripe, or bank transfer with automated schedules.
        </p>
      </header>

      {/* Verification status */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/25">
          {verified === "verified" ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          ) : (
            <Clock className="h-6 w-6 text-amber-300" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white">
            {verified === "verified" ? "Payout account verified" : "Verification pending"}
          </p>
          <p className="text-sm text-white/70 mt-0.5">
            {verified === "verified"
              ? "Your payout rails are cleared for automated disbursements."
              : "Complete KYC and confirm your payout method to enable auto-payouts."}
          </p>
        </div>
        <Link
          href="/dashboard/vendor/kyc"
          className="inline-flex items-center gap-2 shrink-0 rounded-2xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white transition-all"
        >
          <ShieldCheck className="h-4 w-4" />
          KYC status
        </Link>
      </div>

      {/* Payout method cards */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white/80">Payout method</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {METHODS.map(({ id, label, helper, icon: Icon, accent }) => {
            const selected = method === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={`relative text-left rounded-3xl border p-4 sm:p-5 transition-all bg-gradient-to-br ${accent} ${
                  selected ? "ring-2 ring-white/30 scale-[1.01]" : "opacity-80 hover:opacity-100"
                }`}
              >
                <Icon className="h-5 w-5 mb-3" />
                <p className="font-bold text-white text-sm">{label}</p>
                <p className="text-[11px] text-white/70 mt-1 leading-relaxed">{helper}</p>
                {selected && (
                  <span className="absolute top-3 right-3 h-2 w-2 rounded-full bg-white shadow-lg shadow-white/30" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Method-specific form */}
      <section className="rounded-3xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-amber-300" />
          <h2 className="font-semibold text-white">Account details</h2>
        </div>

        {method === "mpesa" && (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-white/70">M-Pesa phone number</label>
            <input
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-emerald-500/40"
            />
          </div>
        )}

        {method === "stripe" && (
          <div className="space-y-3">
            <label className="block text-xs font-medium text-white/70">Stripe Connect account ID</label>
            <input
              value={stripeAccount}
              onChange={(e) => setStripeAccount(e.target.value)}
              placeholder="acct_xxxxxxxx"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-violet-500/40"
            />
          </div>
        )}

        {method === "bank" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/70 mb-1.5">Bank name</label>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Equity Bank"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Account name</label>
              <input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Account number</label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/40"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/70 mb-1.5">SWIFT / BIC (optional)</label>
              <input
                value={swiftCode}
                onChange={(e) => setSwiftCode(e.target.value)}
                placeholder="EQBLKENA"
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/40"
              />
            </div>
          </div>
        )}
      </section>

      {/* Schedule */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 sm:p-6 space-y-4">
        <h2 className="font-semibold text-white">Payout schedule</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:border-white/25"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-3 cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3 w-full">
              <input
                type="checkbox"
                checked={autoPayout}
                onChange={(e) => setAutoPayout(e.target.checked)}
                className="h-4 w-4 rounded accent-amber-500"
              />
              <span className="text-sm text-white/80">Enable automatic payouts</span>
            </label>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 px-8 py-3.5 text-sm font-bold text-black hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-amber-900/25"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Saving…" : "Save payout settings"}
      </button>
    </div>
  );
}
