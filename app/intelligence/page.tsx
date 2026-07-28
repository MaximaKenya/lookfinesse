"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowUpRight,
  Activity,
  BrainCircuit,
  CreditCard,
  Gauge,
  LayoutDashboard,
  Radar,
  ShieldAlert,
  Sparkles,
  Wallet,
} from "lucide-react";

import RealtimeEventFeed from "@/components/realtime/RealtimeEventFeed";
import AISystemCommand from "@/components/intelligence/AISystemCommand";
import AIDecisionTimeline from "@/components/intelligence/AIDecisionTimeline";
import AIAgentsPanel from "@/components/intelligence/AIAgentsPanel";
import MarketplaceHealthScore from "@/components/intelligence/MarketplaceHealthScore";
import ExecutiveModeToggle from "@/components/intelligence/ExecutiveModeToggle";
import VoiceOpsCopilot from "@/components/intelligence/VoiceOpsCopilot";
import VendorTrustPanel from "@/components/intelligence/VendorTrustPanel";
import TreasuryPressurePanel from "@/components/intelligence/TreasuryPressurePanel";
import SentimentOverview from "@/components/intelligence/SentimentOverview";

const chartLoading = () => (
  <div className="h-64 rounded-3xl bg-white/5 border border-white/8 animate-pulse" />
);

const LiveRiskRadar = dynamic(() => import("@/components/intelligence/LiveRiskRadar"), { loading: chartLoading });
const TreasuryForecastChart = dynamic(() => import("@/components/intelligence/TreasuryForecastChart"), { loading: chartLoading });
const FraudHeatmap = dynamic(() => import("@/components/intelligence/FraudHeatmap"), { loading: chartLoading });
const GlobalRiskMap = dynamic(() => import("@/components/intelligence/GlobalRiskMap"), { loading: chartLoading });
const TreasuryFlowNetwork = dynamic(() => import("@/components/intelligence/TreasuryFlowNetwork"), { loading: chartLoading });
const PredictiveFailureEngine = dynamic(() => import("@/components/intelligence/PredictiveFailureEngine"), { loading: chartLoading });
const PaymentRailMonitor = dynamic(() => import("@/components/intelligence/PaymentRailMonitor"), { loading: chartLoading });

const QUICK_ACTIONS = [
  {
    href: "/admin",
    label: "Mission Control",
    description: "Executive command",
    icon: LayoutDashboard,
    accent: "text-white",
  },
  {
    href: "/admin/live",
    label: "Live Ops",
    description: "Realtime streams",
    icon: Activity,
    accent: "text-purple-300",
  },
  {
    href: "/finance",
    label: "Financial Control",
    description: "Treasury & escrow",
    icon: Wallet,
    accent: "text-green-300",
  },
  {
    href: "/admin/risk-dashboard",
    label: "Risk Radar",
    description: "Vendor scoring",
    icon: Radar,
    accent: "text-red-300",
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
    label: "Payouts",
    description: "Approve & schedule",
    icon: CreditCard,
    accent: "text-cyan-300",
  },
];

export default function PlatformIntelligencePage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
              <Sparkles className="h-3.5 w-3.5" />
              Marketplace AI Intelligence
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Financial Intelligence Center
            </h1>
            <p className="max-w-3xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Autonomous treasury monitoring, fraud defense, vendor trust scoring
              and predictive failure analysis across every payment rail, wallet
              and live commerce session.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
            <ExecutiveModeToggle />
            <Link
              href="/admin/intelligence"
              className="inline-flex items-center gap-2 rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-2.5 text-sm font-semibold text-fuchsia-200 hover:bg-fuchsia-500/20"
            >
              <BrainCircuit className="h-4 w-4" />
              Ops Intelligence
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* QUICK ACTIONS */}
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ href, label, description, icon: Icon, accent }) => (
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

        <MarketplaceHealthScore />

        <SentimentOverview />

        <AISystemCommand />

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <TreasuryForecastChart />
          </div>
          <LiveRiskRadar />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <FraudHeatmap />
          <GlobalRiskMap />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <TreasuryFlowNetwork />
          <PredictiveFailureEngine />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <AIAgentsPanel />
          <PaymentRailMonitor />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <RealtimeEventFeed />
          <AIDecisionTimeline />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <VendorTrustPanel />
          <TreasuryPressurePanel />
        </section>

        {/* FOOTER CTA */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            href="/admin/compliance"
            className="group flex items-start gap-3 rounded-3xl border border-orange-500/20 bg-orange-500/5 p-5 hover:bg-orange-500/10"
          >
            <ShieldAlert className="h-5 w-5 text-orange-300" />
            <div>
              <div className="font-semibold">Compliance Center</div>
              <p className="text-xs text-zinc-400 mt-1">
                Run AML, sanctions and KYC reviews on the latest flagged events.
              </p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 text-zinc-500 group-hover:text-white" />
          </Link>
          <Link
            href="/admin/network"
            className="group flex items-start gap-3 rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-5 hover:bg-indigo-500/10"
          >
            <Activity className="h-5 w-5 text-indigo-300" />
            <div>
              <div className="font-semibold">Network Graph</div>
              <p className="text-xs text-zinc-400 mt-1">
                Visualize vendor / buyer relationships and detect collusion rings.
              </p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 text-zinc-500 group-hover:text-white" />
          </Link>
          <Link
            href="/intelligence#copilot"
            className="group flex items-start gap-3 rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-5 hover:bg-fuchsia-500/10"
          >
            <Sparkles className="h-5 w-5 text-fuchsia-300" />
            <div>
              <div className="font-semibold">Ask the Copilot</div>
              <p className="text-xs text-zinc-400 mt-1">
                Chat with the marketplace AI to investigate anomalies in plain English.
              </p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 text-zinc-500 group-hover:text-white" />
          </Link>
        </section>

        <div id="copilot">
          <VoiceOpsCopilot />
        </div>
      </div>
    </main>
  );
}
