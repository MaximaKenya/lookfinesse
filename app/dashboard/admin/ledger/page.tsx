"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
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
    entryCount: number;
    creditTotal: number;
    debitTotal: number;
    feeTotal: number;
    net: number;
  };
  entries: {
    id: string;
    vendor_id?: string;
    type: string;
    amount: number;
    category?: string;
    description?: string;
    status?: string;
    created_at?: string;
  }[];
  byCategory: { category: string; amount: number }[];
  series: { day: string; credit: number; debit: number }[];
  seedHint?: string;
};

export default function LedgerPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/ledger/overview", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Admin access required."
            : `Ledger overview failed (${res.status})`
        );
      }
      setData((await res.json()) as Overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ledger");
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
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <BookOpen className="h-3.5 w-3.5" />
              Double-entry Ledger
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Platform Ledger
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Credits, debits, and platform fees from the live ledger_entries
              table.
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
              href="/admin/finance"
              className="inline-flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 hover:bg-green-500/20"
            >
              <Wallet className="h-4 w-4" />
              Finance
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
            label="Credits"
            value={`KES ${(kpis?.creditTotal ?? 0).toLocaleString()}`}
            helper={`${kpis?.entryCount ?? 0} entries`}
            href="#entries"
            tone="border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
            icon={BookOpen}
          />
          <AdminKpiTile
            label="Debits"
            value={`KES ${(kpis?.debitTotal ?? 0).toLocaleString()}`}
            helper="Outflows"
            href="#entries"
            tone="border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
            icon={RefreshCw}
          />
          <AdminKpiTile
            label="Fee Revenue"
            value={`KES ${(kpis?.feeTotal ?? 0).toLocaleString()}`}
            helper="category=fee"
            href="/admin/finance"
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={Wallet}
          />
          <AdminKpiTile
            label="Net"
            value={`KES ${(kpis?.net ?? 0).toLocaleString()}`}
            helper="Credits − debits"
            href="/admin/treasury"
            tone="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
            icon={ArrowUpRight}
          />
        </section>

        {data?.empty && (
          <AdminEmptyState title="Ledger is empty" hint={data.seedHint} />
        )}

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AdminPanel>
            <h2 className="text-lg font-bold mb-4">14-day pulse</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.series ?? []}>
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
                    dataKey="credit"
                    stroke="#34d399"
                    fill="#34d39933"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="debit"
                    stroke="#f87171"
                    fill="#f8717133"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </AdminPanel>
          {(data?.byCategory ?? []).length > 0 && (
            <AdminPanel>
              <h2 className="text-lg font-bold mb-4">By category</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.byCategory ?? []}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="category" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "#09090b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="amount" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AdminPanel>
          )}
        </section>

        <AdminPanel id="entries">
          <h2 className="text-lg font-bold mb-4">Recent entries</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-500 border-b border-white/10">
                  <th className="pb-3 pr-3">Type</th>
                  <th className="pb-3 pr-3">Category</th>
                  <th className="pb-3 pr-3">Amount</th>
                  <th className="pb-3 pr-3">Vendor</th>
                  <th className="pb-3">When</th>
                </tr>
              </thead>
              <tbody>
                {(data?.entries ?? []).slice(0, 40).map((e) => (
                  <tr key={e.id} className="border-b border-white/5">
                    <td className="py-3 pr-3 capitalize">{e.type}</td>
                    <td className="py-3 pr-3 text-zinc-400">{e.category ?? "—"}</td>
                    <td className="py-3 pr-3 font-semibold">
                      KES {Number(e.amount).toLocaleString()}
                    </td>
                    <td className="py-3 pr-3 text-zinc-500">
                      {e.vendor_id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="py-3 text-zinc-500 text-xs">
                      {e.created_at
                        ? new Date(e.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data?.entries ?? []).length === 0 && (
              <p className="text-sm text-zinc-500 py-4">No ledger rows.</p>
            )}
          </div>
        </AdminPanel>
      </div>
    </main>
  );
}
