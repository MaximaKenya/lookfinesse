"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BrainCircuit,
  CreditCard,
  Gauge,
  Globe,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Wallet,
} from "lucide-react";

import WalletCard from "@/components/vendor/WalletCard";
import RevenueChart from "@/components/vendor/RevenueChart";
import PayoutTable from "@/components/vendor/PayoutTable";
import RiskStatusCard from "@/components/vendor/RiskStatusCard";
import FxWalletCard from "@/components/vendor/FxWalletCard";

interface VWallet {
  id: string;
  currency: string;
  balance: number;
}

interface Payout {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Risk {
  risk_score: number;
  trust_tier: string;
  is_frozen: boolean;
}

interface KYC {
  status: string;
}

interface FinanceData {
  wallets: VWallet[];
  payouts: Payout[];
  risk: Risk;
  kyc: KYC;
  label?: string;
  empty?: boolean;
  demo?: boolean;
}

function isFinanceData(value: unknown): value is FinanceData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.wallets) &&
    Array.isArray(v.payouts) &&
    typeof v.risk === "object" &&
    v.risk !== null &&
    typeof v.kyc === "object" &&
    v.kyc !== null
  );
}

const QUICK_LINKS = [
  {
    href: "/dashboard/vendor/wallet",
    label: "Request Payout",
    description: "Send to M-Pesa or bank",
    icon: CreditCard,
    accent: "text-cyan-300",
    tone: "border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20",
  },
  {
    href: "/dashboard/vendor/payout-settings",
    label: "Payout Settings",
    description: "Auto-payouts & limits",
    icon: Gauge,
    accent: "text-amber-300",
    tone: "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20",
  },
  {
    href: "/dashboard/vendor/kyc",
    label: "KYC Tier",
    description: "Upgrade for higher limits",
    icon: ShieldCheck,
    accent: "text-green-300",
    tone: "border-green-500/30 bg-green-500/10 hover:bg-green-500/20",
  },
  {
    href: "/vendor/intelligence",
    label: "AI Suggestions",
    description: "Growth & risk signals",
    icon: BrainCircuit,
    accent: "text-fuchsia-300",
    tone: "border-fuchsia-500/30 bg-fuchsia-500/10 hover:bg-fuchsia-500/20",
  },
];

function KpiCard({
  label,
  value,
  helper,
  href,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  href: string;
  tone: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-3xl border p-6 transition-all ${tone}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-400">
            {label}
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-white">{value}</div>
          <div className="mt-1 text-[11px] text-zinc-500 flex items-center gap-1">
            {helper}
            <ArrowUpRight className="h-3 w-3 text-zinc-600 group-hover:text-white transition" />
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black/40 border border-white/10">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

export default function VendorFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/vendor/finance/overview", {
        credentials: "include",
        redirect: "manual",
        headers: { Accept: "application/json" },
      });

      // Redirects (login HTML) or opaque — never try to parse as JSON
      if (res.type === "opaqueredirect" || (res.status >= 300 && res.status < 400)) {
        setData(null);
        setError("Sign in to view your financial center.");
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      const text = await res.text();

      if (
        !contentType.includes("application/json") ||
        text.trimStart().startsWith("<")
      ) {
        throw new Error(
          "Finance service returned an invalid response. Try refreshing, or re-run seed_demo_metrics.sql if balances stay empty."
        );
      }

      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error("Finance service returned an invalid response.");
      }

      if (!res.ok) {
        const message =
          typeof json === "object" &&
          json !== null &&
          "error" in json &&
          typeof (json as { error?: unknown }).error === "string"
            ? (json as { error: string }).error
            : res.status === 401
              ? "Sign in to view your financial center."
              : res.status === 403
                ? "A vendor account is required to access finance data."
                : "Unable to load finance data right now.";
        setData(null);
        setError(message);
        return;
      }

      if (!isFinanceData(json)) {
        throw new Error("Finance service returned unexpected data.");
      }

      setData(json);
    } catch (err) {
      console.error("Failed to load finance data", err);
      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : "Network error — could not reach the finance service."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (mounted) await load();
    })();
    const id = setInterval(() => {
      if (mounted) void load();
    }, 20000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [load]);

  const totalBalance = useMemo(
    () =>
      (data?.wallets ?? []).reduce(
        (sum, w) => sum + Number(w.balance || 0),
        0
      ),
    [data]
  );

  const pendingPayoutAmount = useMemo(
    () =>
      (data?.payouts ?? [])
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [data]
  );

  const trustTier = data?.risk?.trust_tier ?? "STANDARD";
  const riskScore = data?.risk?.risk_score ?? 0;

  if (loading && !data && !error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full border-4 border-white/10 border-t-cyan-400 animate-spin" />
          <p className="text-sm text-zinc-500">Loading Financial Center…</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-5 rounded-3xl border border-red-500/20 bg-red-500/5 p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
            <Wallet className="h-7 w-7 text-red-300" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Couldn&apos;t load finance data</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">{error}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
            <Link
              href="/login?returnUrl=/vendor/finance"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-black text-white px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        {data.demo && data.label ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {data.label}
          </div>
        ) : null}

        {/* HEADER */}
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3 min-w-0">
            {data.label && (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                {data.label}
              </div>
            )}
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-green-300">
              <Wallet className="h-3.5 w-3.5" />
              Vendor Financial Center
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Financial Center
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Multi-currency wallets, payout orchestration, risk telemetry and
              KYC tier — wired live to the marketplace ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
            <Link
              href="/dashboard/vendor/wallet"
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
            >
              <CreditCard className="h-4 w-4" />
              Request Payout
            </Link>
            <Link
              href={`/dashboard/vendor/kyc`}
              className="inline-flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 hover:bg-green-500/20"
            >
              <ShieldCheck className="h-4 w-4" />
              KYC: {data.kyc?.status ?? "PENDING"}
            </Link>
          </div>
        </header>

        {/* KPI ROW */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard
            label="Total Balance"
            value={`KES ${Number(totalBalance).toLocaleString()}`}
            helper="Across all wallets"
            href="/dashboard/finance"
            tone="border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
            icon={Wallet}
          />
          <KpiCard
            label="Pending Payouts"
            value={`KES ${Number(pendingPayoutAmount).toLocaleString()}`}
            helper="Awaiting settlement"
            href="/dashboard/vendor/wallet"
            tone="border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10"
            icon={CreditCard}
          />
          <KpiCard
            label="Trust Tier"
            value={trustTier}
            helper={`Risk score ${riskScore}`}
            href="/vendor/intelligence"
            tone="border-fuchsia-500/20 bg-fuchsia-500/5 hover:bg-fuchsia-500/10"
            icon={ShieldCheck}
          />
          <KpiCard
            label="Storefront"
            value={`${data.wallets.length} currencies`}
            helper="FX-ready"
            href="/admin/fx"
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={Globe}
          />
        </section>

        {/* QUICK LINKS */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {QUICK_LINKS.map(({ href, label, description, icon: Icon, accent, tone }) => (
            <Link
              key={href}
              href={href}
              className={`group rounded-2xl border p-5 transition ${tone}`}
            >
              <Icon className={`h-5 w-5 ${accent}`} />
              <div className="mt-3 text-base font-semibold text-white">
                {label}
              </div>
              <p className="mt-1 text-xs text-zinc-400">{description}</p>
              <ArrowUpRight className="mt-3 h-4 w-4 text-zinc-600 group-hover:text-white transition" />
            </Link>
          ))}
        </section>

        {/* WALLETS */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Wallets</h2>
            <Link
              href="/dashboard/vendor/payout-settings"
              className="text-xs font-semibold text-cyan-300 hover:underline inline-flex items-center gap-1"
            >
              Configure payout rails
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {data.wallets.length === 0 ? (
            <Link
              href="/dashboard/vendor/payout-settings"
              className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-sm text-zinc-400 hover:bg-white/5"
            >
              No wallets yet — set up your first currency wallet →
            </Link>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.wallets.map((wallet) => (
                <WalletCard
                  key={wallet.id}
                  currency={wallet.currency}
                  balance={wallet.balance}
                />
              ))}
            </div>
          )}
        </section>

        {/* ANALYTICS + RISK */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0">
          <div className="lg:col-span-2 min-w-0 overflow-hidden">
            <RevenueChart />
          </div>
          <RiskStatusCard
            risk_score={data.risk?.risk_score ?? 0}
            trust_tier={data.risk?.trust_tier ?? "STANDARD"}
            is_frozen={data.risk?.is_frozen ?? false}
          />
        </section>

        {/* FX WALLETS */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-2xl font-bold">FX Wallets</h2>
            <Link
              href="/admin/fx"
              className="text-xs font-semibold text-cyan-300 hover:underline inline-flex items-center gap-1"
            >
              FX engine
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {data.wallets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-sm text-zinc-400">
              FX wallets unlock once you receive your first international order.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.wallets.map((wallet) => (
                <FxWalletCard
                  key={wallet.id}
                  currency={wallet.currency}
                  balance={wallet.balance}
                />
              ))}
            </div>
          )}
        </section>

        {/* PAYOUTS */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Payouts</h2>
            <Link
              href="/dashboard/vendor/wallet"
              className="text-xs font-semibold text-cyan-300 hover:underline inline-flex items-center gap-1"
            >
              Manage
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          {data.payouts.length === 0 ? (
            <Link
              href="/dashboard/vendor/wallet"
              className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-sm text-zinc-400 hover:bg-white/5"
            >
              No payouts yet — request your first withdrawal →
            </Link>
          ) : (
            <PayoutTable payouts={data.payouts} />
          )}
        </section>

        {/* FOOTER NAV */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/vendor/intelligence"
            className="group flex items-start gap-3 rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-5 hover:bg-fuchsia-500/10"
          >
            <BrainCircuit className="h-5 w-5 text-fuchsia-300" />
            <div>
              <div className="font-semibold">AI Intelligence</div>
              <p className="text-xs text-zinc-400 mt-1">
                See trust, risk and growth signals tuned to your store.
              </p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 text-zinc-500 group-hover:text-white" />
          </Link>
          <Link
            href="/vendor/products"
            className="group flex items-start gap-3 rounded-3xl border border-purple-500/20 bg-purple-500/5 p-5 hover:bg-purple-500/10"
          >
            <ShoppingBag className="h-5 w-5 text-purple-300" />
            <div>
              <div className="font-semibold">Product Studio</div>
              <p className="text-xs text-zinc-400 mt-1">
                Boost low-performing listings recommended by AI.
              </p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 text-zinc-500 group-hover:text-white" />
          </Link>
          <Link
            href="/vendor/orders"
            className="group flex items-start gap-3 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5 hover:bg-amber-500/10"
          >
            <TrendingUp className="h-5 w-5 text-amber-300" />
            <div>
              <div className="font-semibold">Open Orders</div>
              <p className="text-xs text-zinc-400 mt-1">
                Ship & reconcile pending orders to release payouts.
              </p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 text-zinc-500 group-hover:text-white" />
          </Link>
        </section>
      </div>
    </main>
  );
}
