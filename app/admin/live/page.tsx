"use client";

import React from "react";
import Link from "next/link";

import {
  Activity,
  Globe,
  ShieldAlert,
  Wallet,
} from "lucide-react";

import AnimatedCounter from "@/components/realtime/AnimatedCounter";
import RealtimeEventFeed from "@/components/realtime/RealtimeEventFeed";
import TreasuryPulse from "@/components/realtime/TreasuryPulse";
import LiveAlertBanner from "@/components/realtime/LiveAlertBanner";
import RealtimeRevenueChart from "@/components/realtime/RealtimeRevenueChart";
import AiChatBox from "@/components/ai/AiChatBox";
import ThreatGraph from "@/components/agents/ThreatGraph";
import AgentCommandCenter from "@/components/agents/AgentCommandCenter";
import { ADMIN_KPI_LINKS } from "@/lib/nav/dashboards";

function MetricCard({
  title,
  value,
  change,
  icon,
  href,
}: {
  title: string;
  value: React.ReactNode;
  change: string;
  icon: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <div className="text-white/50 text-sm">{title}</div>
        <div className="text-white/70">{icon}</div>
      </div>
      <div className="mt-4">
        <h2 className="text-3xl font-bold">{value}</h2>
        <p className="text-green-400 text-sm mt-2">{change}</p>
      </div>
    </>
  );

  const className =
    "bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl h-full transition-all hover:bg-white/8 hover:border-white/20";

  if (href) {
    return (
      <Link href={href} className={`block ${className}`}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}
function NetworkHealth({ data }: { data?: any }) {
  const rails = [
    {
      name: "M-Pesa",
      status: data?.rails?.mpesa || "Operational",
    },
    {
      name: "Stripe",
      status: data?.rails?.stripe || "Operational",
    },
    {
      name: "Bank Rail",
      status: data?.rails?.bank || "Operational",
    },
    {
      name: "FX Engine",
      status: data?.rails?.fx || "Operational",
    },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
      <h2 className="text-2xl font-semibold mb-6">
        Payment Rail Health
      </h2>

      <div className="space-y-4">
        {rails.map((rail) => (
          <div
            key={rail.name}
            className="flex items-center justify-between border-b border-white/10 pb-3"
          >
            <span className="font-medium">{rail.name}</span>

            <span
              className={`text-sm px-3 py-1 rounded-full ${
                rail.status === "Operational"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {rail.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LiveOpsPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  async function loadLiveData() {
    try {
      setLoading(true);

      const res = await fetch("/api/agents/run");
      const json = await res.json();

      setData(json.result);
    } catch (e) {
      console.error("LiveOps fetch failed:", e);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void loadLiveData();

    const interval = setInterval(() => {
      void loadLiveData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">      <div className="mb-8">
        <h1 className="text-5xl font-bold tracking-tight">
          Financial Operations Center ⚡
        </h1>

        <p className="text-gray-400 mt-3 text-lg">
          Real-time global commerce monitoring and AI intelligence
        </p>
      </div>

      {loading && (
        <div className="text-cyan-400 text-sm animate-pulse mb-4">
          Syncing live financial intelligence...
        </div>
      )}

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">

        <div className="md:col-span-6 xl:col-span-4">
          <MetricCard
            title="Treasury Liquidity"
            href={ADMIN_KPI_LINKS.treasury}
            value={              <AnimatedCounter
                value={data?.treasury?.totalExposure || 0}
                prefix="KES "
              />
            }
            change={data?.treasury?.trend || "+0%"}
            icon={<Wallet size={22} />}
          />
        </div>

        <div className="md:col-span-6 xl:col-span-2">
          <MetricCard
            title="Fraud Alerts"
            href={ADMIN_KPI_LINKS.fraud}
            value={              <AnimatedCounter
                value={data?.fraud?.suspiciousCount || 0}
              />
            }
            change={data?.fraud?.trend || "0%"}
            icon={<ShieldAlert size={22} />}
          />
        </div>

        <div className="md:col-span-6 xl:col-span-2">
          <MetricCard
            title="Risky Vendors"
            href={ADMIN_KPI_LINKS.vendors}
            value={              <AnimatedCounter
                value={data?.vendorRisk?.risky?.length || 0}
              />
            }
            change="LIVE"
            icon={<Activity size={22} />}
          />
        </div>

        <div className="md:col-span-6 xl:col-span-2">
          <MetricCard
            title="Compliance Alerts"
            href={ADMIN_KPI_LINKS.compliance}
            value={              <AnimatedCounter
                value={data?.compliance?.totalViolations || 0}
              />
            }
            change={data?.compliance?.status || "OK"}
            icon={<ShieldAlert size={22} />}
          />
        </div>

        <div className="md:col-span-6 xl:col-span-2">
          <MetricCard
            title="FX Exposure"
            href={ADMIN_KPI_LINKS.fx}
            value={              <AnimatedCounter
                value={data?.treasury?.fxExposure || 0}
                prefix="KES "
              />
            }
            change="+0%"
            icon={<Globe size={22} />}
          />
        </div>

      </div>

      {/* EXECUTIVE GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">

        {/* LEFT */}
        <div className="xl:col-span-2 space-y-4">

          <RealtimeRevenueChart data={data} />

          <ThreatGraph
            vendors={data?.vendorRisk?.risky || []}
          />

        </div>

        {/* RIGHT */}
        <div className="space-y-4">

          <TreasuryPulse data={data} />

          <AiChatBox />

          {/* EXECUTIVE BRIEFING */}
          <div className="bg-white/5 backdrop-blur-xl border border-cyan-500/20 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-cyan-400">
                AI Executive Briefing
              </h2>

              <div className="text-xs text-gray-500">
                Live Intelligence
              </div>
            </div>

            <div className="space-y-4 text-sm">

              <div className="border border-red-500/20 bg-red-500/5 rounded-xl p-3">
                <div className="text-red-400 font-semibold">
                  Fraud Pressure
                </div>

                <div className="text-gray-300 mt-1">
                  {data?.fraud?.suspiciousCount || 0}
                  {" "}suspicious transactions detected
                </div>
              </div>

              <div className="border border-pink-500/20 bg-pink-500/5 rounded-xl p-3">
                <div className="text-pink-400 font-semibold">
                  Vendor Risk
                </div>

                <div className="text-gray-300 mt-1">
                  {data?.vendorRisk?.risky?.length || 0}
                  {" "}vendors elevated
                </div>
              </div>

              <div className="border border-yellow-500/20 bg-yellow-500/5 rounded-xl p-3">
                <div className="text-yellow-400 font-semibold">
                  Treasury Exposure
                </div>

                <div className="text-gray-300 mt-1">
  Exposure at KES{" "}
  {Number(
    data?.treasury?.totalExposure || 0
  ).toLocaleString()}
</div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* LIVE EVENT STREAM */}
      <div className="mb-8">
        <RealtimeEventFeed />
      </div>

      {/* COMMAND CENTER */}
      <div className="mb-8">
        <AgentCommandCenter />
      </div>

      {/* NETWORK */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
        <NetworkHealth data={data} />

        <LiveAlertBanner />
      </div>

      {/* FOOTER */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5">        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>
            <p className="text-lg font-semibold">
              Global Financial Network
            </p>

            <p className="text-gray-400 text-sm mt-1">
              Monitoring treasury, payouts, FX, fraud,
              compliance and settlements in real time
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />

            <span className="text-green-400 font-medium">
              {data?.systemHealth?.status || "Operational"}
              <br />
              {data?.systemHealth?.message || "All systems nominal"}
            </span>

          </div>
        </div>
      </div>
    </div>
  );
}