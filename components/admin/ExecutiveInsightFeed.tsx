"use client";

import { useEffect, useState } from "react";

export default function ExecutiveInsightFeed() {
  const [insights, setInsights] =
    useState<string[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        "/api/admin/control-center"
      );

      const data = await res.json();

      setInsights(data.insights || []);
    }

    load();

    const interval = setInterval(
      load,
      20000
    );

    return () =>
      clearInterval(interval);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

      <div className="flex items-center justify-between mb-6">

        <div>
          <h2 className="text-2xl font-bold text-white">
            Executive Intelligence Feed
          </h2>

          <p className="text-zinc-400 text-sm mt-2">
            Live operational intelligence generated from treasury systems
          </p>
        </div>

        <div className="flex items-center gap-2 text-green-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          LIVE
        </div>

      </div>

      <div className="space-y-4">

        {insights.map((insight, index) => (
          <div
            key={index}
            className="bg-black border border-zinc-800 rounded-2xl p-5 text-zinc-300"
          >
            {insight}
          </div>
        ))}

      </div>

    </div>
  );
}