"use client";

import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";

import { buildOperationalInsight } from "@/lib/intelligence/operationsEngine";

export default function RealtimeEventFeed() {
  const events = useRealtimeEvents();

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Financial Intelligence Stream</h2>

          <p className="text-sm text-gray-400 mt-1">
            AI-enriched operational event intelligence
          </p>
        </div>

        <div className="flex items-center gap-2 text-green-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          LIVE
        </div>
      </div>

      <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
        {events.map((event) => {
          const intelligence = buildOperationalInsight(event);
          return (
            <div
              key={event.id}
              className={`border rounded-2xl p-5 bg-black ${
                intelligence.severity === "CRITICAL"
                  ? "border-red-500/30"
                  : intelligence.severity === "HIGH"
                    ? "border-orange-500/30"
                    : intelligence.severity === "MEDIUM"
                      ? "border-yellow-500/30"
                      : "border-green-500/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">FRAUD AGENT</div>

                  <div className="font-bold text-lg mt-1">
                    {event.event_type}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={
                      intelligence.severity === "CRITICAL"
                        ? "text-red-400"
                        : intelligence.severity === "HIGH"
                          ? "text-orange-400"
                          : intelligence.severity === "MEDIUM"
                            ? "text-yellow-400"
                            : "text-blue-400"
                    }
                  >
                    {intelligence.severity}
                  </div>

                  <div className="text-xs text-zinc-500 mt-1">
                    {new Date(event.created_at).toLocaleTimeString("en-KE", {
                      timeZone: "Africa/Nairobi",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="text-gray-400">
                  Vendor:
                  <span className="text-white ml-2">{event.entity_id}</span>
                </div>

                <div className="text-gray-400">
                  Exposure:
                  <span className="text-green-400 ml-2">
                    KES {Number(event.amount || 0).toLocaleString()}
                  </span>
                </div>

                <div className="text-gray-400">
                  Risk Score:
                  <span className="text-red-400 ml-2">
                    {intelligence.riskScore}
                  </span>
                </div>

                <div className="text-gray-400">
                  AI Confidence:
                  <span className="text-cyan-400 ml-2">
                    {intelligence.confidence}%
                  </span>
                </div>

                <div className="text-gray-300">{intelligence.insight}</div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-3">
                  <div className="text-red-400 font-semibold">
                    Recommended Action
                  </div>

                  <div className="text-sm text-gray-300 mt-1">
                    {intelligence.recommendation}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
