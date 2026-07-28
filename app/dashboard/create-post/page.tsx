"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone, Music, Plus } from "lucide-react";
import { toast } from "sonner";
import MediaUploader, { type MediaValue } from "@/components/ui/MediaUploader";
import CreatorPageShell from "@/components/creator/CreatorPageShell";
import CreatorAttachCommerce from "@/components/creator/CreatorAttachCommerce";
import { useVendorContext } from "@/hooks/useVendorContext";
import { FEED_CATEGORIES } from "@/lib/creator/constants";

const blank: MediaValue = { mode: "image", url: "", items: [] };

const POST_TYPES = [
  { id: "product", label: "Product Drop" },
  { id: "service", label: "Service Promo" },
  { id: "tutorial", label: "Tutorial" },
  { id: "transformation", label: "Transformation" },
  { id: "workout", label: "Workout" },
  { id: "style_drop", label: "Style Drop" },
  { id: "before_after", label: "Before / After" },
];

export default function CreatePostPage() {
  const router = useRouter();
  const { vendorId, storeId, loading, isDemoMode, hasVendorStore } = useVendorContext();
  const [media, setMedia] = useState<MediaValue>(blank);
  const [audioUrl, setAudioUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [postType, setPostType] = useState("product");
  const [feedCategory, setFeedCategory] = useState("discover");
  const [hashtags, setHashtags] = useState("");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [promoteAsAd, setPromoteAsAd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!vendorId) return toast.error("Vendor context unavailable");
    if (!media.url && media.items.length === 0) return toast.error("Add at least one image or video");

    setSubmitting(true);
    const mediaItems =
      media.mode === "carousel"
        ? media.items
        : [{ url: media.url, type: media.mode === "video" ? "video" : "image" }];

    const payload = {
      vendor_id: vendorId,
      type: postType,
      feed_category: feedCategory,
      caption,
      hashtags,
      thumbnail_url: mediaItems[0]?.url ?? null,
      media_urls: mediaItems.map((i) => i.url),
      video_url: media.mode === "video" ? media.url : null,
      audio_url: audioUrl || null,
      product_ids: productIds,
      service_ids: serviceIds,
      promote_as_ad: promoteAsAd,
    };

    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish");

      toast.success(promoteAsAd ? "Posted & ad campaign queued!" : "Posted!");
      if (promoteAsAd && data.campaign?.id) {
        router.push("/dashboard/ads");
      } else {
        router.push("/feed");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CreatorPageShell
      title="Create Feed Post"
      subtitle="Rich media — images, video, audio, carousel — with shoppable links"
      isDemoMode={isDemoMode}
      hasVendorStore={hasVendorStore}
    >
      <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/8 rounded-3xl p-6">
        <MediaUploader
          label="Post media"
          bucket="products"
          value={media}
          onChange={setMedia}
          aspect="square"
          pathPrefix={`feed/${vendorId ?? "anon"}`}
        />
      </div>

      <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/8 rounded-3xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Type</label>
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
            >
              {POST_TYPES.map((t) => (
                <option key={t.id} value={t.id} className="bg-black">
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Feed Tab</label>
            <select
              value={feedCategory}
              onChange={(e) => setFeedCategory(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
            >
              {FEED_CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-black capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Caption</label>
          <textarea
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write something…"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">Hashtags</label>
          <input
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="#NairobiStyle #GlowUp"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-white/40 uppercase tracking-widest flex items-center gap-1">
            <Music className="w-3 h-3" /> Audio URL (optional)
          </label>
          <input
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="https://… .mp3 / .m4a"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
          />
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
        />
      )}

      <label className="flex items-center gap-3 cursor-pointer rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3">
        <input
          type="checkbox"
          checked={promoteAsAd}
          onChange={(e) => setPromoteAsAd(e.target.checked)}
          className="rounded border-white/20"
        />
        <div>
          <p className="text-sm font-semibold text-purple-200 flex items-center gap-1.5">
            <Megaphone className="w-4 h-4" /> Promote as ad
          </p>
          <p className="text-xs text-white/40">Queue a hero carousel campaign after publishing</p>
        </div>
      </label>

      <button
        onClick={submit}
        disabled={submitting || loading}
        className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl font-bold hover:bg-white/90 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Posting…
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" /> Publish post
          </>
        )}
      </button>
    </CreatorPageShell>
  );
}
