// /app/dashboard/kyc/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function KYCPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("not_submitted");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const upload = async () => {
    if (!file || !userId) return;

    // upload to storage
    const { data } = await supabase.storage
      .from("kyc")
      .upload(`docs/${userId}-${Date.now()}`, file);

    const publicUrl = data?.path;

    await fetch("/api/kyc/submit", {
      method: "POST",
      body: JSON.stringify({
        userId,
        documentUrl: publicUrl,
      }),
    });

    setStatus("pending");
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-6">
      <h1 className="text-2xl font-bold">KYC Verification</h1>

      <p>Status: {status}</p>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={upload}
        className="px-4 py-2 bg-white text-black rounded"
      >
        Upload ID
      </button>
    </div>
  );
}