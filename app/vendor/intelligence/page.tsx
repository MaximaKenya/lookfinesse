"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BrainCircuit,
  Gauge,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import VendorTrustPanel from "@/components/intelligence/VendorTrustPanel";
import SentimentOverview from "@/components/intelligence/SentimentOverview";
import { usePlatformSubscription } from "@/hooks/usePlatformSubscription";

const chartSk = () => (
  <div className="h-56 rounded-3xl bg-white/5 border border-white/8 animate-pulse" />
);

const VendorRiskTrajectory = dynamic(
  () => import("@/components/intelligence/VendorRiskTrajectory"),
  { loading: chartSk }
);
const RiskHeatmap = dynamic(() => import("@/components/intelligence/RiskHeatmap"), { loading: chartSk });
const LiveRiskRadar = dynamic(() => import("@/components/intelligence/LiveRiskRadar"), { loading: chartSk });
const PredictiveFailureEngine = dynamic(
  () => import("@/components/intelligence/PredictiveFailureEngine"),
  { loading: chartSk }
);

type VendorIntel = {
  vendorId?: string;
  trustScore?: number;
  riskScore?: number;
  fraudFlags?: number;
  payoutVelocity?: number;
  suggestions?: { title: string; description: string; href: string; tone: "info" | "warn" | "ok" }[];
  signals?: { name: string; risk: number }[];
};

function KpiCard({
  label,
  value,
  helper,
  href,
  tone = "cyan",
}: {
  label: string;
  value: string;
  helper: string;
  href: string;
  tone?: "green" | "red" | "yellow" | "cyan" | "fuchsia";
}) {
  const toneClass = {
    green: "text-green-300 border-green-500/20 bg-green-500/5 hover:bg-green-500/10",
    red: "text-red-300 border-red-500/20 bg-red-500/5 hover:bg-red-500/10",
    yellow: "text-yellow-300 border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10",
    cyan: "text-cyan-300 border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10",
    fuchsia: "text-fuchsia-300 border-fuchsia-500/20 bg-fuchsia-500/5 hover:bg-fuchsia-500/10",
  }[tone];

  return (
    <Link
      href={href}
      className={`group rounded-3xl border p-5 transition-all ${toneClass}`}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-zinc-400">
        <span>{label}</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-white" />
      </div>
      <div className="mt-3 text-3xl font-black text-white">{value}</div>
      <div className="mt-2 text-xs text-zinc-400">{helper}</div>
    </Link>
  );
}

export default function VendorIntelligencePage() {
  const { tier, entitlements, active, isAdmin } = usePlatformSubscription();
  const [intel, setIntel] = useState<VendorIntel | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Try the vendor-trust endpoint; fall back gracefully if missing.
        const trustRes = await fetch("/api/intelligence/vendor-trust").catch(() => null);
        const riskRes = await fetch("/api/intelligence/vendor-risk").catch(() => null);

        const trustJson = trustRes && trustRes.ok ? await trustRes.json() : [];
        const riskJson = riskRes && riskRes.ok ? await riskRes.json() : { vendors: [] };

        const first = Array.isArray(trustJson) && trustJson.length ? trustJson[0] : null;
        const signals = (riskJson.vendors || []).slice(0, 6).map((v: { name?: string; vendor_id?: string; risk?: number }) => ({
          name: v.name ?? v.vendor_id ?? "Vendor",
          risk: Number(v.risk ?? 0),
        }));

        const suggestions: VendorIntel["suggestions"] = [
          {
            title: "Boost a high-margin product",
            description: "Promote your top product into the For-You feed.",
            href: "/dashboard/create-product",
            tone: "info",
          },
          {
            title: "Re-stock low inventory",
            description: "Visit Product Studio to restock SKUs running low.",
            href: "/vendor/products",
            tone: "warn",
          },
          {
            title: "Request payout",
            description: "Available balance ready to withdraw to M-Pesa or bank.",
            href: "/dashboard/vendor/wallet",
            tone: "ok",
          },
          {
            title: "Verify KYC tier",
            description: "Higher tiers unlock larger payout limits and instant settlement.",
            href: "/dashboard/vendor/kyc",
            tone: "info",
          },
        ];

        if (!mounted) return;
        setIntel({
          vendorId: first?.vendor_id,
          trustScore: first ? Math.round(Number(first.trust_score ?? 0)) : undefined,
          riskScore: first ? Math.round(Number(first.treasury_risk ?? 0)) : undefined,
          fraudFlags: Number(first?.fraud_flags ?? 0),
          payoutVelocity: first ? Number(first.payout_velocity ?? 0) : undefined,
          suggestions,
          signals,
        });
      } catch (err) {
        if (!mounted) return;
        setIntel({
          trustScore: undefined,
          riskScore: undefined,
          fraudFlags: 0,
          payoutVelocity: undefined,
          suggestions: [
            {
              title: "Create your first product",
              description: "List a product to start generating trust signals.",
              href: "/dashboard/create-product",
              tone: "info",
            },
            {
              title: "Complete KYC",
              description: "Verify your identity to unlock higher payout limits.",
              href: "/dashboard/vendor/kyc",
              tone: "warn",
            },
          ],
          signals: [],
        });
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-300">
              <Sparkles className="h-3.5 w-3.5" />
              Vendor Intelligence
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Your AI Growth Brain
            </h1>
            <p className="max-w-3xl text-sm md:text-base text-zinc-400 leading-relaxed">
              Trust scoring, risk telemetry, payout health and AI suggestions
              tuned to your storefront. Click any signal to act on it instantly.
            </p>
            <p className="text-xs text-amber-200/80 border border-amber-500/20 bg-amber-500/10 rounded-xl px-3 py-2 inline-block">
              Analytics window: last {entitlements.analyticsDays} days
              {tier ? ` (${tier}${active ? "" : " — inactive"})` : " (starter)"}.
              {!isAdmin && entitlements.analyticsDays < 90
                ? " Upgrade to Pro for 90-day history."
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
            <Link
              href="/intelligence"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10"
            >
              <BrainCircuit className="h-4 w-4" />
              Marketplace Intelligence
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        {/* KPI */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Trust Score"
            value={intel?.trustScore != null ? `${intel.trustScore}` : "—"}
            helper="Higher unlocks instant payouts"
            href="/dashboard/vendor/kyc"
            tone="green"
          />
          <KpiCard
            label="Risk Score"
            value={`${intel?.riskScore ?? "—"}`}
            helper="Lower = safer treasury"
            href="/vendor/finance"
            tone="red"
          />
          <KpiCard
            label="Fraud Flags"
            value={`${intel?.fraudFlags ?? 0}`}
            helper="Review flagged orders"
            href="/vendor/orders"
            tone="yellow"
          />
          <KpiCard
            label="Payout Velocity"
            value={intel?.payoutVelocity != null ? `${intel.payoutVelocity}%` : "—"}
            helper="On-time disbursement rate"
            href="/dashboard/vendor/wallet"
            tone="cyan"
          />
        </section>

        {/* Commerce KPIs */}
        <section className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          <KpiCard
            label="Feed Posts"
            value="View"
            helper="Create & track social content"
            href="/feed"
            tone="fuchsia"
          />
          <KpiCard
            label="Products"
            value="Manage"
            helper="Inventory, pricing & listings"
            href="/vendor/products"
            tone="cyan"
          />
          <KpiCard
            label="Orders"
            value="Fulfill"
            helper="Shipments, disputes & refunds"
            href="/vendor/orders"
            tone="green"
          />
        </section>

        <SentimentOverview compact />

        {/* AI SUGGESTIONS */}
        <section className="rounded-3xl border border-white/8 bg-zinc-950/60 p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-zinc-500 text-xs uppercase tracking-wider">
                AI Suggestions
              </div>
              <h2 className="text-2xl font-bold mt-1">Recommended next moves</h2>
            </div>
            <Sparkles className="h-5 w-5 text-yellow-300" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {intel?.suggestions?.map((s, i) => (
              <Link
                key={i}
                href={s.href}
                className={`group rounded-2xl border p-4 transition-all ${
                  s.tone === "warn"
                    ? "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10"
                    : s.tone === "ok"
                    ? "border-green-500/20 bg-green-500/5 hover:bg-green-500/10"
                    : "border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    {s.title}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white" />
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  {s.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* INTEL GRID */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <VendorTrustPanel />
          <VendorRiskTrajectory />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {intel?.signals && intel.signals.length > 0 ? (
            <RiskHeatmap vendors={intel.signals} />
          ) : (
            <div className="rounded-3xl border border-white/8 bg-zinc-950 p-6">
              <h2 className="text-xl font-bold mb-2">Treasury Risk Heatmap</h2>
              <p className="text-sm text-zinc-500">
                No risky vendor signals yet — your storefront is healthy.
              </p>
            </div>
          )}
          <LiveRiskRadar />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PredictiveFailureEngine />
          <div className="rounded-3xl border border-white/8 bg-zinc-950 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-zinc-500 text-xs uppercase tracking-wider">
                  Growth Opportunities
                </div>
                <h2 className="text-2xl font-bold mt-1">Where to focus next</h2>
              </div>
              <TrendingUp className="h-5 w-5 text-green-300" />
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Gauge className="h-4 w-4 text-cyan-300 mt-0.5" />
                <Link href="/vendor/products" className="hover:underline">
                  Add 3+ images and a video to listings under 60% Product Health.
                </Link>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 text-green-300 mt-0.5" />
                <Link href="/dashboard/vendor/kyc" className="hover:underline">
                  Upload business documents to upgrade KYC tier and unlock T+0 payouts.
                </Link>
              </li>
              <li className="flex items-start gap-3">
                <Radar className="h-4 w-4 text-fuchsia-300 mt-0.5" />
                <Link href="/dashboard/create-live" className="hover:underline">
                  Schedule a live commerce session — your audience peaks Fri 6–9pm.
                </Link>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
