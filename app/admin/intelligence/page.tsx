"use client";

import CopilotPanel from "@/components/ai/CopilotPanel";
import RealtimeEventFeed from "@/components/realtime/RealtimeEventFeed";
import LiveRiskRadar from "@/components/intelligence/LiveRiskRadar";
import TreasuryForecastChart from "@/components/intelligence/TreasuryForecastChart";
import FraudHeatmap from "@/components/intelligence/FraudHeatmap";
import AISystemCommand from "@/components/intelligence/AISystemCommand";
import AIDecisionTimeline from "@/components/intelligence/AIDecisionTimeline";
import GlobalRiskMap from "@/components/intelligence/GlobalRiskMap";
import TreasuryFlowNetwork from "@/components/intelligence/TreasuryFlowNetwork";
import PredictiveFailureEngine from "@/components/intelligence/PredictiveFailureEngine";
import AIAgentsPanel from "@/components/intelligence/AIAgentsPanel";
import MarketplaceHealthScore from "@/components/intelligence/MarketplaceHealthScore";
import PaymentRailMonitor from "@/components/intelligence/PaymentRailMonitor";
import ExecutiveModeToggle from "@/components/intelligence/ExecutiveModeToggle";
import VoiceOpsCopilot from "@/components/intelligence/VoiceOpsCopilot";
import VendorTrustPanel from "@/components/intelligence/VendorTrustPanel";
import SentimentOverview from "@/components/intelligence/SentimentOverview";

import TreasuryPressurePanel from "@/components/intelligence/TreasuryPressurePanel";

export default function IntelligencePage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-5xl font-black tracking-tight">
              Financial Intelligence Center
            </h1>

            <p className="text-zinc-400 text-lg mt-3">
              Autonomous treasury, fraud, and operational intelligence
            </p>
          </div>

          <ExecutiveModeToggle />
        </div>

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

        <VoiceOpsCopilot />

        <CopilotPanel />
      </div>
    </main>
  );
}
