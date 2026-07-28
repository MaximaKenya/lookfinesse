"use client";

import { useEffect, useState } from "react";

export default function SystemStatusMatrix() {
  const [systems, setSystems] =
    useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch(
        "/api/admin/control-center"
      );

      const data = await res.json();

      setSystems(data.systems || []);
    }

    load();

    const interval = setInterval(
      load,
      20000
    );

    return () =>
      clearInterval(interval);
  }, []);

  function getColor(health: string) {
    switch (health) {
      case "healthy":
        return "bg-green-500";

      case "warning":
        return "bg-yellow-500";

      case "critical":
        return "bg-red-500";

      default:
        return "bg-zinc-500";
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

      <div className="mb-6">

        <h2 className="text-2xl font-bold text-white">
          System Status Matrix
        </h2>

        <p className="text-zinc-400 text-sm mt-2">
          Live infrastructure health monitoring
        </p>

      </div>

      <div className="space-y-4">

        {systems.map((system) => (
          <div
            key={system.label}
            className="flex items-center justify-between bg-black border border-zinc-800 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3">

              <div
                className={`w-3 h-3 rounded-full ${getColor(
                  system.health
                )}`}
              />

              <div className="text-white">
                {system.label}
              </div>

            </div>

            <div className="text-zinc-400 text-sm">
              {system.status}
            </div>
          </div>
        ))}

      </div>

    </div>
  );
}