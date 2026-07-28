"use client";

import { useEffect, useState } from "react";

interface AgentMemory {
  agent: string;
  type: string;
  message: string;
  timestamp: number;
}

export default function AgentCommandCenter() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);

  async function loadAgents() {
    try {
      setLoading(true);

      const res = await fetch("/api/agents/run");
      const json = await res.json();

      setData(json.result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAgents();
    const interval = setInterval(() => void loadAgents(), 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black border border-cyan-500 rounded-2xl p-5 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-cyan-400">AI COMMAND CENTER</h2>

        {loading && (
          <div className="text-sm text-gray-400 animate-pulse">
            Agents coordinating...
          </div>
        )}
      </div>

      {/* ============================= */}
      {/* 🧠 AGENT COORDINATION LAYER */}
      {/* ============================= */}

      <div className="border border-cyan-900 rounded-xl p-4 bg-zinc-950">
        <h3 className="text-cyan-300 font-bold mb-3">
          Agent Coordination Flow
        </h3>

        <div className="space-y-2 text-sm">
          <div className="text-red-400">
            1️⃣ Fraud Agent → scans ledger anomalies
          </div>

          <div className="text-yellow-400">
            2️⃣ Treasury Agent → evaluates exposure risk
          </div>

          <div className="text-orange-400">
            3️⃣ Compliance Agent → flags regulatory violations
          </div>

          <div className="text-pink-400">
            4️⃣ Vendor Risk Agent → scores merchant behavior
          </div>

          <div className="text-cyan-400">
            5️⃣ Orchestrator → merges signals into shared memory
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* 📊 METRICS */}
      {/* ============================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border border-zinc-800 rounded-xl">
          <div className="text-gray-400 text-sm">Fraud Signals</div>
          <div className="text-3xl text-red-400 font-bold">
            {data?.fraud?.suspiciousCount ?? 0}
          </div>
        </div>

        <div className="p-4 border border-zinc-800 rounded-xl">
          <div className="text-gray-400 text-sm">Treasury Exposure</div>
          <div className="text-3xl text-yellow-400 font-bold">
             KES{" "}
            {Number(data?.treasury?.totalExposure || 0).toLocaleString()}{" "}
          </div>
        </div>

        <div className="p-4 border border-zinc-800 rounded-xl">
          <div className="text-gray-400 text-sm">Risky Vendors</div>
          <div className="text-3xl text-pink-400 font-bold">
            {data?.vendorRisk?.risky?.length ?? 0}
          </div>
        </div>
      </div>

      {/* ============================= */}
      {/* 🧠 LIVE AI INVESTIGATION MODE */}
      {/* ============================= */}

      <div className="border border-red-900 bg-[#120909] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-red-400 font-bold text-xl">
            Live AI Investigation Briefing
          </h3>

          <div className="text-xs text-red-300 animate-pulse">
            Autonomous Intelligence Active
          </div>
        </div>

        <div className="space-y-4 text-sm">
          {(data?.vendorRisk?.risky ?? []).map((vendor: any, i: number) => (
            <div
              key={i}
              className="border border-zinc-800 rounded-lg p-4 bg-black"
            >
              <div className="flex items-center justify-between">
                <div className="text-pink-400 font-bold text-lg">
                  {vendor.vendorName}
                </div>

                <div className="text-red-400 font-bold">
                  Risk Score: {vendor.riskScore}
                </div>
              </div>

              <div className="mt-3 text-gray-300">
                {vendor.vendorName} has triggered elevated risk monitoring due
                to:
              </div>

              <ul className="mt-2 ml-5 list-disc text-sm text-yellow-400 space-y-1">
                {(vendor.flags ?? []).map((flag: string, idx: number) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>

              <div className="mt-3 text-cyan-400">🧠 {vendor.whyNow}</div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="bg-zinc-900 rounded p-3">
                  <div className="text-xs text-gray-500">Transactions</div>

                  <div className="text-white font-bold">
                    {vendor.evidence?.totalTransactions || 0}
                  </div>
                </div>

                <div className="bg-zinc-900 rounded p-3">
                  <div className="text-xs text-gray-500">Timeline Events</div>

                  <div className="text-cyan-400 font-bold">
                    {vendor.timeline?.length || 0}
                  </div>
                </div>

                <div className="bg-zinc-900 rounded p-3">
                  <div className="text-xs text-gray-500">Geo Velocity</div>

                  <div className="text-red-400 font-bold">
                    {(vendor.flags ?? []).includes("geo_velocity")
                      ? "Detected"
                      : "Normal"}
                  </div>
                </div>

                <div className="bg-zinc-900 rounded p-3">
                  <div className="text-xs text-gray-500">Device Risk</div>

                  <div className="text-yellow-400 font-bold">
                    {(vendor.flags ?? []).includes("new_device")
                      ? "Elevated"
                      : "Stable"}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(data?.vendorRisk?.risky ?? []).length === 0 && (
            <div className="text-gray-500">No active AI investigations.</div>
          )}
        </div>
      </div>
      {/* ============================= */}
      {/* 🔍 RISKY VENDORS */}
      {/* ============================= */}

      <div className="border border-zinc-800 rounded-xl p-4">
        <h3 className="text-white font-bold mb-3">
          Risky Vendors (Explainability View)
        </h3>

        {(data?.vendorRisk?.risky ?? []).length === 0 && (
          <div className="text-gray-500 text-sm">
            No risky vendors detected.
          </div>
        )}

        <div className="space-y-3">
          {(data?.vendorRisk?.risky ?? []).map((v: any, i: number) => (
            <div
              key={`${v.vendorId ?? "vendor"}-${i}`}
              className="border border-zinc-700 rounded-lg p-3"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-cyan-400 font-semibold">
                    {v.vendorName}
                  </div>

                  <div className="text-xs text-gray-400">
                    Risk Score: {v.riskScore}
                  </div>
                </div>

                <button
                  onClick={() =>
                    setExpandedVendor(
                      expandedVendor === v.vendorId ? null : v.vendorId,
                    )
                  }
                  className="text-xs text-pink-400"
                >
                  {expandedVendor === v.vendorId ? "Collapse" : "Inspect"}
                </button>
              </div>

              {/* FLAGS */}
              <div className="flex flex-wrap gap-2 mt-2">
                {(v.flags ?? []).map((f: string, idx: number) => (
                  <span
                    key={`${f}-${idx}`}
                    className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* WHY NOW */}
              <div className="text-xs text-yellow-400 mt-2">🧠 {v.whyNow}</div>

              {/* QUICK INTELLIGENCE */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="text-xs text-gray-500">Transactions</div>

                  <div className="text-2xl font-bold text-red-400 mt-1">
                    {v.evidence?.totalTransactions || 0}
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="text-xs text-gray-500">Failed Attempts</div>

                  <div className="text-2xl font-bold text-yellow-400 mt-1">
                    {(v.evidence?.transactions || []).reduce(
                      (sum: number, t: any) => sum + (t.failed_attempts || 0),
                      0,
                    )}
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="text-xs text-gray-500">Geo Velocity</div>

                  <div className="text-2xl font-bold text-cyan-400 mt-1">
                    {
                      (v.evidence?.transactions || []).filter(
                        (t: any) => t.geo_velocity_flag,
                      ).length
                    }
                  </div>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3">
                  <div className="text-xs text-gray-500">New Devices</div>

                  <div className="text-2xl font-bold text-pink-400 mt-1">
                    {
                      (v.evidence?.transactions || []).filter(
                        (t: any) => t.is_new_device,
                      ).length
                    }
                  </div>
                </div>
              </div>

              {/* EVIDENCE */}
              {expandedVendor === v.vendorId && (
                <div className="mt-3 border border-zinc-800 p-2 rounded bg-zinc-900">
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2">
                      Geography Intelligence
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        ...new Set(
                          (v.evidence?.transactions || []).map(
                            (t: any) => t.geo_location,
                          ),
                        ),
                      ].map((loc: any, idx: number) => (
                        <div
                          key={idx}
                          className="px-3 py-2 rounded-full bg-cyan-500/10 text-cyan-300 text-xs border border-cyan-500/20"
                        >
                          🌍 {loc}
                        </div>
                      ))}
                    </div>
                  </div>
                  <pre className="text-xs text-gray-300 overflow-auto">
                    {JSON.stringify(
                      {
                        transactions: v.evidence?.transactions ?? [],
                        timeline: v.timeline ?? [],
                        totalTransactions: v.evidence?.totalTransactions ?? 0,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ============================= */}
      {/* 🧠 SHARED AGENT MEMORY */}
      {/* ============================= */}

      <div>
        <h3 className="text-white font-bold mb-3">
          Shared Agent Memory (Cross-Agent Intelligence)
        </h3>

        <div className="space-y-3">
          {(data?.sharedMemory ?? []).length === 0 && (
            <div className="text-gray-500 text-sm">
              No shared memory events recorded.
            </div>
          )}

          {(data?.sharedMemory ?? []).map((item: AgentMemory, i: number) => (
            <div key={i} className="border border-zinc-800 p-3 rounded-lg">
              <div className="flex justify-between">
                <div className="text-cyan-400 font-semibold">{item.agent}</div>

                <div className="text-xs text-gray-500">
                  {new Date(item.timestamp).toLocaleTimeString("en-KE", {
                    timeZone: "Africa/Nairobi",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}{" "}
                </div>
              </div>

              <div className="text-yellow-400 text-sm">{item.type}</div>

              <div className="text-gray-300 text-sm mt-1">{item.message}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================= */}
      {/* 🧠 SYSTEM REASONING LAYER */}
      {/* ============================= */}

      <div className="border border-cyan-900 rounded-xl p-4 bg-zinc-950">
        <h3 className="text-cyan-300 font-bold mb-2">
          Autonomous Reasoning Layer
        </h3>

        <div className="text-sm text-gray-300 space-y-2">
          <div>• Agents operate independently on domain signals</div>
          <div>• Orchestrator fuses outputs into shared memory</div>
          <div>
            • Risk signals propagate across vendor + treasury + fraud layers
          </div>
          <div>• Shared memory acts as cross-agent short-term intelligence</div>
        </div>
      </div>
    </div>
  );
}
