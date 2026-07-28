"use client";

import { useCallback, useEffect, useState } from "react";

interface Batch {
  id: string;
  total_amount: number;
  payout_count: number;
  status: string;
}

export default function NetworkDashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/settlement/run");
      const data = await res.json();

      if (data.result) {
        setBatches([
          {
            id: crypto.randomUUID(),
            total_amount: data.result.total_amount,
            payout_count: data.result.payout_count,
            status: "PENDING",
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to load settlement batches:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (mounted) {
        await load();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [load]);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8">
        Payment Network Operations 🌐
      </h1>

      {loading && (
        <p className="text-gray-400 mb-4">
          Loading settlement data...
        </p>
      )}

      <div className="space-y-3">
        {batches.map((b) => (
          <div
            key={b.id}
            className="bg-gray-900 p-4 rounded"
          >
            <p>
              Settlement Total: KES {b.total_amount}
            </p>

            <p>
              Payout Count: {b.payout_count}
            </p>

            <p className="text-yellow-400">
              {b.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}