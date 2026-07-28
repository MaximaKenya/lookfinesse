// /app/dashboard/admin/kyc/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminKYCPage() {
  const [kycList, setKycList] = useState<any[]>([]);
  const [adminId, setAdminId] = useState<string | null>(null);

  // ✅ load function FIRST
  const load = async () => {
    const { data } = await supabase
      .from("kyc_verifications")
      .select("*")
      .eq("status", "pending");

    setKycList(data || []);
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setAdminId(data.user.id);

      await load(); // safe now
    };

    init();
  }, []);

  const approve = async (id: string) => {
    await fetch("/api/admin/kyc/approve", {
      method: "POST",
      body: JSON.stringify({
        kycId: id,
        adminId,
      }),
    });

    load();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-4">KYC Approvals</h1>

      {kycList.map((k) => (
        <div key={k.id} className="p-4 border mb-2">
          <p>User: {k.user_id}</p>
          <p>Status: {k.status}</p>

          <button
            onClick={() => approve(k.id)}
            className="mt-2 px-3 py-1 bg-green-500"
          >
            Approve
          </button>
        </div>
      ))}
    </div>
  );
}