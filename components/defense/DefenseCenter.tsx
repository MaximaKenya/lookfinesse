"use client";

import { useEffect, useState } from "react";

interface DefenseAction {
  transaction: string;

  action: string;

  reason: string;

  result: {
    success: boolean;

    action: string;
  };
}

export default function DefenseCenter() {
  const [actions, setActions] =
    useState<DefenseAction[]>([]);

  const [loading, setLoading] =
    useState(false);

  async function scan() {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/defense/scan"
      );

      if (!res.ok) {
        throw new Error(
          "Defense scan failed"
        );
      }

      const data: {
        actions: DefenseAction[];
      } = await res.json();

      setActions(data.actions || []);
    } catch (err) {
      console.error(
        "Defense scan error:",
        err
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void scan();

    const interval = setInterval(() => {
      void scan();
    }, 30000);

    return () =>
      clearInterval(interval);
  }, []);

  return (
    <div className="bg-black border border-red-500 rounded-2xl p-5">
      <div className="text-red-400 text-xl font-bold mb-4">
        AUTONOMOUS DEFENSE CENTER
      </div>

      {loading && (
        <div className="text-sm text-gray-400 mb-3">
          Scanning threats...
        </div>
      )}

      <div className="space-y-3">
        {actions.map(
          (action, i) => (
            <div
              key={i}
              className="border border-zinc-800 rounded-xl p-3"
            >
              <div className="font-bold text-white">
                {action.action}
              </div>

              <div className="text-sm text-gray-400">
                Reason:
                {" "}
                {action.reason}
              </div>

              <div className="text-xs text-red-400 mt-1">
                Transaction:
                {" "}
                {
                  action.transaction
                }
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}