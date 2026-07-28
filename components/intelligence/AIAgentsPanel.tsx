"use client";

import { useEffect, useState } from "react";

type Agent = {
  name: string;
  role: string;
  status: string;
};

export default function AIAgentsPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [fraudRes, stressRes] = await Promise.all([
          fetch("/api/intelligence/risk-radar"),
          fetch("/api/intelligence/liquidity-stress"),
        ]);

        const fraudJson = fraudRes.ok ? await fraudRes.json() : null;
        const stressJson = stressRes.ok ? await stressRes.json() : null;

        const suspicious = Number(fraudJson?.risk?.suspiciousCount ?? 0);
        const stress = Number(stressJson?.stress ?? 0);

        setAgents([
          {
            name: "Sentinel AI",
            role: "Fraud Detection",
            status:
              suspicious > 5 ? "ALERTING" : suspicious > 0 ? "MONITORING" : "HEALTHY",
          },
          {
            name: "Treasury AI",
            role: "Liquidity Optimization",
            status: stress > 60 ? "RUNNING" : stress > 0 ? "MONITORING" : "HEALTHY",
          },
          {
            name: "Compliance AI",
            role: "Regulatory Surveillance",
            status: "HEALTHY",
          },
        ]);
      } catch {
        setAgents([]);
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white">Autonomous AI Agents</h2>
        <p className="text-zinc-400 mt-2 text-sm">
          Status reflects live fraud and liquidity stress signals
        </p>
      </div>

      <div className="space-y-4">
        {agents.map((agent) => (
          <div
            key={agent.name}
            className="bg-black border border-zinc-800 rounded-2xl p-5 flex items-center justify-between"
          >
            <div>
              <div className="text-white font-bold text-lg">{agent.name}</div>
              <div className="text-zinc-500 text-sm mt-1">{agent.role}</div>
            </div>
            <div
              className={`text-sm font-bold tracking-widest ${
                agent.status === "HEALTHY"
                  ? "text-green-400"
                  : agent.status === "ALERTING"
                    ? "text-red-400"
                    : "text-cyan-400"
              }`}
            >
              {agent.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
