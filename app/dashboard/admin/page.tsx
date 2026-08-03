"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BrainCircuit,
  LayoutDashboard,
  RefreshCw,
  Wallet,
} from "lucide-react";
import {
  AdminEmptyState,
  AdminKpiTile,
  AdminPanel,
} from "@/components/admin/finance/AdminGlass";
import { ADMIN_KPI_LINKS } from "@/lib/nav/dashboards";

const EXEC_TILES = [
  {
    href: "/admin",
    label: "Mission Control",
    description: "Executive overview & KPIs",
    icon: LayoutDashboard,
    accent: "text-white",
  },
  {
    href: "/admin/live",
    label: "Live Ops",
    description: "Realtime streams & payment rails",
    icon: Activity,
    accent: "text-purple-300",
  },
  {
    href: "/admin/finance",
    label: "Financial Control",
    description: "Treasury, escrow, settlements",
    icon: Wallet,
    accent: "text-green-300",
  },
  {
    href: "/intelligence",
    label: "AI Intelligence",
    description: "Predictive risk & treasury signals",
    icon: BrainCircuit,
    accent: "text-fuchsia-300",
  },
];

type Overview = {
  revenue: number;
  payouts: number;
  pendingPayouts: { id: string; amount: number; status: string }[];
  fraud: { id: string; reason?: string }[];
  treasuryBalance: number;
};

export default function AdminFinanceDashboard() {
  const [stats, setStats] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/finance/overview", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Admin access required."
            : `Finance overview failed (${res.status})`
        );
      }
      setStats(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const empty =
    !!stats &&
    stats.revenue === 0 &&
    stats.payouts === 0 &&
    (stats.pendingPayouts?.length ?? 0) === 0 &&
    (stats.fraud?.length ?? 0) === 0 &&
    stats.treasuryBalance === 0;

  return (
    <main className="min-h-screen bg-black text-white px-3 sm:px-4 md:px-6 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl space-y-6 sm:space-y-8">
        <header className="relative overflow-hidden rounded-[32px] border border-white/8 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-72 h-72 bg-green-500/10 blur-3xl rounded-full" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/30 mb-2">
                Admin Infrastructure
              </p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                Executive Console
              </h1>
              <p className="text-zinc-400 mt-3 max-w-2xl text-sm leading-relaxed">
                Jump into mission control, live ops, treasury finance, and
                marketplace intelligence — live admin API data.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/10 self-start"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {EXEC_TILES.map(({ href, label, description, icon: Icon, accent }) => (
            <Link
              key={href}
              href={href}
              className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[0.03] p-5 backdrop-blur-xl hover:border-white/15 hover:bg-white/[0.06] transition-all"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/40 ${accent}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-600 group-hover:text-white transition" />
              </div>
              <div className="mt-4">
                <div className="text-base font-semibold text-white">{label}</div>
                <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                  {description}
                </p>
              </div>
            </Link>
          ))}
        </section>

        <section className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <AdminKpiTile
            label="Revenue"
            value={`KES ${(stats?.revenue ?? 0).toLocaleString()}`}
            helper="Fee ledger"
            href={ADMIN_KPI_LINKS.treasury}
            tone="border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
            icon={Wallet}
          />
          <AdminKpiTile
            label="Payouts"
            value={`KES ${(stats?.payouts ?? 0).toLocaleString()}`}
            helper="Lifetime disbursed"
            href={ADMIN_KPI_LINKS.payouts}
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={Activity}
          />
          <AdminKpiTile
            label="Pending"
            value={String(stats?.pendingPayouts?.length ?? 0)}
            helper="Queue depth"
            href="/admin/payouts"
            tone="border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10"
            icon={RefreshCw}
          />
          <AdminKpiTile
            label="Treasury"
            value={`KES ${(stats?.treasuryBalance ?? 0).toLocaleString()}`}
            helper="Operating + escrow"
            href="/admin/treasury"
            tone="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
            icon={LayoutDashboard}
          />
        </section>

        {empty && (
          <AdminEmptyState title="No executive finance data yet" />
        )}

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AdminPanel>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Pending Payouts</h2>
              <Link
                href={ADMIN_KPI_LINKS.payouts}
                className="text-xs text-cyan-300 inline-flex items-center gap-1 hover:underline"
              >
                Open queue <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            {(stats?.pendingPayouts ?? []).length === 0 ? (
              <p className="text-sm text-zinc-500">No pending payouts.</p>
            ) : (
              (stats?.pendingPayouts ?? []).slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between py-2 border-b border-white/5 last:border-0 text-sm"
                >
                  <span>KES {Number(p.amount).toLocaleString()}</span>
                  <span className="text-yellow-400">{p.status}</span>
                </div>
              ))
            )}
          </AdminPanel>

          <AdminPanel>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-red-300">Fraud Alerts</h2>
              <Link
                href={ADMIN_KPI_LINKS.fraud}
                className="text-xs text-red-300 inline-flex items-center gap-1 hover:underline"
              >
                Risk radar <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            {(stats?.fraud ?? []).length === 0 ? (
              <p className="text-sm text-zinc-500">No fraud alerts.</p>
            ) : (
              (stats?.fraud ?? []).slice(0, 8).map((f) => (
                <div
                  key={f.id}
                  className="text-sm border-b border-red-500/10 py-2 last:border-0"
                >
                  {f.reason ?? "Suspicious activity"}
                </div>
              ))
            )}
          </AdminPanel>
        </section>
      </div>
    </main>
  );
}
