"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Image, Loader2, Video, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import CreatorPageShell from "@/components/creator/CreatorPageShell";
import CreatorAttachCommerce from "@/components/creator/CreatorAttachCommerce";
import { useVendorContext } from "@/hooks/useVendorContext";
import { FEED_CATEGORIES } from "@/lib/creator/constants";

export default function CreateReelPage() {
  const router = useRouter();
  const { vendorId, storeId, loading, isDemoMode, hasVendorStore } = useVendorContext();
  const thumbRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    caption: "",
    video_url: "",
    thumbnail_url: "",
    hashtags: "",
    category: "discover",
  });
  const [productIds, setProductIds] = useState<string[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const uploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingThumb(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `reels/${Date.now()}-${Math.random()}.${ext}`;
      const { data, error } = await supabase.storage.from("products").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: url } = supabase.storage.from("products").getPublicUrl(data.path);
      setForm((f) => ({ ...f, thumbnail_url: url.publicUrl }));
      toast.success("Thumbnail uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleCreate = async () => {
    if (!vendorId) {
      toast.error("Vendor context unavailable");
      return;
    }
    if (!form.video_url.trim()) {
      toast.error("Video URL is required");
      return;
    }
    if (!form.caption.trim()) {
      toast.error("Caption is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          caption: form.caption.trim(),
          video_url: form.video_url.trim(),
          thumbnail_url: form.thumbnail_url || null,
          hashtags: form.hashtags,
          category: form.category,
          product_ids: productIds,
          service_ids: serviceIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setSaved(true);
      toast.success("Reel published!");
      setTimeout(() => router.push("/reels"), 1200);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to publish reel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CreatorPageShell
      title="Create Reel"
      subtitle="Short-form video with shoppable products & bookable services"
      isDemoMode={isDemoMode}
      hasVendorStore={hasVendorStore}
    >
      <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/8 rounded-3xl p-6 space-y-5">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-white/60">
            <Video className="w-4 h-4" />
            Video URL *
          </label>
          <input
            value={form.video_url}
            onChange={set("video_url")}
            placeholder="https://… (direct .mp4 or embed URL)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/25"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60">Caption *</label>
          <textarea
            value={form.caption}
            onChange={set("caption")}
            placeholder="Describe your reel — hashtags welcome"
            rows={3}
            maxLength={300}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none resize-none"
          />
          <div className="text-right text-[11px] text-white/25">{form.caption.length}/300</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Category</label>
            <select
              value={form.category}
              onChange={set("category")}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
            >
              {FEED_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-black capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Tags</label>
            <input
              value={form.hashtags}
              onChange={set("hashtags")}
              placeholder="#fitness #style"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-white/60">
            <Image className="w-4 h-4" />
            Thumbnail
          </label>
          <div className="flex gap-2">
            <input
              value={form.thumbnail_url}
              onChange={set("thumbnail_url")}
              placeholder="Paste image URL or upload"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm"
            />
            <button
              type="button"
              onClick={() => thumbRef.current?.click()}
              disabled={uploadingThumb}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 px-4 py-3 rounded-xl text-sm disabled:opacity-50"
            >
              {uploadingThumb ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
            </button>
          </div>
          {form.thumbnail_url && (
            <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10">
              <img src={form.thumbnail_url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, thumbnail_url: "" }))}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
          <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={uploadThumbnail} />
        </div>
      </div>

      {!loading && vendorId && (
        <CreatorAttachCommerce
          vendorId={vendorId}
          storeId={storeId}
          productIds={productIds}
          serviceIds={serviceIds}
          onProductsChange={setProductIds}
          onServicesChange={setServiceIds}
          label="Shoppable attachments"
        />
      )}

      <button
        onClick={handleCreate}
        disabled={saving || saved || loading}
        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-black py-4 rounded-2xl font-bold disabled:opacity-70"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Publishing…
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-700" /> Published!
          </>
        ) : (
          "Publish Reel"
        )}
      </button>
    </CreatorPageShell>
  );
}
