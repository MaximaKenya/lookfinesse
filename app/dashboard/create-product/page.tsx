"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Package, Sparkles, Tag, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import CreatorPageShell from "@/components/creator/CreatorPageShell";
import { useVendorContext } from "@/hooks/useVendorContext";
import Link from "next/link";
import { Lock } from "lucide-react";

type MediaItem = { url: string; path: string };

const inputCls =
  "w-full h-12 px-4 rounded-2xl bg-black/60 border border-white/10 text-white placeholder-white/30 outline-none focus:border-cyan-500/60 transition-all";

const textareaCls =
  "w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/10 text-white placeholder-white/30 outline-none focus:border-cyan-500/60 resize-none transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

export default function CreateProductPage() {
  const router = useRouter();
  const { vendorId, storeId, loading: vendorLoading, isDemoMode, hasVendorStore } = useVendorContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [categories, setCategories] = useState<{ id: string; name: string; icon?: string }[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [stock, setStock] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryText, setCategoryText] = useState("fashion");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [productLimit, setProductLimit] = useState<{
    current: number;
    max: number | null;
    allowed: boolean;
    tier: string;
  } | null>(null);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name, icon")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    if (!vendorId) return;
    fetch(`/api/products/limit?vendor_id=${vendorId}`)
      .then((r) => r.json())
      .then(setProductLimit)
      .catch(() => setProductLimit(null));
  }, [vendorId]);

  const uploadPathPrefix = storeId ?? vendorId ?? "products";

  const uploadFile = async (file: File) => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `${uploadPathPrefix}/${fileName}`;

    const { error } = await supabase.storage.from("product-images").upload(filePath, file);
    if (error) throw error;

    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
    return { url: data.publicUrl, path: filePath };
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const results = await Promise.all(Array.from(files).map(uploadFile));
      setMedia((prev) => [...prev, ...results]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!vendorId) return toast.error("Vendor context unavailable");
    if (productLimit && !productLimit.allowed) {
      return toast.error("Product limit reached — upgrade your plan");
    }
    if (!name || !price || stock === "") return toast.error("Fill all required fields");

    setSubmitting(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          store_id: storeId,
          name,
          price: Number(price),
          inventory: Number(stock),
          stock: Number(stock),
          description,
          category_id: categoryId || undefined,
          category: categoryId ? undefined : categoryText,
          images: media.map((m) => m.url),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PRODUCT_LIMIT") {
          toast.error(data.error);
          if (vendorId) {
            fetch(`/api/products/limit?vendor_id=${vendorId}`)
              .then((r) => r.json())
              .then(setProductLimit);
          }
        }
        throw new Error(data.error || "Failed");
      }

      toast.success("Product published!");
      router.push(`/product/${data.product.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setSubmitting(false);
    }
  };

  const productHealth = (() => {
    let s = 0;
    if (name.length > 3) s += 25;
    if (description.length > 20) s += 25;
    if (media.length > 0) s += 25;
    if (price && (categoryId || categoryText)) s += 25;
    return s;
  })();

  return (
    <CreatorPageShell
      title="Create Product"
      subtitle="List a new product in your shop"
      maxWidth="6xl"
      isDemoMode={isDemoMode}
      hasVendorStore={hasVendorStore}
    >
      {productLimit && productLimit.max != null && (
        <div
          className={`mb-6 rounded-2xl border px-4 py-3 flex items-start gap-3 ${
            productLimit.allowed
              ? "border-cyan-500/25 bg-cyan-500/10"
              : "border-amber-500/30 bg-amber-500/10"
          }`}
        >
          {!productLimit.allowed && <Lock className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />}
          <div className="text-sm">
            <p className={productLimit.allowed ? "text-cyan-100" : "text-amber-100 font-semibold"}>
              {productLimit.allowed
                ? `${productLimit.current} / ${productLimit.max} products used (${productLimit.tier} plan)`
                : `Product limit reached (${productLimit.max} on ${productLimit.tier})`}
            </p>
            {!productLimit.allowed && (
              <Link
                href="/dashboard/subscription"
                className="text-amber-200 underline text-xs mt-1 inline-block hover:text-amber-100"
              >
                Upgrade to add more products →
              </Link>
            )}
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/8 rounded-[32px] p-8 space-y-6">
            <div className="flex items-center gap-3">
              <Sparkles className="text-cyan-400" size={18} />
              <h2 className="text-xl font-bold">Product Details</h2>
            </div>

            <Field label="Product Name *">
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ankara Blazer — Desert Gold" />
            </Field>

            <Field label="Description">
              <textarea className={textareaCls} rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Materials, sizing, benefits…" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (KES) *">
                <input className={inputCls} type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="2500" />
              </Field>
              <Field label="Inventory *">
                <input className={inputCls} type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} placeholder="20" />
              </Field>
            </div>

            <Field label="Category *">
              {categories.length > 0 ? (
                <select className={inputCls} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ` : ""}{c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <select className={inputCls} value={categoryText} onChange={(e) => setCategoryText(e.target.value)}>
                  {["fashion", "beauty", "fitness", "wellness", "accessories"].map((c) => (
                    <option key={c} value={c} className="capitalize">{c}</option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/8 rounded-[32px] p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImagePlus className="text-purple-400" size={18} />
                <div>
                  <h2 className="text-xl font-bold">Product Images</h2>
                  <p className="text-zinc-500 text-sm">First image is the cover</p>
                </div>
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 h-10 px-4 rounded-2xl bg-white/5 border border-white/10 text-sm">
                <Upload size={14} /> Upload
              </button>
            </div>

            <input ref={fileInputRef} type="file" multiple hidden accept="image/*" onChange={(e) => handleFiles(e.target.files)} />

            {media.length === 0 ? (
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-white/10 rounded-3xl p-12 text-center cursor-pointer hover:border-cyan-500/40">
                {uploading ? <p className="text-zinc-400 animate-pulse">Uploading…</p> : <p className="text-zinc-400 text-sm">Click to upload images</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {media.map((m, i) => (
                  <div key={m.path} className="relative rounded-2xl overflow-hidden border border-white/10 aspect-square">
                    <img src={m.url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && <span className="absolute top-2 left-2 text-[10px] bg-cyan-500 text-black px-2 py-0.5 rounded-full font-bold">Cover</span>}
                    <button type="button" onClick={() => setMedia((prev) => prev.filter((x) => x.path !== m.path))} className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center">
                      <Trash2 size={18} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/8 rounded-[32px] p-6">
            <div className="flex items-center gap-3 mb-5">
              <Package className="text-green-400" size={18} />
              <h3 className="font-bold text-lg">Listing Health</h3>
            </div>
            <div className="text-5xl font-black">{productHealth}<span className="text-2xl text-zinc-500">%</span></div>
          </div>

          <div className="bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/8 rounded-[32px] p-6">
            <div className="flex items-center gap-3 mb-5">
              <Tag className="text-cyan-400" size={18} />
              <h3 className="font-bold text-lg">Publish</h3>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting || vendorLoading || productHealth < 75 || (productLimit != null && !productLimit.allowed)}
              className="w-full h-12 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-black flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Publish Product"}
            </button>
          </div>
        </div>
      </div>
    </CreatorPageShell>
  );
}
