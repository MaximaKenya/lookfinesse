"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
  import { generateInvoice } from "@/lib/invoice/generateInvoice";


export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: userData } = await supabase.auth.getUser();

      const user = userData.user;

      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      setOrders(data || []);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <p className="p-6">Loading orders...</p>;
  }


<button onClick={() => generateInvoice(orders)}>
  Download Invoice
</button>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border rounded-xl p-4 bg-white shadow-sm"
            >
              <p className="font-semibold">Order #{order.id}</p>
              <p>Total: KES {order.total}</p>
              <p className="text-sm text-gray-500">
                Status: {order.status}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}