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
  Legend,
} from "recharts";

import { supabase } from "@/lib/supabaseClient";
import { getRevenueAnalytics, RevenuePoint } from "@/lib/finance/analytics";

export default function RevenueChart() {
  const [data, setData] = useState<RevenuePoint[]>([]);

  useEffect(() => {
    const load = async () => {
      const analytics = await getRevenueAnalytics("daily");
      setData(analytics);
    };

    load();

    const channel = supabase
      .channel("revenue-chart")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ledger_entries" },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="bg-zinc-900 rounded-3xl p-4 sm:p-6 border border-zinc-800 shadow-2xl overflow-hidden">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4 sm:mb-6">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Revenue Analytics
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1">
            Live ledger-driven revenue trends
          </p>
        </div>

        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-1 self-start shrink-0">
          <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />
          <p className="text-green-400 text-xs font-semibold">LIVE</p>
        </div>
      </div>

      {/* CHART WRAPPER */}
      <div className="h-[220px] sm:h-[280px] md:h-[320px] w-full min-w-0 -mx-1 sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            {/* GRID */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              vertical={false}
            />

            {/* X AXIS */}
            <XAxis
              dataKey="day"
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              width={56}
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                `${Math.round(Number(value) / 1000)}k`
              }
            />

            {/* TOOLTIP (MODERN FINTECH STYLE) */}
            <Tooltip
              contentStyle={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "12px",
              }}
              labelStyle={{
                color: "#a1a1aa",
              }}
              formatter={(value: number) => [
                `KES ${value.toLocaleString()}`,
                "Revenue",
              ]}
            />

            {/* LEGEND */}
            <Legend
              wrapperStyle={{
                color: "#a1a1aa",
                fontSize: "11px",
              }}
            />

            {/* LINE (SMOOTHER + MORE PREMIUM LOOK) */}
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#22c55e"
              strokeWidth={3}
              dot={{ r: 2, fill: "#22c55e" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}