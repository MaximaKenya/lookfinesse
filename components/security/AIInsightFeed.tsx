"use client";

import { useEffect, useState } from "react";

export default function AIInsightFeed() {
  const [insight, setInsight] =
    useState("");

  async function loadInsight() {
    const res = await fetch(
      "/api/insights"
    );

    const data = await res.json();

    setInsight(data.insight);
  }

  useEffect(() => {
    loadInsight();

    const interval = setInterval(
      loadInsight,
      60000
    );

    return () =>
      clearInterval(interval);
  }, []);

  return (
    <div className="bg-black border border-green-500 rounded-2xl p-5">
      <div className="text-green-400 text-sm mb-2">
        AI OPERATIONS INSIGHT
      </div>

      <div className="text-white leading-relaxed">
        {insight}
      </div>
    </div>
  );
}