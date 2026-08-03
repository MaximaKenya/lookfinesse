"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CreditCard,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AdminEmptyState,
  AdminKpiTile,
  AdminPanel,
} from "@/components/admin/finance/AdminGlass";

type Overview = {
  empty: boolean;
  kpis: {
    revenue: number;
    feeRevenue: number;
    orderCount: number;
    paymentCount: number;
    payoutTotal: number;
    avgTicket: number;
  };
  series: { day: string; revenue: number; count: number }[];
  byProvider: { provider: string; amount: number; count: number }[];
  seedHint?: string;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/analytics/overview", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Admin access required."
            : `Analytics overview failed (${res.status})`
        );
      }
      setData((await res.json()) as Overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = data?.kpis;

  return (
    <main className="min-h-screen bg-black text-white px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
              <BarChart3 className="h-3.5 w-3.5" />
              Platform Analytics
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Revenue Analytics
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Payments, fees, and payout totals from admin-scoped Supabase
              queries.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/dashboard/admin/transactions"
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
            >
              <CreditCard className="h-4 w-4" />
              Transactions
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <AdminKpiTile
            label="GMV"
            value={`KES ${(kpis?.revenue ?? 0).toLocaleString()}`}
            helper={`${kpis?.paymentCount ?? 0} paid`}
            href="/dashboard/admin/transactions"
            tone="border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
            icon={Wallet}
          />
          <AdminKpiTile
            label="Platform Fees"
            value={`KES ${(kpis?.feeRevenue ?? 0).toLocaleString()}`}
            helper="Ledger fees"
            href="/admin/finance"
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={BarChart3}
          />
          <AdminKpiTile
            label="Orders"
            value={String(kpis?.orderCount ?? 0)}
            helper={`Avg ticket KES ${(kpis?.avgTicket ?? 0).toLocaleString()}`}
            href="/dashboard/admin/transactions"
            tone="border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10"
            icon={CreditCard}
          />
          <AdminKpiTile
            label="Payouts"
            value={`KES ${(kpis?.payoutTotal ?? 0).toLocaleString()}`}
            helper="Disbursed + pending"
            href="/admin/payouts"
            tone="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
            icon={ArrowUpRight}
          />
        </section>

        {data?.empty && (
          <AdminEmptyState title="No analytics data yet" hint={data.seedHint} />
        )}

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AdminPanel>
            <h2 className="text-lg font-bold mb-4">14-day GMV</h2>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.series ?? []}>
                  <defs>
                    <linearGradient id="gmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="day" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "#09090b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#34d399"
                    fill="url(#gmv)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </AdminPanel>
          {(data?.byProvider ?? []).length > 0 && (
            <AdminPanel>
              <h2 className="text-lg font-bold mb-4">By provider</h2>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.byProvider ?? []}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="provider" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "#09090b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="amount" fill="#a78bfa" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AdminPanel>
          )}
        </section>
      </div>
    </main>
  );
}
