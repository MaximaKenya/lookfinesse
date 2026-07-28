"use client";

import { useEffect, useState } from "react";

interface TreasuryAccount {
  id: string;
  account_name: string;
  balance: number;
}

interface LiquidityPool {
  id: string;
  pool_name: string;
  available_liquidity: number;
}

interface Forecast {
  id: string;
  expected_outflow: number;
  confidence_score: number;
}

export default function TreasuryDashboard() {
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/treasury/overview");
      const data = await res.json();

      setAccounts(data.accounts ?? []);
      setPools(data.pools ?? []);
      setForecasts(data.forecasts ?? []);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8">
        Treasury Operations Center 🏦
      </h1>

      {/* TREASURY ACCOUNTS */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          Treasury Accounts
        </h2>

        <div className="space-y-2">
          {accounts.length === 0 ? (
            <p className="text-zinc-500 text-sm">No treasury accounts configured yet.</p>
          ) : (
            accounts.map((a) => (
            <div
              key={a.id}
              className="bg-gray-900 p-3 rounded"
            >
              <p>{a.account_name}</p>
              <p className="text-green-400">
                KES {a.balance}
              </p>
            </div>
          ))
          )}
        </div>
      </div>

      {/* LIQUIDITY POOLS */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          Liquidity Pools
        </h2>

        <div className="space-y-2">
          {pools.length === 0 ? (
            <p className="text-zinc-500 text-sm">No liquidity pools yet.</p>
          ) : (
            pools.map((p) => (
            <div
              key={p.id}
              className="bg-gray-900 p-3 rounded"
            >
              <p>{p.pool_name}</p>
              <p className="text-blue-400">
                {p.available_liquidity}
              </p>
            </div>
          ))
          )}
        </div>
      </div>

      {/* FORECASTS */}
      <div>
        <h2 className="text-xl font-semibold mb-3">
          Payout Forecasts
        </h2>

        <div className="space-y-2">
          {forecasts.length === 0 ? (
            <p className="text-zinc-500 text-sm">No payout forecasts available yet.</p>
          ) : (
            forecasts.map((f) => (
            <div
              key={f.id}
              className="bg-gray-900 p-3 rounded"
            >
              <p>
                Expected Outflow: KES{" "}
                {f.expected_outflow}
              </p>

              <p className="text-yellow-400">
                Confidence: {f.confidence_score}%
              </p>
            </div>
          ))
          )}
        </div>
      </div>
    </div>
  );
}