"use client";

import { useEffect, useState } from "react";

import {
  subscribeToPayouts,
} from "@/lib/realtime/channels";

interface FeedItem {
  id: string;
  message: string;
}

export default function LivePayoutFeed() {
  const [feed, setFeed] = useState<
    FeedItem[]
  >([]);

  useEffect(() => {
    const channel =
      subscribeToPayouts((payload: any) => {
        setFeed((prev) => [
          {
            id: crypto.randomUUID(),
            message: `Payout updated: ${payload.eventType}`,
          },
          ...prev,
        ]);
      });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="bg-gray-900 p-5 rounded-2xl">
      <h2 className="text-xl font-semibold mb-4">
        Live Payout Feed
      </h2>

      <div className="space-y-2">
        {feed.map((item) => (
          <div
            key={item.id}
            className="bg-gray-800 p-2 rounded"
          >
            {item.message}
          </div>
        ))}
      </div>
    </div>
  );
}