"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Rocket, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

const CATEGORY_OPTIONS = ["fashion", "beauty", "fitness", "wellness", "style", "discover"];

export default function PromotePostPage() {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedPost, setSelectedPost] = useState<string>("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [budget, setBudget] = useState(500);
  const [bid, setBid] = useState(10);
  const [categories, setCategories] = useState<string[]>(["discover"]);
  const [city, setCity] = useState("");
  const [days, setDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data: v } = await supabase.from("vendors").select("id, business_name, name").eq("user_id", userId).maybeSingle();
      setVendor(v);
      if (!v?.id) return;
      const [{ data: p }, { data: f }] = await Promise.all([
        supabase.from("products").select("id, name, images, price").eq("store_id", v.id).limit(40),
        supabase.from("feed_posts").select("id, caption, thumbnail_url, media_urls, type").eq("vendor_id", v.id).order("created_at", { ascending: false }).limit(40),
      ]);
      setProducts(p ?? []);
      setPosts(f ?? []);
    })();
  }, [userId]);

  const selectedPostObj = useMemo(() => posts.find((p) => p.id === selectedPost), [posts, selectedPost]);
  const selectedProductObj = useMemo(() => products.find((p) => p.id === selectedProduct), [products, selectedProduct]);

  useEffect(() => {
    if (selectedPostObj) {
      setHeadline((h) => h || selectedPostObj.caption?.slice(0, 60) || "Check out my latest drop");
      setImageUrl((u) => u || selectedPostObj.thumbnail_url || selectedPostObj.media_urls?.[0] || "");
    }
  }, [selectedPostObj]);

  useEffect(() => {
    if (selectedProductObj) {
      setHeadline((h) => h || selectedProductObj.name);
      setImageUrl((u) => u || (Array.isArray(selectedProductObj.images) ? selectedProductObj.images[0] : "") || "");
    }
  }, [selectedProductObj]);

  const toggleCategory = (c: string) => {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const submit = async () => {
    if (!vendor?.id) return toast.error("No vendor profile found");
    if (!headline || !imageUrl) return toast.error("Headline and image are required");
    setSubmitting(true);
    const now = new Date();
    const end = new Date(now.getTime() + days * 86400000);
    const ctaUrl = selectedProductObj
      ? `/product/${selectedProductObj.id}`
      : selectedPostObj
      ? `/feed/${selectedPostObj.id}`
      : `/creator/${vendor.id}`;
    const payload = {
      vendor_id: vendor.id,
      product_id: selectedProduct || null,
      title: headline,
      headline,
      description,
      image_url: imageUrl,
      cta_text: selectedProductObj ? "Shop now" : "View",
      cta_url: ctaUrl,
      target_categories: categories,
      target_location: city || null,
      daily_budget: budget,
      bid_amount: bid,
      start_at: now.toISOString(),
      end_at: end.toISOString(),
      status: "active",
      total_impressions: 0,
      total_clicks: 0,
    };
    const res = await fetch("/api/ads/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (!res.ok) return toast.error("Couldn't launch campaign — check setup");
    toast.success("Campaign live!");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <header>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Rocket className="w-6 h-6 text-pink-400" /> Promote</h1>
          <p className="text-sm text-white/40">Boost a post or product into personalized feed ads.</p>
        </header>

        {!vendor && (
          <div className="bg-yellow-500/8 border border-yellow-500/20 text-yellow-300 text-sm rounded-2xl px-4 py-3">
            You need a vendor profile to run promotions.{" "}
            <Link href="/dashboard/vendor/onboarding" className="underline">Become a vendor</Link>
          </div>
        )}

        <section className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 space-y-4">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">1. What are you promoting?</h2>
          {products.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-white/60">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
              >
                <option value="" className="bg-black">— none —</option>
                {products.map((p) => <option key={p.id} value={p.id} className="bg-black">{p.name} · KES {p.price?.toLocaleString()}</option>)}
              </select>
            </div>
          )}
          {posts.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs text-white/60">Or a feed post</label>
              <select
                value={selectedPost}
                onChange={(e) => setSelectedPost(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
              >
                <option value="" className="bg-black">— none —</option>
                {posts.map((p) => <option key={p.id} value={p.id} className="bg-black">{(p.caption || p.type || "Untitled").slice(0, 60)}</option>)}
              </select>
            </div>
          )}
        </section>

        <section className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 space-y-4">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">2. Ad creative</h2>
          <div className="space-y-2">
            <label className="text-xs text-white/60">Headline</label>
            <input
              value={headline}
              maxLength={70}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/60">Description</label>
            <textarea
              value={description}
              rows={2}
              maxLength={140}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25 resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/60">Image URL</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
            />
            {imageUrl && (
              <div className="mt-2 aspect-[16/7] rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </section>

        <section className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 space-y-4">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest">3. Targeting & budget</h2>
          <div className="space-y-2">
            <label className="text-xs text-white/60">Categories</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => toggleCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize border ${
                    categories.includes(c)
                      ? "bg-white text-black border-white"
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <label className="text-xs text-white/60">Daily budget (KES)</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/60">Bid per click</label>
              <input
                type="number"
                value={bid}
                onChange={(e) => setBid(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/60">Days</label>
              <input
                type="number"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/60">City (optional)</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Nairobi, Mombasa, …"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/25"
            />
          </div>
        </section>

        <button
          onClick={submit}
          disabled={submitting || !vendor}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-2xl font-bold hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Launching…</> : <><Sparkles className="w-4 h-4" /> Launch campaign</>}
        </button>
        <p className="text-center text-[11px] text-white/30">
          Ads run on the home feed via personalized targeting. You can pause anytime from Dashboard.
        </p>
      </div>
    </div>
  );
}
