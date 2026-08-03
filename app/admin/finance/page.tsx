"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Coins,
  CreditCard,
  Gauge,
  Globe,
  Radar,
  ShieldAlert,
  Wallet,
} from "lucide-react";

type Payout = {
  id: string;
  amount: number;
  status: string;
  vendor_id?: string;
  created_at?: string;
};

type Fraud = {
  id: string;
  reason?: string;
  amount?: number;
  created_at?: string;
};

type Stats = {
  revenue: number;
  payouts: number;
  pendingPayouts: Payout[];
  fraud: Fraud[];
  treasuryBalance: number;
  loading: boolean;
};

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
      className={`group rounded-3xl border p-6 transition-all ${tone}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-zinc-400">
            {label}
          </div>
          <div className="mt-3 text-3xl font-black text-white">{value}</div>
          <div className="mt-1 text-[11px] text-zinc-500 inline-flex items-center gap-1">
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

const QUICK_LINKS = [
  {
    href: "/finance",
    label: "Financial Control",
    description: "Treasury, escrow & settlements",
    icon: Coins,
    accent: "text-green-300",
  },
  {
    href: "/admin/payouts",
    label: "Payouts Queue",
    description: "Approve & schedule",
    icon: CreditCard,
    accent: "text-cyan-300",
  },
  {
    href: "/admin/treasury",
    label: "Treasury",
    description: "Liquidity & exposure",
    icon: Gauge,
    accent: "text-amber-300",
  },
  {
    href: "/admin/fx",
    label: "FX Engine",
    description: "Rates & hedging",
    icon: Globe,
    accent: "text-cyan-200",
  },
  {
    href: "/admin/risk-dashboard",
    label: "Risk Radar",
    description: "Vendor scoring",
    icon: Radar,
    accent: "text-red-300",
  },
  {
    href: "/admin/compliance",
    label: "Compliance",
    description: "AML & sanctions",
    icon: ShieldAlert,
    accent: "text-orange-300",
  },
];

export default function AdminFinanceDashboard() {
  const [stats, setStats] = useState<Stats>({
    revenue: 0,
    payouts: 0,
    pendingPayouts: [],
    fraud: [],
    treasuryBalance: 0,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Server admin API — service-role when configured; never client RLS zeros
        const res = await fetch("/api/admin/finance/overview", {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`finance overview ${res.status}`);
        }
        const data = await res.json();
        if (!mounted) return;
        setStats({
          revenue: Number(data.revenue ?? 0),
          payouts: Number(data.payouts ?? 0),
          pendingPayouts: (data.pendingPayouts ?? []) as Payout[],
          fraud: (data.fraud ?? []) as Fraud[],
          treasuryBalance: Number(data.treasuryBalance ?? 0),
          loading: false,
        });
      } catch (err) {
        console.error("Admin finance load failed", err);
        if (mounted)
          setStats((s) => ({
            ...s,
            loading: false,
          }));
      }
    }

    load();
    const id = setInterval(load, 20000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const pendingTotal = stats.pendingPayouts.reduce(
    (sum, p) => sum + Number(p.amount ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <Coins className="h-3.5 w-3.5" />
              Admin Finance Control
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Platform Finance Dashboard
            </h1>
            <p className="max-w-2xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Live platform revenue, payouts, fraud telemetry and treasury
              levers. Every tile links into the relevant operational console.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
            <Link
              href="/finance"
              className="inline-flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 hover:bg-green-500/20"
            >
              <Wallet className="h-4 w-4" />
              Open Financial Control Center
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/intelligence"
              className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-2.5 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-500/20"
            >
              <BrainCircuit className="h-4 w-4" />
              Intelligence
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiTile
            label="Platform Revenue"
            value={`KES ${stats.revenue.toLocaleString()}`}
            helper="Fee ledger total"
            href="/finance"
            tone="border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
            icon={Wallet}
          />
          <KpiTile
            label="Payouts Disbursed"
            value={`KES ${stats.payouts.toLocaleString()}`}
            helper="Lifetime"
            href="/admin/payouts"
            tone="border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
            icon={CreditCard}
          />
          <KpiTile
            label="Pending Payouts"
            value={`KES ${pendingTotal.toLocaleString()}`}
            helper={`${stats.pendingPayouts.length} items waiting`}
            href="/admin/payouts"
            tone="border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10"
            icon={Gauge}
          />
          <KpiTile
            label="Treasury Balance"
            value={`KES ${stats.treasuryBalance.toLocaleString()}`}
            helper={`${stats.fraud.length} fraud alerts`}
            href="/admin/treasury"
            tone="border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
            icon={ShieldAlert}
          />
        </section>

        {/* QUICK LINKS */}
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {QUICK_LINKS.map(({ href, label, description, icon: Icon, accent }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-4 hover:bg-white/[0.07] hover:border-white/15 transition-all"
            >
              <Icon className={`h-5 w-5 ${accent}`} />
              <div className="mt-3 text-sm font-semibold text-white">{label}</div>
              <div className="mt-1 text-[11px] text-zinc-500 leading-snug">
                {description}
              </div>
              <ArrowUpRight className="mt-3 h-3.5 w-3.5 text-zinc-600 group-hover:text-white" />
            </Link>
          ))}
        </section>

        {/* PENDING + FRAUD */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-zinc-500 text-xs uppercase tracking-wider">
                  Pending Payouts
                </div>
                <h2 className="text-2xl font-bold mt-1">
                  Awaiting approval
                </h2>
              </div>
              <Link
                href="/admin/payouts"
                className="text-cyan-300 text-xs font-semibold inline-flex items-center gap-1 hover:underline"
              >
                Open queue
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {stats.loading ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/40 p-8 text-center text-sm text-zinc-500">
                Syncing payouts…
              </div>
            ) : stats.pendingPayouts.length === 0 ? (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 text-sm text-green-300">
                Queue clear — no pending payouts.
              </div>
            ) : (
              <div className="space-y-2">
                {stats.pendingPayouts.slice(0, 10).map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin/payouts#${p.id}`}
                    className="group flex items-center justify-between rounded-2xl border border-white/8 bg-black/40 px-4 py-3 hover:bg-white/5"
                  >
                    <div>
                      <div className="text-sm font-semibold">
                        KES {Number(p.amount ?? 0).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Vendor {p.vendor_id?.slice(0, 8) ?? "—"}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-yellow-300">
                      {p.status}
                      <ArrowUpRight className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-zinc-500 text-xs uppercase tracking-wider">
                  Fraud Telemetry
                </div>
                <h2 className="text-2xl font-bold mt-1">Recent alerts</h2>
              </div>
              <Link
                href="/admin/risk-dashboard"
                className="text-red-300 text-xs font-semibold inline-flex items-center gap-1 hover:underline"
              >
                <Radar className="h-3.5 w-3.5" />
                Risk Radar
              </Link>
            </div>

            {stats.loading ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-black/40 p-8 text-center text-sm text-zinc-500">
                Syncing fraud logs…
              </div>
            ) : stats.fraud.length === 0 ? (
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-6 text-sm text-green-300">
                No fraud alerts on file — defenses are quiet.
              </div>
            ) : (
              <div className="space-y-2">
                {stats.fraud.slice(0, 10).map((f) => (
                  <Link
                    key={f.id}
                    href={`/admin/risk-dashboard#${f.id}`}
                    className="group block rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 hover:bg-red-500/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-red-200 flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {f.reason ?? "Suspicious activity"}
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white" />
                    </div>
                    {f.amount && (
                      <div className="text-[11px] text-zinc-500 mt-1">
                        KES {Number(f.amount).toLocaleString()}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
