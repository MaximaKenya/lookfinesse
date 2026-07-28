"use client";

import { useEffect, useState } from "react";

type Decision = {
  action: string;
  status: string;
  created_at?: string;
};

export default function AIDecisionTimeline() {
  const [decisions, setDecisions] = useState<Decision[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/intelligence/autonomous-actions");
        const data = await res.json();
        setDecisions(data.actions ?? []);
      } catch {
        setDecisions([]);
      }
    }

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white">AI Decision Timeline</h2>
        <p className="text-zinc-400 mt-2">
          Recent autonomous operational actions from audit and financial events
        </p>
      </div>

      {decisions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No decisions logged yet — timeline fills as the platform processes events.
        </p>
      ) : (
        <div className="space-y-6">
          {decisions.map((decision, index) => (
            <div key={`${decision.action}-${index}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)]" />
                {index !== decisions.length - 1 && (
                  <div className="w-[2px] flex-1 bg-zinc-700 mt-2" />
                )}
              </div>
              <div className="flex-1 pb-8">
                <div className="text-cyan-400 text-sm font-semibold">
                  {decision.created_at
                    ? new Date(decision.created_at).toLocaleTimeString("en-KE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                    : decision.status}
                </div>
                <div className="text-white mt-2 text-lg font-medium">
                  {decision.action}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
