"use client";

import { useState } from "react";

export default function KYCPage() {
  const [form, setForm] = useState({
    full_name: "",
    id_number: "",
    document_url: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendor/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "KYC submission failed");
        return;
      }

      alert("KYC submitted");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Vendor Verification</h1>

      <input
        placeholder="Full Name"
        className="border p-2 w-full"
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
      />

      <input
        placeholder="ID Number"
        className="border p-2 w-full"
        value={form.id_number}
        onChange={(e) => setForm({ ...form, id_number: e.target.value })}
      />

      <input
        placeholder="Document URL"
        className="border p-2 w-full"
        value={form.document_url}
        onChange={(e) => setForm({ ...form, document_url: e.target.value })}
      />

      <button
        onClick={submit}
        disabled={submitting}
        className="bg-green-600 text-white px-4 py-2 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit KYC"}
      </button>
    </div>
  );
}
