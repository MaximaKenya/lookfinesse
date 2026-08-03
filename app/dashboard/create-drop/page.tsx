"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useVendorContext } from "@/hooks/useVendorContext";

export default function CreateDropPage() {
  const { vendorId } = useVendorContext();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    product_id: "",
    sale_price: "",
    starts_at: "",
    ends_at: "",
    max_holds: "40",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      toast.error("Vendor context required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/drops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          title: form.title,
          description: form.description || null,
          product_id: form.product_id || null,
          sale_price: form.sale_price ? Number(form.sale_price) : null,
          starts_at: new Date(form.starts_at).toISOString(),
          ends_at: new Date(form.ends_at).toISOString(),
          max_holds: Number(form.max_holds) || 40,
        }),
      });
      const data = await res.json();
      if (!res.ok && !data.ok) {
        toast.error(data.error ?? "Failed to create drop");
        return;
      }
      toast.success("Drop scheduled");
      router.push("/drops");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-1">Schedule flash drop</h1>
      <p className="text-sm text-white/45 mb-6">
        Tie a timed sale to inventory holds. Link a live session from Create Live if needed.
      </p>
      <form onSubmit={submit} className="space-y-4">
        {(
          [
            ["title", "Title", "text"],
            ["description", "Description", "text"],
            ["product_id", "Product ID (optional UUID)", "text"],
            ["sale_price", "Sale price (KES)", "number"],
            ["starts_at", "Starts", "datetime-local"],
            ["ends_at", "Ends", "datetime-local"],
            ["max_holds", "Max holds", "number"],
          ] as const
        ).map(([key, label, type]) => (
          <label key={key} className="block">
            <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>
            <input
              type={type}
              required={key === "title" || key === "starts_at" || key === "ends_at"}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none focus:border-cyan-500/40"
            />
          </label>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Publish drop
        </button>
      </form>
    </div>
  );
}
