"use client";

import { useCallback, useEffect, useState } from "react";
import { subscribeToRiskStream } from "@/lib/risk/realtimeRiskStream";

interface Vendor {
  vendor_id: string;
  risk_score: number;
}

interface FraudEvent {
  id: string;
  event_type: string;
  severity: number;
  vendor_id: string;
}

interface Payout {
  id: string;
  vendor_id: string;
  amount: number;
  status: string;
}

interface DashboardData {
  vendors: Vendor[];
  fraud_events: FraudEvent[];
  payouts: Payout[];
}

export default function RiskDashboard() {
  const [data, setData] = useState<DashboardData>({
    vendors: [],
    fraud_events: [],
    payouts: [],
  });

  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/risk/dashboard");
      const json = await res.json();

      // SINGLE BATCH UPDATE (fixes cascading renders warning)
      setData({
        vendors: json.vendors ?? [],
        fraud_events: json.fraud_events ?? [],
        payouts: json.payouts ?? [],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  async function controlPayout(action: string, payout_id: string) {
    await fetch("/api/payouts/control", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, payout_id }),
    });

    await load(); // safe re-fetch
  }

  useEffect(() => {
  const channel = subscribeToRiskStream(() => {
    load(); // auto-refresh dashboard
  });

  return () => {
    channel.unsubscribe();
  };
}, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (alive) await load();
    })();

    return () => {
      alive = false;
    };
  }, [load]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">
        Risk Operations Center ⚡
      </h1>

      {loading && (
        <p className="text-gray-400 mb-4">Loading live data...</p>
      )}

      {/* VENDORS */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Vendor Risk Scores
        </h2>

        <div className="space-y-2">
          {data.vendors.map((v) => (
            <div
              key={v.vendor_id}
              className="p-3 bg-gray-900 rounded flex justify-between"
            >
              <span>{v.vendor_id}</span>
              <span
                className={
                  v.risk_score > 70
                    ? "text-red-500"
                    : v.risk_score > 40
                    ? "text-yellow-400"
                    : "text-green-400"
                }
              >
                {v.risk_score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FRAUD EVENTS */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">
          Fraud Events
        </h2>

        <div className="space-y-2">
          {data.fraud_events.map((f) => (
            <div key={f.id} className="p-3 bg-red-900/30 rounded">
              <p>{f.event_type}</p>
              <p className="text-sm text-gray-400">
                Severity: {f.severity}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* PAYOUTS */}
      <div>
        <h2 className="text-xl font-semibold mb-2">
          Live Payout Queue
        </h2>

        <div className="space-y-2">
          {data.payouts.map((p) => (
            <div
              key={p.id}
              className="p-3 bg-gray-900 rounded flex justify-between"
            >
              <div>
                <p>{p.vendor_id}</p>
                <p className="text-sm text-gray-400">
                  {p.amount} • {p.status}
                </p>
              </div>

              <div className="space-x-2">
                <button
                  onClick={() =>
                    controlPayout("FORCE_RETRY", p.id)
                  }
                  className="bg-blue-600 px-2 py-1 rounded"
                >
                  Retry
                </button>

                <button
                  onClick={() => controlPayout("BLOCK", p.id)}
                  className="bg-red-600 px-2 py-1 rounded"
                >
                  Block
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}