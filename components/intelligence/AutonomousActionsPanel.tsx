"use client";

import { useEffect, useState } from "react";

type Action = {
  action: string;
  status: string;
};

export default function AutonomousActionsPanel() {

  const [actions, setActions] =
    useState<Action[]>([]);

  useEffect(() => {

    const load = async () => {

      const res = await fetch(
        "/api/intelligence/autonomous-actions"
      );

      const data = await res.json();

      setActions(data.actions || []);
    };

    load();

  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

      <h2 className="text-2xl font-bold mb-6">
        Autonomous Treasury Actions
      </h2>

      <div className="space-y-4">

        {actions.map((item) => (

          <div
            key={item.action}
            className="border border-zinc-800 rounded-2xl p-4 flex items-center justify-between"
          >

            <div>

              <div className="font-semibold">
                {item.action}
              </div>

            </div>

            <div className="text-green-400 text-sm">
              {item.status}
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}