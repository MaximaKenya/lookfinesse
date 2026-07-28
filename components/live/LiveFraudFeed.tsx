"use client";

import { useEffect, useState } from "react";

import {
  subscribeToFraud,
} from "@/lib/realtime/channels";

interface FraudFeed {
  id: string;
  message: string;
}

export default function LiveFraudFeed() {
  const [feed, setFeed] = useState<
    FraudFeed[]
  >([]);

  useEffect(() => {
    const channel =
      subscribeToFraud((payload: any) => {
        setFeed((prev) => [
          {
            id: crypto.randomUUID(),
            message: `Fraud alert detected`,
          },
          ...prev,
        ]);
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="bg-red-900/30 p-5 rounded-2xl">
      <h2 className="text-xl font-semibold mb-4">
        Live Fraud Feed
      </h2>

      <div className="space-y-2">
        {feed.map((item) => (
          <div
            key={item.id}
            className="bg-red-950/40 p-2 rounded"
          >
            {item.message}
          </div>
        ))}
      </div>
    </div>
  );
}