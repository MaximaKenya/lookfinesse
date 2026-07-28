"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { requireRole } from "@/lib/auth/roles";


export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    payments: 0,
  });

  useEffect(() => {
    const load = async () => {
      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .eq("status", "paid");

      const revenue =
        payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        revenue,
        orders: payments?.length || 0,
        payments: payments?.length || 0,
      });
    };

    load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <p>Total Revenue</p>
          <h2 className="text-xl font-bold">KES {stats.revenue}</h2>
        </div>

        <div className="p-4 border rounded">
          <p>Total Orders</p>
          <h2>{stats.orders}</h2>
        </div>

        <div className="p-4 border rounded">
          <p>Successful Payments</p>
          <h2>{stats.payments}</h2>
        </div>
      </div>
    </div>
  );
}