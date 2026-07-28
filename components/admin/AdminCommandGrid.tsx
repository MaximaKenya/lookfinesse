"use client";

import Link from "next/link";

const systems = [
  {
    title: "Financial Control Center",
    route: "/finance",
    color: "green",
    description:
      "Treasury operations, settlements, escrow intelligence, payouts, and liquidity infrastructure.",
  },
  {
    title: "AI Intelligence Center",
    route: "/intelligence",
    color: "cyan",
    description:
      "Behavioral analytics, anomaly detection, fraud intelligence, predictive forecasting.",
  },
  {
    title: "Realtime Infrastructure",
    route: "/admin/live",
    color: "purple",
    description:
      "Realtime telemetry, operational streams, infrastructure visibility, websocket systems.",
  },
];

export default function AdminCommandGrid() {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      {systems.map((system) => (
        <Link
          key={system.title}
          href={system.route}
          className={`bg-zinc-900 border border-zinc-800 hover:border-${system.color}-500/40 rounded-3xl p-8 transition-all`}
        >
          <div className="text-sm text-zinc-500">
            Command System
          </div>

          <div className="text-3xl font-bold text-white mt-3">
            {system.title}
          </div>

          <p className="text-zinc-400 mt-5 leading-relaxed">
            {system.description}
          </p>
        </Link>
      ))}

    </section>
  );
}