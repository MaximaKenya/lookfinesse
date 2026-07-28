"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Order = {
  id: string;
  status: "pending" | "processing" | "paid" | "failed";
  total: number;
  created_at?: string;
};

export default function OrderPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/orders/${orderId}`);

        if (!res.ok) {
          throw new Error("Failed to fetch order");
        }

        const data = await res.json();

        setOrder(data);
      } catch (err: any) {
        console.error(err);
        setError("Could not load order. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const statusColor = (status?: string) => {
    switch (status) {
      case "paid":
        return "text-green-400";
      case "processing":
        return "text-yellow-400";
      case "failed":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse text-center space-y-2">
          <div className="text-xl">Loading order...</div>
          <div className="text-gray-500 text-sm">Fetching latest details</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400">
        <div className="text-center space-y-3">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-black rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-red-400">
        Order not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-zinc-900 rounded-2xl p-6 shadow-lg border border-zinc-800">
        
        <h1 className="text-2xl font-bold mb-4">
          Order <span className="text-gray-400">#{order.id}</span>
        </h1>

        <div className="space-y-4">

          <div className="flex justify-between">
            <span className="text-gray-400">Status</span>
            <span className={`font-semibold ${statusColor(order.status)}`}>
              {order.status?.toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Total</span>
            <span className="font-semibold">
              KES {order.total?.toLocaleString()}
            </span>
          </div>

          {order.created_at && (
            <div className="flex justify-between">
              <span className="text-gray-400">Created</span>
              <span>
                {new Date(order.created_at).toLocaleString()}
              </span>
            </div>
          )}

        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 text-sm text-gray-400">
          We’ll update this page as your order progresses.
        </div>
      </div>
    </div>
  );
}