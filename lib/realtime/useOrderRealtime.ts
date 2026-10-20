"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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