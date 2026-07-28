"use client";

import { useEffect, useState } from "react";

export default function LiquidityStressGauge() {

  const [stress, setStress] =
    useState(0);

  useEffect(() => {

    const load = async () => {

      const res = await fetch(
        "/api/intelligence/liquidity-stress"
      );

      const data = await res.json();

      setStress(data.stress || 0);
    };

    load();

  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center">

      <h2 className="text-2xl font-bold mb-8">
        Liquidity Stress
      </h2>

      <div className="relative w-48 h-48 rounded-full border-[16px] border-zinc-800 flex items-center justify-center">

        <div
          className="absolute inset-0 rounded-full border-[16px] border-yellow-500"
          style={{
            clipPath: `inset(${100 - stress}% 0 0 0)`,
          }}
        />

        <div className="text-5xl font-bold text-yellow-400">
          {stress}%
        </div>

      </div>

      <div className="text-zinc-500 mt-6 text-center">
        Treasury pressure analysis
      </div>

    </div>
  );
}