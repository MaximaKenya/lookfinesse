"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import { requireRole } from "@/lib/auth/roles";


export default function LedgerPage() {
  const [ledger, setLedger] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("ledger_entries")
        .select("*")
        .order("created_at", { ascending: false });

      setLedger(data || []);
    };

    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Ledger</h1>

      <table className="w-full border">
        <thead>
          <tr>
            <th>Type</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Vendor</th>
          </tr>
        </thead>

        <tbody>
          {ledger.map((l) => (
            <tr key={l.id}>
              <td>{l.type}</td>
              <td>{l.category}</td>
              <td>KES {l.amount}</td>
              <td>{l.vendor_id || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}