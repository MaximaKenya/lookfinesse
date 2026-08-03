"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowUpRight,
  CreditCard,
  Radar,
  RefreshCw,
  ShieldAlert,
  Snowflake,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { subscribeToRiskStream } from "@/lib/risk/realtimeRiskStream";
import {
  AdminEmptyState,
  AdminKpiTile,
  AdminPanel,
} from "@/components/admin/finance/AdminGlass";

type Overview = {
  empty: boolean;
  kpis: {
    vendorCount: number;
    highRiskCount: number;
    frozenCount: number;
    alertCount: number;
    avgRisk: number;
    queueDepth: number;
    watchedPayouts: number;
  };
  vendors: {
    vendor_id: string;
    risk_score: number;
    trust_tier?: string | null;
    is_frozen?: boolean;
  }[];
  fraud_events: {
    id: string;
    vendor_id?: string;
    event_type?: string;
    severity: string | number;
    reason: string;
    created_at?: string;
  }[];
  payouts: {
    id: string;
    vendor_id: string;
    amount: number;
    status: string;
  }[];
  riskBuckets: { label: string; count: number }[];
  seedHint?: string;
};

export default function RiskDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/risk/overview", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Admin access required."
            : `Risk overview failed (${res.status})`
        );
      }
      setData((await res.json()) as Overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load risk");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const channel = subscribeToRiskStream(() => {
      void load();
    });
    const id = setInterval(() => void load(), 20000);
    return () => {
      channel.unsubscribe();
      clearInterval(id);
    };
  }, [load]);

  async function controlPayout(action: string, payout_id: string) {
    setActing(`${payout_id}:${action}`);
    try {
      const res = await fetch("/api/admin/payouts/action", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "FORCE_RETRY" ? "retry" : "block",
          payout_id,
          source: "payouts",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Action failed");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActing(null);
    }
  }

  const kpis = data?.kpis;

  return (
    <main className="min-h-screen bg-black text-white px-3 sm:px-4 md:px-6 py-6 sm:py-8 overflow-x-hidden">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-300">
              <Radar className="h-3.5 w-3.5" />
              Risk Operations Center
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
              Risk Radar
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Vendor scores, fraud telemetry, and payout controls — live from
              Supabase risk tables.
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
              href="/admin/compliance"
              className="inline-flex items-center gap-2 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-4 py-2.5 text-sm font-semibold text-orange-200 hover:bg-orange-500/20"
            >
              <ShieldAlert className="h-4 w-4" />
              Compliance
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
            label="Avg Risk"
            value={String(kpis?.avgRisk ?? 0)}
            helper={`${kpis?.vendorCount ?? 0} vendors scored`}
            href="#vendors"
            tone="border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10"
            icon={Radar}
          />
          <AdminKpiTile
            label="High Risk"
            value={String(kpis?.highRiskCount ?? 0)}
            helper="Score ≥ 70"
            href="#vendors"
            tone="border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
            icon={ShieldAlert}
          />
          <AdminKpiTile
            label="Frozen"
            value={String(kpis?.frozenCount ?? 0)}
            helper="Payout freeze active"
            href="/admin/payouts"
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={Snowflake}
          />
          <AdminKpiTile
            label="Alerts"
            value={String(kpis?.alertCount ?? 0)}
            helper={`${kpis?.watchedPayouts ?? 0} watched payouts`}
            href="#alerts"
            tone="border-orange-500/20 bg-orange-500/5 hover:bg-orange-500/10"
            icon={CreditCard}
          />
        </section>

        {data?.empty && (
          <AdminEmptyState title="No risk telemetry yet" hint={data.seedHint} />
        )}

        {(data?.riskBuckets ?? []).some((b) => b.count > 0) && (
          <AdminPanel>
            <h2 className="text-lg font-bold mb-4">Risk distribution</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.riskBuckets ?? []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#09090b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="count" fill="#f87171" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AdminPanel>
        )}

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AdminPanel id="vendors">
            <h2 className="text-lg font-bold mb-4">Vendor risk scores</h2>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {(data?.vendors ?? []).map((v) => {
                const score = Number(v.risk_score ?? 0);
                const tone =
                  score > 70
                    ? "text-red-400"
                    : score > 40
                      ? "text-yellow-300"
                      : "text-green-400";
                return (
                  <div
                    key={v.vendor_id}
                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-black/40 px-4 py-3 gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {v.vendor_id.slice(0, 8)}…
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {v.trust_tier ?? "—"}
                        {v.is_frozen ? " · frozen" : ""}
                      </div>
                    </div>
                    <span className={`text-xl font-black ${tone}`}>{score}</span>
                  </div>
                );
              })}
              {(data?.vendors ?? []).length === 0 && (
                <p className="text-sm text-zinc-500">No vendor scores.</p>
              )}
            </div>
          </AdminPanel>

          <AdminPanel id="alerts">
            <h2 className="text-lg font-bold mb-4">Fraud events</h2>
            <div className="space-y-2 max-h-[420px] overflow-y-auto">
              {(data?.fraud_events ?? []).map((f) => (
                <div
                  key={f.id}
                  id={f.id}
                  className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3"
                >
                  <div className="text-sm font-semibold text-red-200">
                    {f.reason}
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500">
                    Severity {String(f.severity)} ·{" "}
                    {f.vendor_id?.slice(0, 8) ?? "—"}
                  </div>
                </div>
              ))}
              {(data?.fraud_events ?? []).length === 0 && (
                <p className="text-sm text-zinc-500">No fraud events.</p>
              )}
            </div>
          </AdminPanel>
        </section>

        <AdminPanel>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Watched payouts</h2>
            <Link
              href="/admin/payouts"
              className="text-xs text-cyan-300 inline-flex items-center gap-1 hover:underline"
            >
              Open queue <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {(data?.payouts ?? []).map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-white/8 bg-black/40 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold">
                    KES {Number(p.amount).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {p.vendor_id.slice(0, 8)} · {p.status}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={acting === `${p.id}:FORCE_RETRY`}
                    onClick={() => void controlPayout("FORCE_RETRY", p.id)}
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    disabled={acting === `${p.id}:BLOCK`}
                    onClick={() => void controlPayout("BLOCK", p.id)}
                    className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Block
                  </button>
                </div>
              </div>
            ))}
            {(data?.payouts ?? []).length === 0 && (
              <p className="text-sm text-zinc-500">No watched payouts.</p>
            )}
          </div>
        </AdminPanel>
      </div>
    </main>
  );
}
