"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import {
  getRevenueAnalytics,
  Granularity,
  RevenuePoint,
} from "@/lib/finance/analytics";

const options: Granularity[] = [
  "hourly",
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

function formatYAxis(value: number) {
  if (value >= 1_000_000_000)
    return `KES ${(value / 1_000_000_000).toFixed(1)}B`;

  if (value >= 1_000_000)
    return `KES ${(value / 1_000_000).toFixed(1)}M`;

  if (value >= 1_000)
    return `KES ${(value / 1_000).toFixed(1)}K`;

  return `KES ${value}`;
}
export default function RevenueChart() {
  const [data, setData] = useState<RevenuePoint[]>([]);
  const [mode, setMode] = useState<Granularity>("hourly");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await getRevenueAnalytics(mode);
      setData(result);
      setLoading(false);
    };

    load();
  }, [mode]);

  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 shadow-2xl">
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Revenue Intelligence
          </h2>
          <p className="text-zinc-400 text-sm">
            Multi-granular financial analytics
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => setMode(opt)}
              className={`px-3 py-1 rounded-xl text-xs border transition ${
                mode === opt
                  ? "bg-green-500 text-black border-green-400"
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* CHART */}
      <div className="h-[360px] w-full">
        {loading ? (
          <div className="text-zinc-400">Loading analytics...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />

              <XAxis
                dataKey="label"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
              />
<YAxis
  tick={{ fill: "#a1a1aa", fontSize: 11 }}
  axisLine={false}
  tickLine={false}
  width={80}
  tickFormatter={(value) => formatYAxis(Number(value))}
/>

              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #27272a",
                }}
              />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#22c55e"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}