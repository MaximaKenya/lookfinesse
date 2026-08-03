"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  CreditCard,
  Droplets,
  Network,
  Play,
  RefreshCw,
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
    batchCount: number;
    pendingBatches: number;
    settledBatches: number;
    networkVolume: number;
    queueDepth: number;
    floatBalance: number;
  };
  batches: {
    id: string;
    total_amount: number;
    payout_count: number;
    status: string;
    rail?: string | null;
    currency?: string | null;
    created_at?: string;
  }[];
  queue: {
    id: string;
    vendor_id: string;
    amount: number;
    status: string;
  }[];
  series: { day: string; volume: number; count: number }[];
  railBreakdown: { rail: string; count: number; amount: number }[];
  seedHint?: string;
};

export default function NetworkDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workerMsg, setWorkerMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/network/overview", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Admin access required."
            : `Network overview failed (${res.status})`
        );
      }
      setData((await res.json()) as Overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load network");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 25000);
    return () => clearInterval(id);
  }, [load]);

  async function runSettlement() {
    setWorkerMsg(null);
    try {
      const res = await fetch("/api/settlement/run", {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Settlement failed");
      setWorkerMsg(
        json.result
          ? `Batch queued: KES ${Number(json.result.total_amount ?? 0).toLocaleString()} / ${json.result.payout_count} payouts`
          : json.message ?? "Settlement run complete"
      );
      await load();
    } catch (err) {
      setWorkerMsg(err instanceof Error ? err.message : "Settlement failed");
    }
  }

  const kpis = data?.kpis;
  const hasChart =
    (data?.series ?? []).some((s) => s.volume > 0) ||
    (data?.railBreakdown ?? []).length > 0;

  return (
    <main className="min-h-screen bg-black text-white px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
              <Network className="h-3.5 w-3.5" />
              Payment Network Operations
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Settlement Network
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Settlement batches, payout rails, and float coverage from live
              Supabase data.
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
            <button
              type="button"
              onClick={() => void runSettlement()}
              className="inline-flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 hover:bg-green-500/20"
            >
              <Play className="h-4 w-4" />
              Run Settlement
            </button>
            <Link
              href="/admin/payouts"
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
            >
              <CreditCard className="h-4 w-4" />
              Payouts
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {workerMsg && (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-200">
            {workerMsg}
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <AdminKpiTile
            label="Network Volume"
            value={`KES ${(kpis?.networkVolume ?? 0).toLocaleString()}`}
            helper={`${kpis?.batchCount ?? 0} batches`}
            href="#batches"
            tone="border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10"
            icon={Network}
          />
          <AdminKpiTile
            label="Pending Batches"
            value={String(kpis?.pendingBatches ?? 0)}
            helper={`${kpis?.settledBatches ?? 0} settled`}
            href="#batches"
            tone="border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10"
            icon={CreditCard}
          />
          <AdminKpiTile
            label="Queue Depth"
            value={String(kpis?.queueDepth ?? 0)}
            helper="Awaiting rail"
            href="/admin/payouts"
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={RefreshCw}
          />
          <AdminKpiTile
            label="Float"
            value={`KES ${(kpis?.floatBalance ?? 0).toLocaleString()}`}
            helper="Liquidity pools"
            href="/admin/treasury"
            tone="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
            icon={Droplets}
          />
        </section>

        {data?.empty && (
          <AdminEmptyState
            title="No settlement batches yet"
            hint={data.seedHint}
          />
        )}

        {hasChart && (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AdminPanel>
              <h2 className="text-lg font-bold mb-4">14-day settlement volume</h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.series ?? []}>
                    <defs>
                      <linearGradient id="netVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
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
                      dataKey="volume"
                      stroke="#a78bfa"
                      fill="url(#netVol)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </AdminPanel>
            {(data?.railBreakdown ?? []).length > 0 && (
              <AdminPanel>
                <h2 className="text-lg font-bold mb-4">Rail mix</h2>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.railBreakdown ?? []}>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="rail" stroke="#71717a" fontSize={11} />
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
        )}

        <AdminPanel id="batches">
          <h2 className="text-lg font-bold mb-4">Settlement batches</h2>
          <div className="space-y-2">
            {(data?.batches ?? []).map((b) => (
              <div
                key={b.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border border-white/8 bg-black/40 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold">
                    KES {Number(b.total_amount).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {b.payout_count} payouts · {b.rail ?? "multi-rail"} ·{" "}
                    {b.created_at
                      ? new Date(b.created_at).toLocaleString()
                      : "—"}
                  </div>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                    String(b.status).toUpperCase().includes("SETTLE") ||
                    String(b.status).toUpperCase().includes("COMPLETE")
                      ? "border-green-500/30 bg-green-500/10 text-green-300"
                      : "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
                  }`}
                >
                  {b.status}
                </span>
              </div>
            ))}
            {(data?.batches ?? []).length === 0 && (
              <p className="text-sm text-zinc-500">No batches on file.</p>
            )}
          </div>
        </AdminPanel>
      </div>
    </main>
  );
}
