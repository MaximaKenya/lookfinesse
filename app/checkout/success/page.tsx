"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle } from "lucide-react";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");
  const bookingId = searchParams.get("bookingId");
  const subscriptionId = searchParams.get("subscriptionId");

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<{ id: string; total: number; user_id: string } | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const finalize = async () => {
      try {
        const { data: orderData } = await supabase
          .from("orders")
          .select("id, total, user_id")
          .eq("id", orderId)
          .single();

        setOrder(orderData ?? null);

        if (orderData?.user_id) {
          await supabase.from("cart").delete().eq("user_id", orderData.user_id);
        }
      } catch (err) {
        console.error("Success page error:", err);
      } finally {
        setLoading(false);
      }
    };

    finalize();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin h-10 w-10 border-4 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-5 backdrop-blur-xl">
      <div className="flex justify-center">
        <CheckCircle className="w-16 h-16 text-green-400" />
      </div>

      <div>
        <h1 className="text-2xl font-bold">Payment Successful</h1>
        <p className="text-gray-400 mt-2">
          {bookingId
            ? "Your booking is confirmed. See you at the session!"
            : subscriptionId
              ? "Your membership is now active."
              : "Your order has been confirmed and is being processed."}
        </p>
      </div>

      {order && (
        <div className="bg-black/30 border border-white/8 rounded-2xl p-4 text-sm text-left space-y-1">
          <div className="flex justify-between text-gray-400">
            <span>Order ID</span>
            <span className="font-mono text-white/70 truncate max-w-[160px]">{order.id}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Amount</span>
            <span className="text-white font-semibold">KES {Number(order.total).toLocaleString()}</span>
          </div>
        </div>
      )}

      {!orderId && (
        <p className="text-red-400 text-sm">Missing order reference.</p>
      )}

      <div className="space-y-3 pt-2">
        {bookingId && (
          <button
            onClick={() => router.push("/bookings")}
            className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            View Bookings
          </button>
        )}
        {orderId && (
          <button
            onClick={() => router.push(`/order/${orderId}`)}
            className="w-full bg-white text-black py-3 rounded-xl font-semibold hover:opacity-90 transition-all"
          >
            View Order
          </button>
        )}
        <button
          onClick={() => router.push("/")}
          className="w-full border border-white/10 text-white/60 py-3 rounded-xl text-sm hover:text-white hover:border-white/25 transition-all"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f11] via-[#111827] to-black text-white flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-white/40">Loading...</div>}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}
