"use client";

export default function ThreatGraph({
  vendors,
}: {
  vendors: any[];
}) {
  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">
            AI Threat Graph
          </h2>

          <p className="text-gray-400 text-sm mt-2">
            Real-time relationship intelligence across fraud, geography,
            payouts, treasury exposure, and behavioral anomalies
          </p>
        </div>

        <div className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm">
          LIVE RISK TOPOLOGY
        </div>
      </div>

      {(vendors || []).length === 0 && (
        <div className="border border-zinc-800 rounded-2xl p-10 text-center text-gray-500">
          No active threat clusters detected
        </div>
      )}

      <div className="space-y-8">
        {(vendors || []).map((v: any) => {
          const transactions =
            v.evidence?.transactions || [];

          const regions = [
            ...new Set(
              transactions.map(
                (t: any) => t.geo_location
              )
            ),
          ];

          const failedAttempts = transactions.reduce(
            (acc: number, t: any) =>
              acc + (t.failed_attempts || 0),
            0
          );

          const totalAmount = transactions.reduce(
            (acc: number, t: any) =>
              acc + Number(t.amount || 0),
            0
          );

          return (
            <div
              key={v.vendorId}
              className="border border-zinc-800 rounded-3xl p-6 bg-black"
            >
              {/* TOP BAR */}
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-pink-400">
                    {v.vendorName}
                  </h3>

                  <p className="text-gray-500 text-sm mt-1">
                    Vendor intelligence relationship map
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="text-xs text-gray-400">
                      Risk Score
                    </div>

                    <div className="text-red-400 font-bold text-xl">
                      {v.riskScore}
                    </div>
                  </div>

                  <div className="px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                    <div className="text-xs text-gray-400">
                      Threat Level
                    </div>

                    <div className="text-yellow-400 font-bold">
                      {v.riskScore > 80
                        ? "CRITICAL"
                        : v.riskScore > 50
                        ? "HIGH"
                        : "MODERATE"}
                    </div>
                  </div>
                </div>
              </div>

              {/* VISUAL FLOW */}
              <div className="overflow-x-auto pb-2">
                <div className="flex items-center gap-4 min-w-[1100px]">
                  {/* VENDOR */}
                  <div className="min-w-[180px] p-4 rounded-2xl bg-pink-500/10 border border-pink-500/20">
                    <div className="text-xs text-gray-400 mb-1">
                      ENTITY
                    </div>

                    <div className="text-pink-400 font-bold">
                      🏢 {v.vendorName}
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      Active monitored vendor
                    </div>
                  </div>

                  <div className="text-3xl text-zinc-700">
                    →
                  </div>

                  {/* PAYOUTS */}
                  <div className="min-w-[180px] p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <div className="text-xs text-gray-400 mb-1">
                      PAYOUT FLOW
                    </div>

                    <div className="text-red-400 font-bold text-xl">
                      $
                      {totalAmount.toLocaleString()}
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      {
                        v.evidence
                          ?.totalTransactions
                      }{" "}
                      suspicious transactions
                    </div>
                  </div>

                  <div className="text-3xl text-zinc-700">
                    →
                  </div>

                  {/* GEO */}
                  <div className="min-w-[180px] p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="text-xs text-gray-400 mb-1">
                      GEOGRAPHY
                    </div>

                    <div className="text-cyan-400 font-bold">
                      🌍 {regions.length} Regions
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      {regions.join(", ") || "N/A"}
                    </div>
                  </div>

                  <div className="text-3xl text-zinc-700">
                    →
                  </div>

                  {/* FAILED ATTEMPTS */}
                  <div className="min-w-[180px] p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                    <div className="text-xs text-gray-400 mb-1">
                      FAILED ATTEMPTS
                    </div>

                    <div className="text-yellow-400 font-bold text-2xl">
                      {failedAttempts}
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      Authentication anomalies
                    </div>
                  </div>

                  <div className="text-3xl text-zinc-700">
                    →
                  </div>

                  {/* TREASURY */}
                  <div className="min-w-[180px] p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                    <div className="text-xs text-gray-400 mb-1">
                      TREASURY IMPACT
                    </div>

                    <div className="text-green-400 font-bold">
                      HIGH EXPOSURE
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      Liquidity stress detected
                    </div>
                  </div>

                  <div className="text-3xl text-zinc-700">
                    →
                  </div>

                  {/* FRAUD CLUSTER */}
                  <div className="min-w-[200px] p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                    <div className="text-xs text-gray-400 mb-1">
                      FRAUD CLUSTER
                    </div>

                    <div className="text-purple-400 font-bold">
                      LINKED BEHAVIOR
                    </div>

                    <div className="text-xs text-gray-500 mt-2">
                      Cross-agent anomaly correlation
                    </div>
                  </div>
                </div>
              </div>

              {/* FLAGS */}
              <div className="mt-6 flex flex-wrap gap-2">
                {(v.flags || []).map(
                  (flag: string, idx: number) => (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded-full bg-red-900/30 border border-red-500/20 text-red-300 text-xs"
                    >
                      {flag}
                    </div>
                  )
                )}
              </div>

              {/* AI REASONING */}
              <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-950">
                  <div className="text-xs text-gray-500 mb-2">
                    WHY FLAGGED
                  </div>

                  <div className="text-sm text-white">
                    {v.whyNow ||
                      "Cross-agent anomaly escalation"}
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-950">
                  <div className="text-xs text-gray-500 mb-2">
                    DETECTED PATTERN
                  </div>

                  <div className="text-sm text-cyan-400">
                    Geo velocity + payout spike +
                    device inconsistency
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 p-4 bg-zinc-950">
                  <div className="text-xs text-gray-500 mb-2">
                    AI RECOMMENDATION
                  </div>

                  <div className="text-sm text-yellow-400">
                    Freeze payouts and escalate to
                    compliance review
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