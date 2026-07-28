"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BrainCircuit,
  CreditCard,
  Gauge,
  LayoutDashboard,
  Radar,
  ShieldAlert,
  Wallet,
} from "lucide-react";

import BalanceCards from "@/components/finance/BalanceCards";
import RevenueChart from "@/components/finance/RevenueChart";
import TransactionStream from "@/components/finance/TransactionStream";
import EscrowTimeline from "@/components/finance/EscrowTimeline";
import FraudCenter from "@/components/finance/FraudCenter";
import PayoutCenter from "@/components/finance/PayoutCenter";
import AuditExplorer from "@/components/finance/AuditExplorer";
import FinanceTimeline from "@/components/finance/FinanceTimeline";
import VendorFinanceCenter from "@/components/finance/VendorFinanceCenter";
import NotificationCenter from "@/components/finance/NotificationCenter";
import FinancePulsePanel from "@/components/finance/FinancePulsePanel";
import SystemHealthMini from "@/components/finance/SystemHealthMini";
import TreasuryFlowMap from "@/components/finance/TreasuryFlowMap";
import SettlementInsights from "@/components/finance/SettlementInsights";

const QUICK_LINKS = [
  {
    href: "/admin",
    label: "Mission Control",
    description: "Full admin command center",
    icon: LayoutDashboard,
    accent: "text-white",
  },
  {
    href: "/intelligence",
    label: "AI Intelligence",
    description: "Predictive risk & treasury signals",
    icon: BrainCircuit,
    accent: "text-fuchsia-300",
  },
  {
    href: "/admin/treasury",
    label: "Treasury",
    description: "Liquidity & exposure",
    icon: Gauge,
    accent: "text-amber-300",
  },
  {
    href: "/admin/payouts",
    label: "Payouts Queue",
    description: "Approve & schedule",
    icon: CreditCard,
    accent: "text-cyan-300",
  },
  {
    href: "/admin/risk-dashboard",
    label: "Risk Radar",
    description: "Vendor risk scoring",
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

export default function PlatformFinancePage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-green-300">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Platform Finance Layer
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Financial Control Center
            </h1>
            <p className="max-w-3xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Realtime treasury, escrow lifecycle, payout orchestration, fraud
              monitoring and settlement analytics — the same engine powering every
              vendor wallet, refund and reconciliation event across the marketplace.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
            <Link
              href="/admin/finance"
              className="inline-flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-semibold text-green-300 hover:bg-green-500/20"
            >
              <Wallet className="h-4 w-4" />
              Admin Finance
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/vendor/finance"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
            >
              Vendor Wallet View
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

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

        {/* KPI LAYER */}
        <section>
          <BalanceCards />
        </section>

        {/* MAIN GRID */}
        <section className="grid grid-cols-1 2xl:grid-cols-12 gap-6 items-start">
          <div className="2xl:col-span-8 space-y-6">
            <RevenueChart />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <TreasuryFlowMap />
              <SettlementInsights />
            </div>

            <EscrowTimeline />
          </div>

          <div className="2xl:col-span-4 space-y-6">
            <TransactionStream />
            <NotificationCenter />
            <FinancePulsePanel />
            <SystemHealthMini />
          </div>
        </section>

        {/* OPERATIONS */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PayoutCenter />
          <FraudCenter />
        </section>

        {/* ANALYTICS + COMPLIANCE */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AuditExplorer />
          <FinanceTimeline />
        </section>

        {/* VENDOR FINANCE */}
        <section>
          <VendorFinanceCenter />
        </section>
      </div>
    </main>
  );
}
