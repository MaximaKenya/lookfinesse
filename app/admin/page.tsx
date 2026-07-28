"use client";

import Link from "next/link";

import { useEffect, useState } from "react";

import {
  ShieldAlert,
  Wallet,
  Activity,
  Globe,
  ArrowUpRight,
  Radar,
  Database,
  Siren,
} from "lucide-react";

import { ADMIN_KPI_LINKS } from "@/lib/nav/dashboards";

function formatCurrency(value: number) {
  return `KES ${Number(value || 0).toLocaleString()}`;
}

function StatCard({
  title,
  value,
  icon,
  glow,
  subtitle,
  href,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  glow: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/60"
    >
      <div
        className={`absolute inset-0 opacity-10 blur-3xl ${glow}`}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="text-zinc-500 text-sm">
            {title}
          </div>

          <div className="text-zinc-400 group-hover:text-white transition">
            {icon}
          </div>
        </div>

        <div className="mt-5 text-4xl font-bold text-white">
          {value}
        </div>

        <div className="mt-3 text-sm text-zinc-500 inline-flex items-center gap-1">
          {subtitle}
          <ArrowUpRight className="h-3 w-3 text-zinc-600 group-hover:text-white transition" />
        </div>
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const [liveData, setLiveData] =
    useState<any>(null);

  const [riskData, setRiskData] =
    useState<any>(null);

  const [forecastData, setForecastData] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  async function loadDashboard() {
    try {
      setLoading(true);

      const [
        liveRes,
        riskRes,
        forecastRes,
      ] = await Promise.all([
        fetch("/api/agents/run"),
        fetch(
          "/api/intelligence/risk-radar"
        ),
        fetch(
          "/api/intelligence/liquidity-forecast"
        ),
      ]);

      const liveJson =
        await liveRes.json();

      const riskJson =
        await riskRes.json();

      const forecastJson =
        await forecastRes.json();

      setLiveData(liveJson.result);

      setRiskData(riskJson);

      setForecastData(forecastJson);
    } catch (err) {
      console.error(
        "Dashboard load failed",
        err
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(
      loadDashboard,
      15000
    );

    return () =>
      clearInterval(interval);
  }, []);

  const totalExposure =
    liveData?.treasury
      ?.totalExposure || 0;

  const suspiciousCount =
    riskData?.risk
      ?.suspiciousCount || 0;

  const riskyVendors =
    liveData?.vendorRisk?.risky
      ?.length || 0;

  const violations =
    liveData?.compliance
      ?.totalViolations || 0;

  const liquidityTrend =
    forecastData?.points || [];

  const avgLiquidity =
    liquidityTrend.length > 0
      ? Math.round(
          liquidityTrend.reduce(
            (
              acc: number,
              val: number
            ) => acc + val,
            0
          ) /
            liquidityTrend.length
        )
      : 0;

  return (
    <main className="min-h-screen bg-black text-white px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HERO */}
        <section className="relative overflow-hidden rounded-[32px] border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-8">

          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-green-500/10 blur-3xl rounded-full" />

          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/10 blur-3xl rounded-full" />

          <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">

            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 border border-green-500/20 bg-green-500/10 rounded-full px-4 py-2 text-sm text-green-400 mb-5">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                LIVE MARKETPLACE INFRASTRUCTURE
              </div>

              <h1 className="text-5xl xl:text-6xl font-black tracking-tight leading-tight">
                Marketplace
                <span className="text-green-400">
                  {" "}
                  Mission Control
                </span>
              </h1>

              <p className="mt-5 text-zinc-400 text-lg leading-relaxed max-w-3xl">
                Unified realtime command infrastructure
                for treasury intelligence, fraud defense,
                payment orchestration, compliance,
                operational analytics, and autonomous
                financial monitoring.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 min-w-[320px]">

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                <div className="text-zinc-500 text-sm">
                  Infrastructure
                </div>

                <div className="mt-3 text-green-400 text-2xl font-bold">
                  LIVE
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                <div className="text-zinc-500 text-sm">
                  Sync Cycle
                </div>

                <div className="mt-3 text-cyan-400 text-2xl font-bold">
                  15s
                </div>
              </div>

            </div>

          </div>

        </section>

        {/* KPI GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

          <StatCard
            title="Treasury Exposure"
            value={formatCurrency(
              totalExposure
            )}
            subtitle="Open treasury console"
            glow="bg-green-500"
            icon={<Wallet size={22} />}
            href={ADMIN_KPI_LINKS.treasury}
          />

          <StatCard
            title="Suspicious Transactions"
            value={suspiciousCount}
            subtitle="Investigate on risk radar"
            glow="bg-red-500"
            icon={
              <ShieldAlert size={22} />
            }
            href={ADMIN_KPI_LINKS.fraud}
          />

          <StatCard
            title="High Risk Vendors"
            value={riskyVendors}
            subtitle="Open vendor scoring"
            glow="bg-yellow-500"
            icon={<Radar size={22} />}
            href={ADMIN_KPI_LINKS.vendors}
          />

          <StatCard
            title="Compliance Violations"
            value={violations}
            subtitle="Review compliance queue"
            glow="bg-cyan-500"
            icon={<Database size={22} />}
            href={ADMIN_KPI_LINKS.compliance}
          />

        </section>

        {/* MAIN GRID */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="xl:col-span-2 space-y-6">

            {/* COMMAND CENTER */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7">

              <div className="flex items-center justify-between mb-8">

                <div>
                  <div className="text-zinc-500 text-sm">
                    Executive Navigation
                  </div>

                  <h2 className="text-3xl font-bold mt-2">
                    Operational Systems
                  </h2>
                </div>

                <div className="text-green-400 text-sm">
                  Connected Infrastructure
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <Link
                  href="/finance"
                  className="group rounded-3xl border border-zinc-800 bg-black hover:border-green-500/40 p-6 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">

                    <Wallet className="text-green-400" />

                    <ArrowUpRight className="text-zinc-600 group-hover:text-green-400 transition-all" />

                  </div>

                  <div className="mt-6">
                    <div className="text-zinc-500 text-sm">
                      Treasury Operations
                    </div>

                    <div className="text-2xl font-bold mt-2">
                      Finance Control
                    </div>

                    <p className="text-zinc-400 text-sm mt-4 leading-relaxed">
                      Liquidity intelligence, escrow systems,
                      settlements, treasury forecasting and
                      payout orchestration.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/intelligence"
                  className="group rounded-3xl border border-zinc-800 bg-black hover:border-cyan-500/40 p-6 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">

                    <Radar className="text-cyan-400" />

                    <ArrowUpRight className="text-zinc-600 group-hover:text-cyan-400 transition-all" />

                  </div>

                  <div className="mt-6">
                    <div className="text-zinc-500 text-sm">
                      AI Intelligence
                    </div>

                    <div className="text-2xl font-bold mt-2">
                      Intelligence Center
                    </div>

                    <p className="text-zinc-400 text-sm mt-4 leading-relaxed">
                      Fraud intelligence, predictive analytics,
                      anomaly detection and behavioral
                      monitoring systems.
                    </p>
                  </div>
                </Link>

                <Link
                  href="/admin/live"
                  className="group rounded-3xl border border-zinc-800 bg-black hover:border-purple-500/40 p-6 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">

                    <Activity className="text-purple-400" />

                    <ArrowUpRight className="text-zinc-600 group-hover:text-purple-400 transition-all" />

                  </div>

                  <div className="mt-6">
                    <div className="text-zinc-500 text-sm">
                      Live Infrastructure
                    </div>

                    <div className="text-2xl font-bold mt-2">
                      Operations Stream
                    </div>

                    <p className="text-zinc-400 text-sm mt-4 leading-relaxed">
                      Realtime telemetry, event intelligence,
                      payment rails and operational
                      infrastructure observability.
                    </p>
                  </div>
                </Link>

              </div>

            </div>

            {/* LIVE INSIGHTS */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7">

              <div className="flex items-center justify-between mb-6">

                <div>
                  <div className="text-zinc-500 text-sm">
                    Autonomous Intelligence
                  </div>

                  <h2 className="text-3xl font-bold mt-2">
                    Executive Insights
                  </h2>
                </div>

                <Siren className="text-red-400" />

              </div>

              <div className="space-y-4">

                <Link
                  href={ADMIN_KPI_LINKS.fraud}
                  className="group block rounded-2xl border border-red-500/20 bg-red-500/5 p-5 hover:bg-red-500/10 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-red-400 font-semibold">
                      Fraud Intelligence
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-red-300/60 group-hover:text-white" />
                  </div>
                  <div className="text-zinc-300 mt-2 leading-relaxed">
                    {suspiciousCount} suspicious transactions currently detected
                    by the behavioral monitoring engine.
                  </div>
                </Link>

                <Link
                  href={ADMIN_KPI_LINKS.vendors}
                  className="group block rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 hover:bg-yellow-500/10 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-yellow-400 font-semibold">
                      Vendor Risk Monitoring
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-yellow-300/60 group-hover:text-white" />
                  </div>
                  <div className="text-zinc-300 mt-2 leading-relaxed">
                    {riskyVendors} vendors currently exceed expected operational
                    behavior baselines.
                  </div>
                </Link>

                <Link
                  href={ADMIN_KPI_LINKS.treasury}
                  className="group block rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 hover:bg-cyan-500/10 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-cyan-400 font-semibold">
                      Treasury Forecasting
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-cyan-300/60 group-hover:text-white" />
                  </div>
                  <div className="text-zinc-300 mt-2 leading-relaxed">
                    Average projected liquidity demand:{" "}
                    {formatCurrency(avgLiquidity)}
                  </div>
                </Link>

              </div>

            </div>

          </div>

          {/* RIGHT */}
          <div className="space-y-6">

            {/* SYSTEM STATUS */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

              <div className="flex items-center justify-between mb-6">

                <div>
                  <div className="text-zinc-500 text-sm">
                    Infrastructure
                  </div>

                  <h2 className="text-2xl font-bold mt-2">
                    System Status
                  </h2>
                </div>

                <Globe className="text-green-400" />

              </div>

              <div className="space-y-4">

                {[
                  {
                    label: "M-Pesa Rail",
                    value:
                      liveData?.rails
                        ?.mpesa ||
                      "Operational",
                  },
                  {
                    label: "Stripe Rail",
                    value:
                      liveData?.rails
                        ?.stripe ||
                      "Operational",
                  },
                  {
                    label: "Treasury Engine",
                    value: "Operational",
                  },
                  {
                    label: "Fraud AI",
                    value: "Monitoring",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between border-b border-zinc-800 pb-3"
                  >
                    <span className="text-zinc-300">
                      {item.label}
                    </span>

                    <span className="text-green-400 text-sm">
                      {item.value}
                    </span>
                  </div>
                ))}

              </div>

            </div>

            {/* LIVE STATUS */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

              <div className="text-zinc-500 text-sm">
                Live Infrastructure Status
              </div>

              <div className="mt-4 flex items-center gap-3">

                <div className="w-4 h-4 rounded-full bg-green-400 animate-pulse" />

                <div className="text-3xl font-bold text-green-400">
                  OPERATIONAL
                </div>

              </div>

              <div className="mt-5 text-zinc-400 leading-relaxed">
                Realtime intelligence synchronization,
                fraud monitoring, treasury orchestration
                and operational analytics are active.
              </div>

            </div>

          </div>

        </section>

        {loading && (
          <div className="text-center text-cyan-400 text-sm animate-pulse">
            Synchronizing realtime marketplace intelligence...
          </div>
        )}

      </div>
    </main>
  );
}