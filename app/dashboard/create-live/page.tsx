"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, CheckCircle2, Image, Info, Loader2, Radio, Video } from "lucide-react";
import { toast } from "sonner";
import CreatorPageShell from "@/components/creator/CreatorPageShell";
import CreatorAttachCommerce from "@/components/creator/CreatorAttachCommerce";
import { useVendorContext } from "@/hooks/useVendorContext";

export default function CreateLivePage() {
  const router = useRouter();
  const { vendorId, storeId, loading, isDemoMode, hasVendorStore } = useVendorContext();

  const [form, setForm] = useState({
    title: "",
    description: "",
    scheduled_for: "",
    cover_url: "",
    stream_url: "",
  });
  const [productIds, setProductIds] = useState<string[]>([]);
  const [goLiveNow, setGoLiveNow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async () => {
    if (!vendorId) {
      toast.error("Vendor context unavailable");
      return;
    }
    if (!form.title.trim()) {
      toast.error("Session title is required");
      return;
    }
    if (!goLiveNow && !form.scheduled_for) {
      toast.error("Set a scheduled date or go live now");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/live-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          title: form.title.trim(),
          description: form.description.trim() || null,
          scheduled_for: goLiveNow ? new Date().toISOString() : new Date(form.scheduled_for).toISOString(),
          is_live: goLiveNow,
          cover_url: form.cover_url || null,
          stream_url: form.stream_url || null,
          product_ids: productIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setSaved(true);
      toast.success(goLiveNow ? "You're live!" : "Session scheduled!");
      setTimeout(() => router.push(`/live/${data.id}`), 1200);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/25";

  return (
    <CreatorPageShell
      title="Go Live"
      subtitle="Schedule or start a live commerce session"
      isDemoMode={isDemoMode}
      hasVendorStore={hasVendorStore}
    >
      <div
        onClick={() => setGoLiveNow(!goLiveNow)}
        className={`cursor-pointer border rounded-3xl p-5 flex items-start gap-4 transition-all ${
          goLiveNow ? "bg-red-500/10 border-red-500/30" : "bg-[#0f0f0f]/80 border-white/8"
        }`}
      >
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${goLiveNow ? "bg-red-500/20" : "bg-white/5"}`}>
          <Radio className={`w-5 h-5 ${goLiveNow ? "text-red-400" : "text-white/40"}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-white">Go Live Now</p>
            <div className={`w-11 h-6 rounded-full transition-all ${goLiveNow ? "bg-red-500" : "bg-white/15"}`}>
              <div className={`w-5 h-5 bg-white rounded-full mt-0.5 transition-all ${goLiveNow ? "ml-5" : "ml-0.5"}`} />
            </div>
          </div>
          <p className="text-sm text-white/40 mt-0.5">Start broadcasting immediately</p>
        </div>
      </div>

      <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/8 rounded-3xl p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60">Session Title *</label>
          <input className={inputCls} value={form.title} onChange={set("title")} maxLength={80} placeholder="Full Body HIIT — Live Burn" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60">Description</label>
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={set("description")} placeholder="What will you cover?" />
        </div>

        {!goLiveNow && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-white/60">
              <Calendar className="w-4 h-4" /> Scheduled For *
            </label>
            <input type="datetime-local" className={`${inputCls} [color-scheme:dark]`} value={form.scheduled_for} onChange={set("scheduled_for")} min={new Date().toISOString().slice(0, 16)} />
          </div>
        )}

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-white/60">
            <Image className="w-4 h-4" /> Cover Image URL
          </label>
          <input className={inputCls} value={form.cover_url} onChange={set("cover_url")} placeholder="https://…" />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-white/60">
            <Video className="w-4 h-4" /> Stream URL
          </label>
          <input className={inputCls} value={form.stream_url} onChange={set("stream_url")} placeholder="YouTube Live / Twitch embed URL" />
          <div className="flex items-start gap-1.5 text-xs text-white/30">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Use a YouTube Live or Twitch embed URL for inline playback.
          </div>
        </div>
      </div>

      {!loading && vendorId && (
        <CreatorAttachCommerce
          vendorId={vendorId}
          storeId={storeId}
          productIds={productIds}
          serviceIds={[]}
          onProductsChange={setProductIds}
          onServicesChange={() => {}}
          allowServices={false}
          label="Linked products (live shopping)"
        />
      )}

      <button
        type="button"
        onClick={handleCreate}
        disabled={saving || saved || loading}
        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold disabled:opacity-70 ${
          goLiveNow ? "bg-red-500 hover:bg-red-400 text-white" : "bg-white hover:bg-white/90 text-black"
        }`}
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Creating…
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="w-5 h-5" /> {goLiveNow ? "You're Live!" : "Scheduled!"}
          </>
        ) : goLiveNow ? (
          "Go Live Now"
        ) : (
          "Schedule Session"
        )}
      </button>
    </CreatorPageShell>
  );
}
