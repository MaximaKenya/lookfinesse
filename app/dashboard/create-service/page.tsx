"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import CreatorPageShell from "@/components/creator/CreatorPageShell";
import { useVendorContext } from "@/hooks/useVendorContext";
import { SERVICE_CATEGORIES } from "@/lib/creator/constants";

export default function CreateServicePage() {
  const router = useRouter();
  const { vendorId, loading, isDemoMode, hasVendorStore } = useVendorContext();

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    duration_minutes: "60",
    category: "fitness",
    max_participants: "1",
    slot_count: "5",
    is_virtual: true,
    is_in_person: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async () => {
    if (!vendorId) return toast.error("Vendor context unavailable");
    if (!form.title.trim() || !form.price) return toast.error("Title and price required");

    setSubmitting(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          title: form.title.trim(),
          short_description: form.description.trim() || form.title.trim(),
          description: form.description.trim() || form.title.trim(),
          category: form.category,
          price: Number(form.price),
          duration_minutes: Number(form.duration_minutes) || 60,
          max_participants: Number(form.max_participants) || 1,
          is_virtual: form.is_virtual,
          is_in_person: form.is_in_person,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      const slotCount = Number(form.slot_count) || 0;
      if (slotCount > 0 && data.service?.id) {
        await Promise.all(
          Array.from({ length: slotCount }, (_, i) => {
            const start = new Date(Date.now() + (i + 1) * 86400000);
            start.setHours(10, 0, 0, 0);
            const end = new Date(start.getTime() + (Number(form.duration_minutes) || 60) * 60000);
            return fetch("/api/availability", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                vendor_id: vendorId,
                service_id: data.service.id,
                starts_at: start.toISOString(),
                ends_at: end.toISOString(),
              }),
            });
          })
        ).catch(() => null);
      }

      toast.success("Service published!");
      router.push(`/services/${data.service.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500/40";

  return (
    <CreatorPageShell
      title="Create Service"
      subtitle="Bookable sessions linked from your creator profile"
      isDemoMode={isDemoMode}
      hasVendorStore={hasVendorStore}
    >
      <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/8 rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-purple-300">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-semibold">Service details</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/60">Service name *</label>
          <input className={inputCls} value={form.title} onChange={set("title")} placeholder="1-on-1 PT Session — 45 mins" />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/60">Description</label>
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={set("description")} placeholder="What's included, who it's for…" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-white/60 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Duration (mins)</label>
            <input className={inputCls} type="number" value={form.duration_minutes} onChange={set("duration_minutes")} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/60">Price (KES) *</label>
            <input className={inputCls} type="number" value={form.price} onChange={set("price")} placeholder="2500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm text-white/60">Category</label>
            <select className={inputCls} value={form.category} onChange={set("category")}>
              {SERVICE_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-black capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-white/60 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Open slots to seed</label>
            <input className={inputCls} type="number" min={0} max={14} value={form.slot_count} onChange={set("slot_count")} />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_virtual} onChange={(e) => setForm((f) => ({ ...f, is_virtual: e.target.checked }))} />
            <span className="text-white/70">Virtual</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_in_person} onChange={(e) => setForm((f) => ({ ...f, is_in_person: e.target.checked }))} />
            <span className="text-white/70">In-person</span>
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={handleCreate}
        disabled={submitting || loading}
        className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl font-bold disabled:opacity-60"
      >
        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Service"}
      </button>
    </CreatorPageShell>
  );
}
