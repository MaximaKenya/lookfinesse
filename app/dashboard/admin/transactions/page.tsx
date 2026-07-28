"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { requireRole } from "@/lib/auth/roles";


export default function TransactionsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    setPayments(data || []);
    setLoading(false);
  };

useEffect(() => {
  const loadPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Fetch error:", error);
      return;
    }

    setPayments(data || []);
    setLoading(false);
  };

  loadPayments();
}, []);
  const retryPayment = async (id: string) => {
    const res = await fetch("/api/payments/retry", {
      method: "POST",
      body: JSON.stringify({ paymentId: id }),
    });

    const data = await res.json();

    if (data.url) {
      window.open(data.url, "_blank");
    } else {
      alert(data.message);
    }

    fetchPayments();
  };

  if (loading) return <p className="p-6">Loading...</p>;

  

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>

      <div className="overflow-x-auto">
        <table className="w-full border rounded-xl">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Provider</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-3">{p.order_id}</td>
                <td className="p-3">{p.provider}</td>
                <td className="p-3">KES {p.amount}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3">{p.phone || "-"}</td>
                <td className="p-3">
                  {p.status !== "paid" && (
                    <button
                      onClick={() => retryPayment(p.id)}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}