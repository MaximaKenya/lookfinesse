"use client";

import { useEffect, useState } from "react";

interface AMLAlert {
  id: string;
  alert_type: string;
  severity: number;
  description: string;
}

export default function ComplianceDashboard() {
  const [alerts, setAlerts] = useState<
    AMLAlert[]
  >([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        "/api/compliance/check",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            vendor_id:
              "demo-vendor",
            transaction_amount: 600000,
          }),
        }
      );

      const data = await res.json();

      setAlerts(data.alerts ?? []);
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8">
        Compliance Operations 🛡️
      </h1>

      <div className="space-y-3">
        {alerts.map((a) => (
          <div
            key={a.id}
            className="bg-red-900/30 p-4 rounded"
          >
            <p>{a.alert_type}</p>

            <p className="text-yellow-400">
              Severity: {a.severity}
            </p>

            <p>{a.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}