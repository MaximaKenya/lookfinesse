"use client";

import { useEffect, useState } from "react";
import { useFinanceStream } from "@/hooks/useFinanceStream";
import { motion } from "framer-motion";

export default function LiveFinanceDashboard() {
  const data = useFinanceStream();
  const [risk, setRisk] = useState<any>(null);

  useEffect(() => {
    const analyze = async () => {
      if (!data.length) return;

      const res = await fetch("/api/ai/anomaly", {
        method: "POST",
        body: JSON.stringify({
          amount: data[0]?.amount || 0,
          avgAmount: 10000,
          frequency: data.length,
          avgFrequency: 10,
        }),
      });

      setRisk(await res.json());
    };

    analyze();
  }, [data]);

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">

      {/* HEADER */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-3xl font-bold">Live Financial Intelligence</h1>
      </motion.div>

      {/* RISK PANEL */}
      <div className="bg-zinc-900 p-6 rounded-xl">
        <h2>AI Risk Score</h2>
        <p>Score: {risk?.score}</p>
        <p>Risk: {risk?.risk}</p>

        <div className="text-gray-400 mt-2">
          {risk?.reason?.map((r: string, i: number) => (
            <p key={i}>• {r}</p>
          ))}
        </div>
      </div>

      {/* LIVE STREAM */}
      <div className="bg-zinc-900 p-6 rounded-xl">
        <h2>Live Transactions</h2>

        {data.map((d) => (
          <div key={d.id} className="flex justify-between border-b border-zinc-800 py-2">
            <p>{d.category}</p>
            <p>KES {d.amount}</p>
          </div>
        ))}
      </div>

    </div>
  );
}