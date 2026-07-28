"use client";

import { useEffect, useState } from "react";

type PayoutStatus =
  | "QUEUED"
  | "PROCESSING"
  | "SENT"
  | "FAILED"
  | "RETRY_SCHEDULED";

interface Payout {
  id: string;
  vendor_id: string;
  amount: number;
  status: PayoutStatus;
  attempt_count: number;
  created_at?: string;
}

export default function PayoutAdminPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchPayouts() {
    try {
      setLoading(true);

      const res = await fetch("/api/payouts/list");
      const data = await res.json();

      setPayouts(data.payouts ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function runWorker() {
    await fetch("/api/payouts/run");
    await fetchPayouts();
  }

  useEffect(() => {
    fetchPayouts();
  }, []);

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4">
        Payout Execution Center ⚡
      </h1>

      <button
        onClick={runWorker}
        className="bg-green-600 px-4 py-2 rounded"
      >
        Run Payout Worker
      </button>

      {loading && (
        <p className="text-gray-400 mt-3">Loading payouts...</p>
      )}

      <div className="mt-6 space-y-3">
        {payouts.map((p) => (
          <div key={p.id} className="p-3 bg-gray-900 rounded">
            <p>Vendor: {p.vendor_id}</p>
            <p>Amount: {p.amount}</p>
            <p>Status: {p.status}</p>
            <p>Attempts: {p.attempt_count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}