// components/realtime/RealtimeRevenueChart.tsx

"use client";

import { useMemo, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceDot,
  Area,
} from "recharts";

type TimelinePoint = {
  time: string;
  revenue: number;
  rawTimestamp?: string;
  anomaly?: boolean;
  label?: string;
};

function formatCurrency(value: number) {
  return `KES ${Number(value).toLocaleString()}`;
}

/**
 * Compact Y-axis labels
 */
function formatCompact(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }

  return `${value}`;
}

type FilterType = "hourly" | "daily" | "weekly" | "monthly" | "yearly";

export default function RealtimeRevenueChart({ data }: { data?: any }) {
  const [filter, setFilter] = useState<FilterType>("hourly");

  const rawRevenueData: TimelinePoint[] = data?.revenue?.timeline || [];

  /**
   * Prevent future timestamps
   */
  const nowInKenya = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Africa/Nairobi",
    }),
  );

  /**
   * CLEAN DATA
   */
  const cleanData = rawRevenueData.filter((item: TimelinePoint) => {
    if (!item.rawTimestamp) return true;

    const itemDate = new Date(item.rawTimestamp);

    return itemDate.getTime() <= nowInKenya.getTime();
  });

  /**
   * MULTI GRANULAR GROUPING
   */
  const chartData = useMemo(() => {
    const grouped = new Map<
      string,
      {
        revenue: number;
        anomaly?: boolean;
        label?: string;
      }
    >();

    cleanData.forEach((item) => {
      const safeRevenue = Number(item?.revenue ?? 0);

      // prevent NaN corruption
      if (Number.isNaN(safeRevenue)) return;

      const date = item.rawTimestamp ? new Date(item.rawTimestamp) : new Date();

      let key = "";

      switch (filter) {
        case "hourly":
          key = `${date.getHours().toString().padStart(2, "0")}:00`;
          break;

        case "daily":
          key = date.toLocaleDateString("en-US", {
            weekday: "short",
          });
          break;

        case "weekly":
          key = `Week ${Math.ceil(date.getDate() / 7)}`;
          break;

        case "monthly":
          key = date.toLocaleDateString("en-US", {
            month: "short",
          });
          break;

        case "yearly":
          key = `${date.getFullYear()}`;
          break;
      }

      const existing = grouped.get(key);

      grouped.set(key, {
        revenue: (existing?.revenue ?? 0) + safeRevenue,

        anomaly: existing?.anomaly || item.anomaly,

        label: item.label,
      });
    });

    const finalData = Array.from(grouped.entries()).map(([time, values]) => ({
      time,
      revenue: values.revenue,

      anomalyRevenue: values.anomaly ? values.revenue : null,

      anomaly: values.anomaly,
      label: values.label,
    }));

    console.log("FINAL CHART DATA", finalData);

    return finalData;
  }, [cleanData, filter]);

  const grossVolume = data?.revenue?.grossVolume || 0;

  const netRevenue = data?.revenue?.netRevenue || 0;

  const fraudLoss = data?.revenue?.fraudLoss || 0;

  const treasuryUtilization = data?.treasury?.utilization || 0;

  const filters: FilterType[] = [
    "hourly",
    "daily",
    "weekly",
    "monthly",
    "yearly",
  ];

  return (
    <div className="bg-[#0b0b0c] border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Revenue Intelligence
          </h2>

          <p className="text-base text-zinc-400 mt-2">
            Multi-granular financial monitoring & anomaly detection
          </p>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {/* GROSS VOLUME */}
        <div className="bg-black border border-green-900/60 rounded-2xl px-5 py-4 min-w-0 shadow-[0_0_35px_rgba(34,197,94,0.12)]">
          <div className="text-sm text-green-300 mb-2 font-medium">
            Gross Volume
          </div>

          <div className="text-2xl xl:text-3xl font-bold text-green-400 truncate">
            {formatCurrency(grossVolume)}
          </div>
        </div>

        {/* NET REVENUE */}
        <div className="bg-black border border-cyan-900/60 rounded-2xl px-5 py-4 min-w-0 shadow-[0_0_30px_rgba(34,211,238,0.05)]">
          <div className="text-sm text-cyan-300 mb-2 font-medium">
            Net Revenue
          </div>

          <div className="text-2xl xl:text-3xl font-bold text-cyan-400 truncate">
            {formatCurrency(netRevenue)}
          </div>
        </div>

        {/* FRAUD LOSS */}
        <div className="bg-black border border-red-900/60 rounded-2xl px-5 py-4 min-w-0 shadow-[0_0_30px_rgba(239,68,68,0.05)]">
          <div className="text-sm text-red-300 mb-2 font-medium">
            Fraud Loss
          </div>

          <div className="text-2xl xl:text-3xl font-bold text-red-400 truncate">
            {formatCurrency(fraudLoss)}
          </div>
        </div>

        {/* TREASURY */}
        <div className="bg-black border border-yellow-900/60 rounded-2xl px-5 py-4 min-w-0 shadow-[0_0_30px_rgba(234,179,8,0.05)]">
          <div className="text-sm text-yellow-300 mb-2 font-medium">
            Treasury Utilization
          </div>

          <div className="text-2xl xl:text-3xl font-bold text-yellow-400 truncate">
            {treasuryUtilization}%
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {filters.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border capitalize ${
              filter === item
                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* CHART */}
      <div className="h-[333px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 25,
              right: 20,
              left: 5,
              bottom: 55,
            }}
          >
            {/* GRID */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1f2937"
              vertical={false}
              opacity={0.35}
            />

            {/* GLOW AREA */}
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />

                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="none"
              fill="url(#revenueGradient)"
            />

            {/* X AXIS */}
            <XAxis
              dataKey="time"
              stroke="#52525b"
              tickLine={false}
              axisLine={false}
              height={60}
              interval={0}
              tick={({ x, y, payload }) => (
                <g transform={`translate(${x},${y})`}>
                  <text
                    dy={16}
                    textAnchor="end"
                    fill="#a1a1aa"
                    fontSize={11}
                    transform="rotate(-35)"
                  >
                    {payload.value}
                  </text>
                </g>
              )}
            />

            {/* Y AXIS */}
            <YAxis
              width={60}
              stroke="#52525b"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: "#a1a1aa",
                fontSize: 11,
              }}
              tickFormatter={formatCompact}
            />

            {/* TOOLTIP */}
            <Tooltip
              cursor={{
                stroke: "#22c55e",
                strokeDasharray: "4 4",
              }}
              contentStyle={{
                backgroundColor: "#09090b",
                border: "1px solid rgba(63,63,70,0.8)",
                borderRadius: "16px",
                color: "#fff",
              }}
              formatter={(value: any) => [formatCurrency(value), "Revenue"]}
              labelStyle={{
                color: "#22d3ee",
                fontWeight: 600,
              }}
            />

            {/* LEGEND */}
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{
                color: "#d4d4d8",
                fontSize: "12px",
                paddingBottom: "20px",
              }}
            />
            {/* MAIN REVENUE LINE */}
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue Flow"
              stroke="#22c55e"
              strokeWidth={4}
              dot={false}
              activeDot={{
                r: 7,
                fill: "#22c55e",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
            />

            {/* ANOMALY SERIES */}
            <Line
              type="monotone"
              dataKey="anomalyRevenue"
              name="AI Detected Anomalies"
              stroke="#ef4444"
              strokeWidth={0}
              connectNulls={false}
              dot={{
                r: 6,
                fill: "#ef4444",
                stroke: "#ffffff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 8,
              }}
            />

            {/* ANOMALIES */}
            {chartData.map(
              (d: any, i: number) =>
                d.anomaly && (
                  <ReferenceDot
                    key={i}
                    x={d.time}
                    y={d.revenue}
                    r={7}
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ),
            )}
          </LineChart>{" "}
        </ResponsiveContainer>
      </div>

      {/* FOOTER */}
      <div className="mt-6 border-t border-zinc-800 pt-5 flex flex-wrap items-center gap-6 text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          Revenue Flow
        </div>

        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          AI Detected Anomalies
        </div>

        <div className="text-zinc-500">Live Financial Intelligence Feed</div>
      </div>
    </div>
  );
}
