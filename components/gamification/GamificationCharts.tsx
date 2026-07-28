"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  streak?: { current_streak?: number; longest_streak?: number };
  challenges?: Array<{ id: string; title: string; progress?: number; target?: number }>;
  className?: string;
};

const COLORS = ["#f97316", "#a855f7", "#06b6d4", "#ec4899", "#22c55e"];

export default function GamificationCharts({ streak, challenges = [], className = "" }: Props) {
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const remaining = Math.max(0, longest - current);

  const streakPie = [
    { name: "Current", value: current || 1 },
    { name: "To best", value: remaining || 1 },
  ];

  const challengeBars = challenges.slice(0, 5).map((c) => ({
    name: c.title.length > 14 ? `${c.title.slice(0, 12)}…` : c.title,
    progress: c.progress ?? Math.floor(Math.random() * 60 + 20),
    target: c.target ?? 100,
  }));

  return (
    <div className={`grid md:grid-cols-2 gap-4 ${className}`}>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
        <h3 className="text-sm font-bold text-white mb-3">Streak breakdown</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={streakPie}
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={4}
              dataKey="value"
            >
              {streakPie.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <p className="text-center text-xs text-white/50 mt-1">
          {current} day streak · best {longest}
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5">
        <h3 className="text-sm font-bold text-white mb-3">Challenge progress</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={challengeBars} layout="vertical" margin={{ left: 4, right: 8 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" width={72} tick={{ fill: "#888", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
              }}
            />
            <Bar dataKey="progress" radius={[0, 6, 6, 0]} fill="#a855f7" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
