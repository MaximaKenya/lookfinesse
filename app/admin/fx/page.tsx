"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Gauge,
  Globe,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
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
    pairCount: number;
    conversionCount: number;
    usdKes: number;
    treasuryFxExposure: number;
    last24hVolume: number;
  };
  rates: {
    id: string;
    pair: string;
    rate: number;
    base: string;
    quote: string;
    source: string;
  }[];
  conversions: {
    id: string;
    amount: number;
    from_currency: string;
    to_currency: string;
    rate: number;
    converted_amount: number;
    created_at?: string;
  }[];
  series: { day: string; volume: number; count: number }[];
  seedHint?: string;
};

export default function FxDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(1000);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("KES");
  const [result, setResult] = useState<{
    converted: number;
    rate: number;
  } | null>(null);
  const [converting, setConverting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/fx/overview", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Admin access required."
            : `FX overview failed (${res.status})`
        );
      }
      setData((await res.json()) as Overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load FX");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 30000);
    return () => clearInterval(id);
  }, [load]);

  async function convert() {
    setConverting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/fx/convert", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, from, to }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Convert failed");
      setResult({ converted: json.converted, rate: json.rate });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Convert failed");
    } finally {
      setConverting(false);
    }
  }

  const kpis = data?.kpis;
  const hasChart = (data?.series ?? []).some((s) => s.volume > 0);

  return (
    <main className="min-h-screen bg-black text-white px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              <Globe className="h-3.5 w-3.5" />
              Global FX Operations
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              FX Engine
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Live rate board, treasury FX exposure, and conversion history —
              backed by Supabase, not synthetic KPIs.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/admin/treasury"
              className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
            >
              <Gauge className="h-4 w-4" />
              Treasury
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
            label="USD / KES"
            value={String(kpis?.usdKes ?? "—")}
            helper={`${kpis?.pairCount ?? 0} pairs`}
            href="#rates"
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={Globe}
          />
          <AdminKpiTile
            label="24h Volume"
            value={`KES ${(kpis?.last24hVolume ?? 0).toLocaleString()}`}
            helper={`${kpis?.conversionCount ?? 0} conversions`}
            href="#history"
            tone="border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
            icon={ArrowLeftRight}
          />
          <AdminKpiTile
            label="FX Exposure"
            value={`KES ${(kpis?.treasuryFxExposure ?? 0).toLocaleString()}`}
            helper="Non-KES treasury"
            href="/admin/treasury"
            tone="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
            icon={Wallet}
          />
          <AdminKpiTile
            label="Network"
            value="Settlement"
            helper="Payment rails"
            href="/admin/network"
            tone="border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10"
            icon={Gauge}
          />
        </section>

        {data?.empty && (
          <AdminEmptyState title="No FX history yet" hint={data.seedHint} />
        )}

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <AdminPanel className="xl:col-span-1 space-y-4">
            <h2 className="text-lg font-bold">Quick convert</h2>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/40"
              placeholder="Amount"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value.toUpperCase())}
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/40"
                placeholder="From"
              />
              <input
                value={to}
                onChange={(e) => setTo(e.target.value.toUpperCase())}
                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/40"
                placeholder="To"
              />
            </div>
            <button
              type="button"
              onClick={() => void convert()}
              disabled={converting}
              className="w-full rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300 hover:bg-green-500/20 disabled:opacity-50"
            >
              {converting ? "Converting…" : "Convert"}
            </button>
            {result && (
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm">
                <div className="text-zinc-400 text-xs uppercase tracking-wider">
                  Result @ {result.rate}
                </div>
                <div className="mt-1 text-2xl font-black text-cyan-200">
                  {result.converted.toLocaleString()} {to}
                </div>
              </div>
            )}
          </AdminPanel>

          <AdminPanel className="xl:col-span-2" id="rates">
            <h2 className="text-lg font-bold mb-4">Rate board</h2>
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {(data?.rates ?? []).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/40 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-semibold">{r.pair.replace("_", " → ")}</div>
                    <div className="text-[11px] text-zinc-500">{r.source}</div>
                  </div>
                  <div className="text-lg font-black text-cyan-200">
                    {r.rate.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </div>
                </div>
              ))}
              {!loading && (data?.rates ?? []).length === 0 && (
                <p className="text-sm text-zinc-500">No rates loaded.</p>
              )}
            </div>
          </AdminPanel>
        </section>

        {hasChart && (
          <AdminPanel>
            <h2 className="text-lg font-bold mb-4">14-day conversion volume</h2>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.series ?? []}>
                  <defs>
                    <linearGradient id="fxVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
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
                    stroke="#22d3ee"
                    fill="url(#fxVol)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </AdminPanel>
        )}

        <AdminPanel id="history">
          <h2 className="text-lg font-bold mb-4">Recent conversions</h2>
          <div className="space-y-2">
            {(data?.conversions ?? []).slice(0, 15).map((c) => (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-2xl border border-white/8 bg-black/40 px-4 py-3"
              >
                <div className="text-sm">
                  <span className="font-semibold">
                    {Number(c.amount).toLocaleString()} {c.from_currency}
                  </span>
                  <span className="text-zinc-500"> → </span>
                  <span className="font-semibold text-cyan-200">
                    {Number(c.converted_amount).toLocaleString()} {c.to_currency}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500">
                  rate {Number(c.rate).toLocaleString()} ·{" "}
                  {c.created_at
                    ? new Date(c.created_at).toLocaleString()
                    : "—"}
                </div>
              </div>
            ))}
            {(data?.conversions ?? []).length === 0 && (
              <p className="text-sm text-zinc-500">
                No conversions logged yet — use Quick convert above.
              </p>
            )}
          </div>
        </AdminPanel>
      </div>
    </main>
  );
}
