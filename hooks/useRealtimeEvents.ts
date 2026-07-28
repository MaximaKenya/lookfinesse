"use client";

import { useEffect, useState } from "react";
import { subscribeToFinancialEvents } from "@/lib/realtime/financialChannel";

export type FinancialEvent = {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  amount?: number;
  metadata?: any;
  created_at: string;
};

export function useRealtimeEvents() {
  const [events, setEvents] = useState<FinancialEvent[]>([]);

  useEffect(() => {
    const channel = subscribeToFinancialEvents((payload) => {
      const event = payload.new as FinancialEvent;

      setEvents((prev) => [event, ...prev].slice(0, 100));
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return events;
}