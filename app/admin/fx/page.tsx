"use client";

import { useState } from "react";

export default function FxDashboard() {
  const [amount, setAmount] = useState(1000);

  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("KES");

  const [result, setResult] =
    useState<number | null>(null);

  async function convert() {
    const res = await fetch("/api/fx/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        amount,
        from,
        to,
      }),
    });

    const data = await res.json();

    setResult(data.converted);
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8">
        Global FX Operations 💱
      </h1>

      <div className="space-y-4 max-w-md">
        <input
          type="number"
          value={amount}
          onChange={(e) =>
            setAmount(Number(e.target.value))
          }
          className="w-full p-3 rounded bg-gray-900"
        />

        <input
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-full p-3 rounded bg-gray-900"
        />

        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full p-3 rounded bg-gray-900"
        />

        <button
          onClick={convert}
          className="bg-green-600 px-4 py-2 rounded"
        >
          Convert Currency
        </button>

        {result !== null && (
          <div className="bg-gray-900 p-4 rounded">
            Converted Amount: {result}
          </div>
        )}
      </div>
    </div>
  );
}