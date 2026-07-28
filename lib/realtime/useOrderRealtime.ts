"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useOrderRealtime(orderId: string) {
  const router = useRouter();

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const order = payload.new as any;

          console.log("⚡ REALTIME ORDER UPDATE:", order);

          if (order.status === "paid") {
            router.push(`/order/${orderId}/success`);
          }

          if (order.status === "failed") {
            router.push(`/order/${orderId}/failed`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, router]);
}