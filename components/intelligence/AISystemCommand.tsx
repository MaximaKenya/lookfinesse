"use client";

import { useEffect, useState } from "react";

type Action = {
  action: string;
  status: string;
  created_at?: string;
};

export default function AISystemCommand() {
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/intelligence/autonomous-actions");
        const data = await res.json();
        setActions(data.actions ?? []);
      } catch {
        setActions([]);
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const statusStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s.includes("CRIT") || s.includes("ALERT") || s.includes("ACTIVE")) {
      return {
        color: "text-red-400",
        border: "border-red-500/20",
        bg: "bg-red-500/10",
      };
    }
    if (s.includes("RUN") || s.includes("MONITOR")) {
      return {
        color: "text-cyan-400",
        border: "border-cyan-500/20",
        bg: "bg-cyan-500/10",
      };
    }
    return {
      color: "text-green-400",
      border: "border-green-500/20",
      bg: "bg-green-500/10",
    };
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-white">AI System Command</h2>
          <p className="text-zinc-400 mt-2">
            Recent autonomous actions from financial events and audit logs
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold tracking-widest">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          LIVE AI AGENTS
        </div>
      </div>

      {actions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No autonomous actions recorded yet — system events will appear here as they occur.
        </p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {actions.map((action, index) => {
            const style = statusStyle(action.status);
            return (
              <div
                key={`${action.action}-${index}`}
                className={`${style.bg} ${style.border} border rounded-3xl p-5`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`text-xs font-bold tracking-widest ${style.color}`}>
                    {action.status}
                  </div>
                </div>
                <div className="text-xl font-bold text-white leading-tight">
                  {action.action}
                </div>
                {action.created_at && (
                  <div className="text-xs text-zinc-500 mt-3">
                    {new Date(action.created_at).toLocaleString("en-KE")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
