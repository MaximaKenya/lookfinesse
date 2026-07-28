"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { formatKES } from "@/lib/finance/format";

export default function VendorFinanceCenter() {
  const [data, setData] = useState({
    earnings: 0,
    settlements: 0,
    exposure: 0,
  });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("vendor_finance").select("*");

      if (!data) return;

      const totals = data.reduce(
        (acc, row) => {
          acc.earnings += row.earnings || 0;
          acc.settlements += row.settlements || 0;
          acc.exposure += row.exposure || 0;
          return acc;
        },
        { earnings: 0, settlements: 0, exposure: 0 }
      );

      setData(totals);
    };

    load();
  }, []);

  return (
    <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
      <h2 className="text-2xl font-bold mb-6">
        Vendor Finance Center
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-800 rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Vendor Earnings</p>
          <h3 className="text-2xl font-bold mt-2">
            {formatKES(data.earnings)}
          </h3>
        </div>

        <div className="bg-zinc-800 rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Pending Settlements</p>
          <h3 className="text-2xl font-bold mt-2">
            {formatKES(data.settlements)}
          </h3>
        </div>

        <div className="bg-zinc-800 rounded-2xl p-4">
          <p className="text-gray-400 text-sm">Refund Exposure</p>
          <h3 className="text-2xl font-bold mt-2">
            {formatKES(data.exposure)}
          </h3>
        </div>
      </div>
    </div>
  );
}