// components/realtime/TreasuryPulse.tsx

"use client";

import { motion } from "framer-motion";

export default function TreasuryPulse({
  data,
}: {
  data?: any;
}) {
  const pools = [
    {
      currency: "USD Pool",
      value:
        data?.treasury?.usdUtilization || 0,
    },
    {
      currency: "KES Pool",
      value:
        data?.treasury?.kesUtilization || 0,
    },
    {
      currency: "EUR Pool",
      value:
        data?.treasury?.eurUtilization || 0,
    },
  ];

  return (
    <div className="bg-[#111111] border border-gray-800 rounded-3xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">
          Treasury War Room
        </h2>

        <p className="text-sm text-gray-400 mt-1">
          Real-time liquidity and FX intelligence
        </p>
      </div>

      <div className="space-y-5">
        {pools.map((pool, idx) => (
          <div key={idx}>
            <div className="flex justify-between mb-2">
              <span>{pool.currency}</span>

              <span className="text-yellow-400">
                {pool.value}%
              </span>
            </div>

            <div className="w-full bg-zinc-800 h-4 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${pool.value}%`,
                }}
                transition={{
                  duration: 1.5,
                }}
                className="h-full bg-cyan-500"
              />
            </div>
          </div>
        ))}
      </div>

      {/* AI RECOMMENDATIONS */}
      <div className="mt-8 border border-cyan-900 bg-cyan-500/5 rounded-2xl p-4">
        <div className="text-cyan-400 font-semibold mb-3">
          AI Treasury Recommendations
        </div>

        <div className="space-y-2 text-sm text-gray-300">
          {data?.treasury?.usdUtilization > 80 && (
            <div>
              • Hedge USD exposure immediately
            </div>
          )}

          {data?.treasury?.kesUtilization < 50 && (
            <div>
              • Increase KES liquidity allocation
            </div>
          )}

          {data?.treasury?.eurUtilization > 85 && (
            <div>
              • Delay non-critical EUR settlements
            </div>
          )}

          <div>
            • Monitor live treasury volatility
          </div>
        </div>
      </div>
    </div>
  );
}