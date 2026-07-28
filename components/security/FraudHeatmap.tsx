"use client";

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function FraudHeatmap({
  data,
}: any) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart data={data}>
          <XAxis dataKey="zone" />

          <Tooltip />

          <Bar dataKey="intensity" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}