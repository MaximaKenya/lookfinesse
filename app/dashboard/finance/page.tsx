"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useLedgerRealtime } from "@/hooks/useLedgerRealtime";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const tooltipStyle = {
  contentStyle: {
    background: "#111827",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 12,
  },
  labelStyle: { color: "#9ca3af" },
};

export default function FinancePage() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [balance, setBalance] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [segmentation, setSegmentation] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setVendorId(data.user.id);
    });
  }, []);

  const load = async () => {
    if (!vendorId) return;
    setLoading(true);

    const { data: ledger } = await supabase
      .from("ledger_entries")
      .select("type, amount")
      .eq("vendor_id", vendorId);

    const computedBalance =
      ledger?.reduce((acc, entry) => {
        return entry.type === "credit"
          ? acc + Number(entry.amount)
          : acc - Number(entry.amount);
      }, 0) || 0;

    setBalance(computedBalance);

    const { data: weekly } = await supabase.from("weekly_revenue_view").select("*");
    setWeeklyRevenue(
      (weekly || []).map((w) => ({ week: new Date(w.week).toLocaleDateString(), revenue: w.revenue }))
    );

    const { data: monthly } = await supabase.from("monthly_revenue").select("*");
    setMonthlyRevenue(
      (monthly || []).map((m) => ({ month: new Date(m.month).toLocaleDateString(), revenue: m.revenue }))
    );

    const { data: profit } = await supabase.from("profit_vs_fees").select("*");
    setProfitData(profit || []);

    const { data: coh } = await supabase.from("cohort_retention").select("*");
    setCohorts(coh || []);

    const { data: seg } = await supabase
      .from("activity_segmentation")
      .select("*")
      .eq("vendor_id", vendorId)
      .single();
    setSegmentation(seg);

    const { data: payoutData } = await supabase
      .from("payouts")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(10);
    setPayouts(payoutData || []);

    setLoading(false);
  };

  useEffect(() => { if (vendorId) load(); }, [vendorId]);
  useLedgerRealtime(load);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-cyan-400 animate-spin mx-auto" />
          <p className="text-gray-400 text-sm">Loading financial data…</p>
        </div>
      </div>
    );
  }

  const payoutStatusColor = (status: string) => {
    if (status === "completed") return "text-green-400 bg-green-400/10";
    if (status === "pending") return "text-yellow-400 bg-yellow-400/10";
    if (status === "failed") return "text-red-400 bg-red-400/10";
    return "text-gray-400 bg-white/5";
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-x-hidden">
      {/* Glows */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-cyan-500/6 rounded-full blur-[180px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/6 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Financial Intelligence</h1>
            <p className="text-gray-500 text-sm mt-0.5">Real-time ledger · analytics · payouts</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="text-sm px-4 py-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition"
            >
              ← Dashboard
            </button>
            <button
              onClick={() => router.push("/dashboard/vendor/wallet")}
              className="text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white"
            >
              Request Payout
            </button>
          </div>
        </motion.div>

        {/* BALANCE CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-cyan-500/15 via-purple-500/10 to-transparent border border-white/10 rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
          <p className="text-sm text-gray-400 mb-2">Available Balance</p>
          <h2 className="text-5xl font-bold tracking-tight">
            KES {balance.toLocaleString()}
          </h2>
          <div className="flex gap-4 mt-4">
            <div className="text-sm text-gray-400">
              <span className="text-green-400 font-medium">↑ </span>
              {segmentation?.recent_transactions ?? 0} transactions this month
            </div>
          </div>
        </motion.div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Weekly Revenue */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/[0.03] border border-white/8 rounded-2xl p-6"
          >
            <h3 className="font-semibold mb-4">Weekly Revenue</h3>
            {weeklyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weeklyRevenue}>
                  <defs>
                    <linearGradient id="wRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2} fill="url(#wRevGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data yet</div>
            )}
          </motion.div>

          {/* MRR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.03] border border-white/8 rounded-2xl p-6"
          >
            <h3 className="font-semibold mb-4">Monthly Revenue (MRR)</h3>
            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data yet</div>
            )}
          </motion.div>
        </div>

        {/* Profit vs Fees */}
        {profitData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/[0.03] border border-white/8 rounded-2xl p-6"
          >
            <h3 className="font-semibold mb-4">Profit vs Fees</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="profit" fill="#22d3ee" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Bar dataKey="fees" fill="#a855f7" radius={[4, 4, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Activity + Cohorts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {segmentation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-4"
            >
              <h3 className="font-semibold">Activity Segmentation</h3>
              <div className="space-y-3">
                {[
                  { label: "All-time transactions", value: segmentation.total_transactions ?? 0 },
                  { label: "Last 30 days", value: segmentation.recent_transactions ?? 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">{label}</span>
                    <span className="text-sm font-semibold text-cyan-400">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {cohorts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-4"
            >
              <h3 className="font-semibold">Cohort Retention</h3>
              <div className="space-y-2">
                {cohorts.slice(0, 5).map((c, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      {new Date(c.cohort_month).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}
                    </span>
                    <span className="text-sm font-medium">{c.total_transactions} txns</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* PAYOUTS */}
        {payouts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Recent Payouts</h3>
              <button
                onClick={() => router.push("/dashboard/vendor/wallet")}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition"
              >
                Manage →
              </button>
            </div>
            <div className="space-y-2">
              {payouts.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">KES {Number(p.amount).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${payoutStatusColor(p.status)}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
