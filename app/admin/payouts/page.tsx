"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Filter,
  Gauge,
  Play,
  RefreshCw,
  ShieldAlert,
  Wallet,
  XCircle,
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

type Payout = {
  id: string;
  vendor_id: string;
  amount: number;
  status: string;
  method?: string | null;
  phone?: string | null;
  reference?: string | null;
  created_at?: string;
};

type QueueItem = {
  id: string;
  vendor_id: string;
  amount: number;
  status: string;
  priority?: number;
  created_at?: string;
};

type Overview = {
  empty: boolean;
  kpis: {
    pendingCount: number;
    pendingTotal: number;
    disbursedTotal: number;
    failedTotal: number;
    allTotal: number;
    queueDepth: number;
    queueTotal: number;
    treasuryBalance: number;
    feeRevenue: number;
  };
  payouts: Payout[];
  queue: QueueItem[];
  series: { day: string; volume: number; count: number }[];
  statusBreakdown: { status: string; count: number; amount: number }[];
  seedHint?: string;
};

type StatusFilter = "all" | "pending" | "completed" | "failed" | "processing";

const PENDING = new Set(["pending", "queued", "QUEUED", "RETRY_SCHEDULED"]);
const COMPLETED = new Set(["completed", "paid", "SENT", "sent"]);
const FAILED = new Set(["failed", "rejected", "FAILED", "BLOCKED"]);
const PROCESSING = new Set(["processing", "PROCESSING", "approved"]);

function statusTone(status: string) {
  const s = String(status);
  if (PENDING.has(s))
    return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
  if (COMPLETED.has(s))
    return "border-green-500/30 bg-green-500/10 text-green-300";
  if (FAILED.has(s)) return "border-red-500/30 bg-red-500/10 text-red-300";
  if (PROCESSING.has(s))
    return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";
  return "border-white/15 bg-white/5 text-zinc-300";
}

function matchesFilter(status: string, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "pending") return PENDING.has(status);
  if (filter === "completed") return COMPLETED.has(status);
  if (filter === "failed") return FAILED.has(status);
  if (filter === "processing") return PROCESSING.has(status);
  return true;
}

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

export default function PayoutAdminPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [acting, setActing] = useState<string | null>(null);
  const [workerMsg, setWorkerMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/payouts/overview", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Admin access required."
            : `Payouts overview failed (${res.status})`
        );
      }
      const json = (await res.json()) as Overview;
      setData(json);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load payouts");
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

  const filtered = useMemo(() => {
    const list = data?.payouts ?? [];
    return list.filter((p) => matchesFilter(String(p.status), filter));
  }, [data, filter]);

  async function runAction(
    action: "approve" | "reject" | "retry" | "block",
    payout_id: string,
    source: "payouts" | "queue" = "payouts"
  ) {
    setActing(`${source}:${payout_id}:${action}`);
    try {
      const res = await fetch("/api/admin/payouts/action", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payout_id, source }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Action failed (${res.status})`);
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  async function runWorker() {
    setWorkerMsg(null);
    try {
      const res = await fetch("/api/payouts/run", {
        method: "POST",
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Worker failed");
      setWorkerMsg(j.message ?? "Worker executed");
      await load();
    } catch (err) {
      setWorkerMsg(err instanceof Error ? err.message : "Worker failed");
    }
  }

  const kpis = data?.kpis;
  const hasChart =
    (data?.series ?? []).some((s) => s.volume > 0) ||
    (data?.statusBreakdown ?? []).length > 0;

  return (
    <main className="min-h-screen bg-black text-white px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 sm:gap-6">
          <div className="space-y-2 sm:space-y-3 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-300">
              <CreditCard className="h-3.5 w-3.5" />
              Payout Execution Center
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Payouts Queue
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Approve, reject, and dispatch vendor settlements. Live data from
              Supabase payouts, queue, and fee ledger — no synthetic KPIs.
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
            <button
              type="button"
              onClick={() => void runWorker()}
              className="inline-flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 hover:bg-green-500/20"
            >
              <Play className="h-4 w-4" />
              Run Worker
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

        {/* KPIs */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <KpiTile
            label="Pending"
            value={`KES ${(kpis?.pendingTotal ?? 0).toLocaleString()}`}
            helper={`${kpis?.pendingCount ?? 0} awaiting action`}
            href="#queue"
            tone="border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10"
            icon={CreditCard}
          />
          <KpiTile
            label="Disbursed"
            value={`KES ${(kpis?.disbursedTotal ?? 0).toLocaleString()}`}
            helper="Completed / paid"
            href="/admin/finance"
            tone="border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
            icon={Wallet}
          />
          <KpiTile
            label="Queue Depth"
            value={String(kpis?.queueDepth ?? 0)}
            helper={`KES ${(kpis?.queueTotal ?? 0).toLocaleString()} queued`}
            href="#worker-queue"
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={Gauge}
          />
          <KpiTile
            label="Treasury Cover"
            value={`KES ${(kpis?.treasuryBalance ?? 0).toLocaleString()}`}
            helper="Open treasury"
            href="/admin/treasury"
            tone="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
            icon={ShieldAlert}
          />
        </section>

        {data?.empty && (
          <div className="rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-amber-100">No payout data yet</h2>
            <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
              {data.seedHint ??
                "Run seed_demo_metrics.sql then seed_admin_finance.sql on the Heroku-linked Supabase project."}
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

        {/* Charts */}
        {!data?.empty && hasChart && (
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            <div className="xl:col-span-2 rounded-3xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-zinc-500 text-xs uppercase tracking-wider">
                    Volume
                  </div>
                  <h2 className="text-xl font-bold mt-1">14-day payout pulse</h2>
                </div>
              </div>
              <div className="h-[220px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.series ?? []}>
                    <defs>
                      <linearGradient id="payoutVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
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
                      dataKey="volume"
                      stroke="#22d3ee"
                      fill="url(#payoutVol)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5 sm:p-6">
              <div className="text-zinc-500 text-xs uppercase tracking-wider">
                Mix
              </div>
              <h2 className="text-xl font-bold mt-1 mb-4">Status breakdown</h2>
              <div className="h-[220px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.statusBreakdown ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="status" tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fill: "#a1a1aa", fontSize: 10 }} axisLine={false} width={36} />
                    <Tooltip
                      contentStyle={{
                        background: "#09090b",
                        border: "1px solid #27272a",
                        borderRadius: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="#34d399" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {/* Filters + table */}
        <section id="queue" className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-wider">
                Settlement ledger
              </div>
              <h2 className="text-2xl font-bold mt-1">Payouts</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-zinc-500" />
              {(
                [
                  "all",
                  "pending",
                  "processing",
                  "completed",
                  "failed",
                ] as StatusFilter[]
              ).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider border transition ${
                    filter === f
                      ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-200"
                      : "border-white/10 bg-black/40 text-zinc-400 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {loading && !data ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-black/40 p-10 text-center text-sm text-zinc-500">
              Syncing payouts…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 text-sm text-green-300">
              No payouts match this filter.
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-white/8">
                      <th className="pb-3 pr-3 font-semibold">Vendor</th>
                      <th className="pb-3 pr-3 font-semibold">Amount</th>
                      <th className="pb-3 pr-3 font-semibold">Status</th>
                      <th className="pb-3 pr-3 font-semibold">Method</th>
                      <th className="pb-3 pr-3 font-semibold">Created</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const canAct = PENDING.has(String(p.status));
                      return (
                        <tr
                          key={p.id}
                          id={p.id}
                          className="border-b border-white/5 hover:bg-white/[0.03]"
                        >
                          <td className="py-3.5 pr-3 font-mono text-xs text-zinc-300">
                            {p.vendor_id?.slice(0, 8) ?? "—"}
                          </td>
                          <td className="py-3.5 pr-3 font-semibold">
                            KES {Number(p.amount ?? 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 pr-3">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusTone(
                                String(p.status)
                              )}`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 pr-3 text-zinc-400">
                            {p.method ?? "—"}
                          </td>
                          <td className="py-3.5 pr-3 text-zinc-500 text-xs">
                            {p.created_at
                              ? new Date(p.created_at).toLocaleString()
                              : "—"}
                          </td>
                          <td className="py-3.5 text-right">
                            {canAct ? (
                              <div className="inline-flex gap-2">
                                <button
                                  type="button"
                                  disabled={acting !== null}
                                  onClick={() =>
                                    void runAction("approve", p.id, "payouts")
                                  }
                                  className="inline-flex items-center gap-1 rounded-xl border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-green-300 hover:bg-green-500/20 disabled:opacity-40"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={acting !== null}
                                  onClick={() =>
                                    void runAction("reject", p.id, "payouts")
                                  }
                                  className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-40"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-zinc-600">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3">
                {filtered.map((p) => {
                  const canAct = PENDING.has(String(p.status));
                  return (
                    <div
                      key={p.id}
                      id={p.id}
                      className="rounded-2xl border border-white/8 bg-black/40 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-bold">
                            KES {Number(p.amount ?? 0).toLocaleString()}
                          </div>
                          <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                            {p.vendor_id?.slice(0, 8)} · {p.method ?? "—"}
                          </div>
                        </div>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusTone(
                            String(p.status)
                          )}`}
                        >
                          {p.status}
                        </span>
                      </div>
                      {canAct && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={acting !== null}
                            onClick={() => void runAction("approve", p.id)}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-300"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={acting !== null}
                            onClick={() => void runAction("reject", p.id)}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {/* Worker queue */}
        <section
          id="worker-queue"
          className="rounded-3xl border border-white/8 bg-white/[0.03] p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-wider">
                Execution rail
              </div>
              <h2 className="text-2xl font-bold mt-1">Payout worker queue</h2>
            </div>
            <Link
              href="/admin/risk-dashboard"
              className="text-xs font-semibold text-red-300 inline-flex items-center gap-1 hover:underline"
            >
              Risk radar
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {(data?.queue ?? []).length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-sm text-zinc-500">
              Worker queue is empty.
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.queue ?? []).map((q) => (
                <div
                  key={q.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-white/8 bg-black/40 px-4 py-3"
                >
                  <div>
                    <div className="font-semibold">
                      KES {Number(q.amount ?? 0).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-zinc-500 font-mono">
                      {q.vendor_id?.slice(0, 8)} · priority {q.priority ?? 0}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusTone(
                        String(q.status)
                      )}`}
                    >
                      {q.status}
                    </span>
                    <button
                      type="button"
                      disabled={acting !== null}
                      onClick={() => void runAction("retry", q.id, "queue")}
                      className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-cyan-300"
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      disabled={acting !== null}
                      onClick={() => void runAction("block", q.id, "queue")}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300"
                    >
                      Block
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
