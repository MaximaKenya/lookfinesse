"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Coins,
  CreditCard,
  Droplets,
  Gauge,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Account = {
  id: string;
  name: string;
  currency: string;
  balance: number;
  account_type?: string | null;
  updated_at?: string;
};

type Pool = {
  id: string;
  name: string;
  currency: string;
  balance: number;
  target_balance?: number | null;
  status?: string | null;
};

type Forecast = {
  id: string;
  currency: string;
  forecast_amount: number;
  horizon_days?: number | null;
  confidence?: number | null;
  created_at?: string;
};

type Overview = {
  empty: boolean;
  kpis: {
    totalTreasury: number;
    totalLiquidity: number;
    targetLiquidity: number;
    pendingOutflow: number;
    nextForecast: number;
    coverage: number | null;
    accountCount: number;
    poolCount: number;
  };
  accounts: Account[];
  pools: Pool[];
  forecasts: Forecast[];
  accountBreakdown: {
    name: string;
    balance: number;
    currency: string;
    type: string;
  }[];
  poolHealth: {
    id: string;
    name: string;
    balance: number;
    target: number;
    pct: number;
    status: string;
    currency: string;
  }[];
  series: { day: string; inflow: number; outflow: number }[];
  seedHint?: string;
};

const PIE_COLORS = ["#34d399", "#22d3ee", "#fbbf24", "#a78bfa", "#f472b6"];

function KpiTile({
  label,
  value,
  href,
  helper,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  href: string;
  helper: string;
  tone: string;
  icon: React.ElementType;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-3xl border p-5 sm:p-6 transition-all ${tone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-zinc-400">
            {label}
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-white truncate">
            {value}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500 inline-flex items-center gap-1">
            {helper}
            <ArrowUpRight className="h-3 w-3 text-zinc-600 group-hover:text-white transition" />
          </div>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-black/40 border border-white/10">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Link>
  );
}

export default function TreasuryDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [poolFilter, setPoolFilter] = useState<"all" | "active" | "low">("all");

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/treasury/overview", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Admin access required."
            : `Treasury overview failed (${res.status})`
        );
      }
      const json = (await res.json()) as Overview;
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load treasury");
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

  const kpis = data?.kpis;
  const filteredPools = (data?.poolHealth ?? []).filter((p) => {
    if (poolFilter === "all") return true;
    if (poolFilter === "active") return p.status === "active";
    return p.pct < 80;
  });

  const hasFlowChart = (data?.series ?? []).some(
    (s) => s.inflow > 0 || s.outflow > 0
  );
  const hasPie = (data?.accountBreakdown ?? []).some((a) => a.balance > 0);

  return (
    <main className="min-h-screen bg-black text-white px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <Gauge className="h-3.5 w-3.5" />
              Treasury Operations
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Liquidity & Exposure
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Operating balances, M-Pesa float, escrow pools and payout
              forecasts — wired to Supabase treasury tables, not placeholders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              href="/admin/payouts"
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/20"
            >
              <CreditCard className="h-4 w-4" />
              Payouts
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/admin/finance"
              className="inline-flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 hover:bg-green-500/20"
            >
              <Coins className="h-4 w-4" />
              Finance
            </Link>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <KpiTile
            label="Treasury"
            value={`KES ${(kpis?.totalTreasury ?? 0).toLocaleString()}`}
            helper={`${kpis?.accountCount ?? 0} accounts`}
            href="#accounts"
            tone="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
            icon={Wallet}
          />
          <KpiTile
            label="Liquidity"
            value={`KES ${(kpis?.totalLiquidity ?? 0).toLocaleString()}`}
            helper={`Target ${(kpis?.targetLiquidity ?? 0).toLocaleString()}`}
            href="#pools"
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={Droplets}
          />
          <KpiTile
            label="Pending Outflow"
            value={`KES ${(kpis?.pendingOutflow ?? 0).toLocaleString()}`}
            helper="Open payouts queue"
            href="/admin/payouts"
            tone="border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10"
            icon={CreditCard}
          />
          <KpiTile
            label="Forecast Cover"
            value={
              kpis?.coverage != null ? `${kpis.coverage}%` : "—"
            }
            helper={
              kpis?.nextForecast
                ? `Next FC KES ${kpis.nextForecast.toLocaleString()}`
                : "No forecast yet"
            }
            href="#forecasts"
            tone="border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
            icon={TrendingUp}
          />
        </section>

        {data?.empty && (
          <div className="rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-amber-100">
              Treasury not seeded
            </h2>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              {data.seedHint ??
                "Run seed_demo_metrics.sql then seed_admin_finance.sql to create treasury_accounts, liquidity_pools, and payout_forecasts."}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/admin/finance"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/10"
              >
                Admin Finance
              </Link>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 hover:bg-amber-500/20"
              >
                Open Supabase SQL
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

        {!data?.empty && (hasFlowChart || hasPie) && (
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            <div className="xl:col-span-2 rounded-3xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-4">
                <div className="text-zinc-500 text-xs uppercase tracking-wider">
                  Ledger pulse
                </div>
                <h2 className="text-xl font-bold mt-1">14-day inflow / outflow</h2>
              </div>
              <div className="h-[240px] w-full min-w-0">
                {hasFlowChart ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.series ?? []}>
                      <defs>
                        <linearGradient id="tin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="tout" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#f87171" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="day" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} />
                      <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} width={48} />
                      <Tooltip
                        contentStyle={{
                          background: "#09090b",
                          border: "1px solid #27272a",
                          borderRadius: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="inflow"
                        stroke="#34d399"
                        fill="url(#tin)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="outflow"
                        stroke="#f87171"
                        fill="url(#tout)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-zinc-500">
                    No ledger movement in the last 14 days.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-4">
                <div className="text-zinc-500 text-xs uppercase tracking-wider">
                  Allocation
                </div>
                <h2 className="text-xl font-bold mt-1">Account mix</h2>
              </div>
              <div className="h-[240px] w-full min-w-0">
                {hasPie ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.accountBreakdown ?? []}
                        dataKey="balance"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {(data?.accountBreakdown ?? []).map((_, i) => (
                          <Cell
                            key={i}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "#09090b",
                          border: "1px solid #27272a",
                          borderRadius: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-zinc-500">
                    No account balances.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Accounts */}
        <section
          id="accounts"
          className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 sm:p-6"
        >
          <div className="mb-5">
            <div className="text-zinc-500 text-xs uppercase tracking-wider">
              Capital
            </div>
            <h2 className="text-2xl font-bold mt-1">Treasury accounts</h2>
          </div>

          {loading && !data ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/40 p-10 text-center text-sm text-zinc-500">
              Syncing treasury…
            </div>
          ) : (data?.accounts ?? []).length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-zinc-500">
              No treasury accounts — run seed_admin_finance.sql.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {(data?.accounts ?? []).map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl border border-white/8 bg-black/40 p-5 hover:bg-white/[0.04] transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {a.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1 uppercase tracking-wider">
                        {a.account_type ?? "operating"} · {a.currency}
                      </div>
                    </div>
                    <Wallet className="h-4 w-4 text-amber-300" />
                  </div>
                  <div className="mt-4 text-2xl font-black text-green-300">
                    {a.currency} {Number(a.balance ?? 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pools */}
        <section
          id="pools"
          className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-wider">
                Float
              </div>
              <h2 className="text-2xl font-bold mt-1">Liquidity pools</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "active", "low"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setPoolFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider border transition ${
                    poolFilter === f
                      ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-200"
                      : "border-white/10 bg-black/40 text-zinc-400 hover:text-white"
                  }`}
                >
                  {f === "low" ? "Below 80%" : f}
                </button>
              ))}
            </div>
          </div>

          {filteredPools.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-zinc-500">
              No pools match this filter.
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-white/8">
                      <th className="pb-3 pr-3 font-semibold">Pool</th>
                      <th className="pb-3 pr-3 font-semibold">Balance</th>
                      <th className="pb-3 pr-3 font-semibold">Target</th>
                      <th className="pb-3 pr-3 font-semibold">Health</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPools.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-white/5 hover:bg-white/[0.03]"
                      >
                        <td className="py-3.5 pr-3 font-semibold">{p.name}</td>
                        <td className="py-3.5 pr-3 text-cyan-300">
                          {p.currency} {p.balance.toLocaleString()}
                        </td>
                        <td className="py-3.5 pr-3 text-zinc-400">
                          {p.currency} {p.target.toLocaleString()}
                        </td>
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  p.pct >= 80
                                    ? "bg-green-400"
                                    : p.pct >= 50
                                      ? "bg-yellow-400"
                                      : "bg-red-400"
                                }`}
                                style={{ width: `${Math.min(100, p.pct)}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-zinc-400 w-10">
                              {p.pct}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {filteredPools.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-white/8 bg-black/40 p-4 space-y-3"
                  >
                    <div className="flex justify-between gap-3">
                      <div className="font-semibold">{p.name}</div>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                        {p.status}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-cyan-300">
                      {p.currency} {p.balance.toLocaleString()}
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className={`h-full ${
                          p.pct >= 80
                            ? "bg-green-400"
                            : p.pct >= 50
                              ? "bg-yellow-400"
                              : "bg-red-400"
                        }`}
                        style={{ width: `${Math.min(100, p.pct)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {p.pct}% of target {p.target.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {(data?.poolHealth ?? []).some((p) => p.balance > 0) && (
                <div className="mt-6 h-[180px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.poolHealth ?? []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} />
                      <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} width={48} />
                      <Tooltip
                        contentStyle={{
                          background: "#09090b",
                          border: "1px solid #27272a",
                          borderRadius: 12,
                        }}
                      />
                      <Bar dataKey="balance" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="target" fill="#3f3f46" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </section>

        {/* Forecasts */}
        <section
          id="forecasts"
          className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-wider">
                Outlook
              </div>
              <h2 className="text-2xl font-bold mt-1">Payout forecasts</h2>
            </div>
            <Link
              href="/admin/intelligence"
              className="text-xs font-semibold text-fuchsia-300 inline-flex items-center gap-1 hover:underline"
            >
              Intelligence
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {(data?.forecasts ?? []).length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-zinc-500">
              No forecasts — seed_admin_finance.sql inserts 7-day and 30-day rows.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(data?.forecasts ?? []).map((f) => {
                const conf = Number(f.confidence ?? 0);
                const confPct = conf <= 1 ? Math.round(conf * 100) : Math.round(conf);
                return (
                  <div
                    key={f.id}
                    className="rounded-2xl border border-white/8 bg-black/40 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-zinc-500">
                          {f.horizon_days ?? "—"}-day horizon
                        </div>
                        <div className="mt-2 text-2xl font-black text-white">
                          {f.currency}{" "}
                          {Number(f.forecast_amount ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <span className="inline-flex rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-semibold text-yellow-300">
                        {confPct}% conf
                      </span>
                    </div>
                    {f.created_at && (
                      <div className="mt-3 text-[11px] text-zinc-600">
                        Updated {new Date(f.created_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
