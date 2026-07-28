"use client";

import { useEffect, useState } from "react";

type Prediction = {
  label: string;
  value: string;
  color: string;
};

export default function PredictiveFailureEngine() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/intelligence/predictive-failures");
        const data = await res.json();
        setPredictions(data.predictions ?? []);
        setEmpty(Boolean(data.empty));
      } catch {
        setPredictions([]);
        setEmpty(true);
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white">
          Predictive Failure Engine
        </h2>
        <p className="text-zinc-400 mt-2">
          Forecasted instability from payouts, fraud events and treasury forecasts
        </p>
      </div>

      {empty && predictions.every((p) => p.value === "0%") ? (
        <p className="text-sm text-zinc-500">
          No payout or fraud signals yet — projections appear once marketplace activity begins.
        </p>
      ) : (
        <div className="space-y-4">
          {predictions.map((prediction) => (
            <div
              key={prediction.label}
              className="bg-black border border-zinc-800 rounded-2xl p-5 flex items-center justify-between"
            >
              <div className="text-white font-semibold">{prediction.label}</div>
              <div className={`${prediction.color} text-2xl font-black`}>
                {prediction.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
