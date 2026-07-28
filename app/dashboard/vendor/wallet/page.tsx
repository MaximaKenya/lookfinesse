"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useVendorContext } from "@/hooks/useVendorContext";

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

interface FinanceData {
  wallets: VWallet[];
  payouts: Payout[];
  label?: string;
  empty?: boolean;
  demo?: boolean;
}

function isFinanceData(value: unknown): value is FinanceData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.wallets) && Array.isArray(v.payouts);
}

function KpiCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border p-5 sm:p-6 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs uppercase tracking-wider text-zinc-400">{label}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-black text-white truncate">{value}</p>
          <p className="mt-1 text-[11px] text-zinc-500">{helper}</p>
        </div>
        <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-black/40 border border-white/10">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("complete") || s.includes("paid") || s.includes("success")) {
    return "text-green-400 bg-green-500/10 border-green-500/20";
  }
  if (s.includes("pending") || s.includes("queued") || s.includes("processing")) {
    return "text-amber-300 bg-amber-500/10 border-amber-500/20";
  }
  if (s.includes("fail") || s.includes("reject")) {
    return "text-red-300 bg-red-500/10 border-red-500/20";
  }
  return "text-zinc-300 bg-white/5 border-white/10";
}

export default function WalletPage() {
  const { vendorId, loading: vendorLoading } = useVendorContext();
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/finance/overview", { credentials: "include" });
      const json: unknown = await res.json();
      if (!res.ok) {
        const message =
          typeof json === "object" && json !== null && "error" in json && typeof (json as { error?: unknown }).error === "string"
            ? (json as { error: string }).error
            : "Unable to load wallet data.";
        setData(null);
        setError(message);
        return;
      }
      if (!isFinanceData(json)) throw new Error("Unexpected wallet response");
      setData(json);
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (vendorLoading) return;
    void load();
  }, [vendorLoading, load]);

  const totalBalance = useMemo(
    () => (data?.wallets ?? []).reduce((sum, w) => sum + Number(w.balance || 0), 0),
    [data]
  );

  const pendingAmount = useMemo(
    () =>
      (data?.payouts ?? [])
        .filter((p) => {
          const s = p.status.toLowerCase();
          return s.includes("pending") || s.includes("queued") || s.includes("processing");
        })
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    [data]
  );

  const availableToWithdraw = Math.max(0, totalBalance - pendingAmount);
  const primaryCurrency = data?.wallets[0]?.currency ?? "KES";

  const handleWithdraw = async () => {
    if (!vendorId) {
      toast.error("Vendor account required");
      return;
    }
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > availableToWithdraw) {
      toast.error("Amount exceeds available balance");
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch("/api/payouts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          amount,
          currency: primaryCurrency,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Withdrawal failed");
      toast.success("Payout requested!");
      setWithdrawAmount("");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  if (vendorLoading || (loading && !data && !error)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-full border-4 border-white/10 border-t-cyan-400 animate-spin" />
          <p className="text-sm text-zinc-500">Loading wallet…</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-5">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 space-y-4">
          <Wallet className="h-10 w-10 text-red-300 mx-auto" />
          <p className="text-white font-semibold">Couldn&apos;t load wallet</p>
          <p className="text-sm text-zinc-400">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-300"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen bg-black text-white px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
        {data.label ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {data.label}
          </div>
        ) : null}

        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              <Wallet className="h-3.5 w-3.5" />
              Vendor Wallet
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Wallet</h1>
            <p className="text-sm text-zinc-400 max-w-md">
              Balances, pending payouts, and withdrawal requests — synced from your finance ledger.
            </p>
          </div>
          <Link
            href="/vendor/finance"
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/10"
          >
            Full Financial Center
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <KpiCard
            label="Balance"
            value={`${primaryCurrency} ${Number(totalBalance).toLocaleString()}`}
            helper="Total across wallets"
            icon={Wallet}
            tone="border-green-500/20 bg-green-500/5"
          />
          <KpiCard
            label="Pending"
            value={`${primaryCurrency} ${Number(pendingAmount).toLocaleString()}`}
            helper="Awaiting settlement"
            icon={Clock}
            tone="border-amber-500/20 bg-amber-500/5"
          />
          <KpiCard
            label="Available"
            value={`${primaryCurrency} ${Number(availableToWithdraw).toLocaleString()}`}
            helper="Ready to withdraw"
            icon={ArrowDownLeft}
            tone="border-cyan-500/20 bg-cyan-500/5"
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-cyan-300" />
            <h2 className="text-lg font-bold">Request withdrawal</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="number"
              min={0}
              step={1}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`Amount in ${primaryCurrency}`}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/40"
            />
            <button
              type="button"
              onClick={() => void handleWithdraw()}
              disabled={withdrawing || availableToWithdraw <= 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-6 py-3 font-bold text-sm hover:bg-white/90 disabled:opacity-50"
            >
              {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Withdraw
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Payouts route to M-Pesa or bank — configure rails in{" "}
            <Link href="/dashboard/vendor/payout-settings" className="text-cyan-300 hover:underline">
              payout settings
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <h2 className="text-xl font-bold">Recent transactions</h2>
            <Link
              href="/vendor/finance"
              className="text-xs font-semibold text-cyan-300 hover:underline inline-flex items-center gap-1"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {data.payouts.length === 0 ? (
            <Link
              href="/vendor/finance"
              className="block rounded-3xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-sm text-zinc-400 hover:bg-white/5"
            >
              No transactions yet — complete your first sale to see activity →
            </Link>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden divide-y divide-white/5">
              {data.payouts.map((p) => (
                <Link
                  key={p.id}
                  href="/vendor/finance"
                  className="flex items-center justify-between gap-4 px-4 sm:px-5 py-4 hover:bg-white/[0.04] transition group"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      {primaryCurrency} {Number(p.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${statusTone(p.status)}`}
                    >
                      {p.status}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {data.wallets.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-bold">Currency wallets</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {data.wallets.map((w) => (
                <Link
                  key={w.id}
                  href="/vendor/finance"
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition group"
                >
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">{w.currency}</p>
                  <p className="text-xl font-bold text-white mt-1">
                    {Number(w.balance).toLocaleString()}
                  </p>
                  <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-white mt-2 transition" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
