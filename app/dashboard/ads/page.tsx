"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BarChart3,
  Plus,
  Pause,
  Play,
  Trash2,
  TrendingUp,
  Eye,
  MousePointerClick,
  DollarSign,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { useVendorContext } from "@/hooks/useVendorContext";
import { calculateAdBudget } from "@/lib/ads/budgetCalculator";
import SearchInput from "@/components/ui/SearchInput";
import type { CatalogProduct, CatalogService } from "@/components/creator/CreatorAttachCommerce";

interface Campaign {
  id: string;
  title: string;
  headline: string;
  image_url: string;
  cta_url: string;
  target_categories: string[];
  daily_budget: number;
  total_budget?: number;
  bid_amount: number;
  start_at: string;
  end_at: string;
  status: string;
  total_impressions: number;
  total_clicks: number;
  total_spent: number;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-zinc-500/15 text-zinc-300 border-zinc-500/25",
  pending_payment: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
  live: "bg-green-500/15 text-green-400 border-green-500/25",
  active: "bg-green-500/15 text-green-400 border-green-500/25",
  paused: "bg-white/10 text-white/50 border-white/15",
  completed: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  rejected: "bg-red-500/15 text-red-400 border-red-500/25",
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25",
};

const CATEGORIES = ["fashion", "beauty", "fitness", "wellness", "lifestyle", "food"];

export default function AdsManagerPage() {
  const { vendorId, storeId, loading: vendorLoading } = useVendorContext();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [campaignSearch, setCampaignSearch] = useState("");
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    headline: "",
    description: "",
    image_urls: [] as string[],
    cta_text: "Shop Now",
    product_id: "",
    service_id: "",
    target_categories: [] as string[],
    target_location: "",
    total_budget: 3500,
    start_at: "",
    payment_method: "wallet",
    mpesa_phone: "",
  });

  const budgetPreview = useMemo(
    () => calculateAdBudget(form.total_budget),
    [form.total_budget]
  );

  useEffect(() => {
    setForm((f) => ({
      ...f,
      start_at: f.start_at || new Date().toISOString().slice(0, 16),
    }));
  }, []);

  const loadCatalog = useCallback(async () => {
    if (!vendorId) return;
    const res = await fetch(`/api/vendor/catalog?vendor_id=${vendorId}`);
    const data = await res.json();
    setCatalogProducts(data.products ?? []);
    setCatalogServices(data.services ?? []);
  }, [vendorId]);

  const loadWallet = useCallback(async () => {
    const res = await fetch("/api/vendor/finance/overview");
    if (!res.ok) return;
    const data = await res.json();
    const bal = (data.wallets ?? []).reduce(
      (s: number, w: { balance?: number }) => s + Number(w.balance ?? 0),
      0
    );
    setWalletBalance(bal);
  }, []);

  useEffect(() => {
    loadCatalog();
    loadWallet();
  }, [loadCatalog, loadWallet]);

  const load = useCallback(async () => {
    if (!vendorId) return;
    setLoading(true);
    const res = await fetch(`/api/ads/campaigns?vendor_id=${vendorId}`);
    const data = await res.json();
    setCampaigns(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalImpressions = campaigns.reduce((s, c) => s + (c.total_impressions ?? 0), 0);
  const totalClicks = campaigns.reduce((s, c) => s + (c.total_clicks ?? 0), 0);
  const totalSpent = campaigns.reduce((s, c) => s + (c.total_spent ?? 0), 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const filteredCampaigns = useMemo(() => {
    if (!campaignSearch.trim()) return campaigns;
    const q = campaignSearch.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        c.target_categories.some((cat) => cat.toLowerCase().includes(q))
    );
  }, [campaigns, campaignSearch]);

  async function uploadImages(files: FileList | null) {
    if (!files?.length || !vendorId) return;
    setUploading(true);
    try {
      const prefix = storeId ?? vendorId;
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${prefix}/ads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setForm((f) => ({ ...f, image_urls: [...f.image_urls, ...urls] }));
      toast.success(`${urls.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function toggleStatus(c: Campaign) {
    const next = c.status === "live" || c.status === "active" ? "paused" : "live";
    await fetch(`/api/ads/campaigns/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  async function deleteCampaign(id: string) {
    if (!confirm("Cancel this campaign?")) return;
    await fetch(`/api/ads/campaigns/${id}`, { method: "DELETE" });
    load();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendorId) return;
    if (form.image_urls.length === 0) {
      toast.error("Upload at least one ad image");
      return;
    }
    if (form.payment_method === "wallet" && walletBalance !== null && walletBalance < form.total_budget) {
      toast.error(`Insufficient wallet balance (KES ${walletBalance.toLocaleString()})`);
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/ads/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_id: vendorId,
        title: form.title,
        headline: form.headline,
        description: form.description,
        image_urls: form.image_urls,
        cta_text: form.cta_text,
        product_id: form.product_id || undefined,
        service_id: form.service_id || undefined,
        target_categories: form.target_categories,
        target_location: form.target_location,
        total_budget: form.total_budget,
        start_at: form.start_at,
        payment_method: form.payment_method,
        phone: form.payment_method === "mpesa" ? form.mpesa_phone : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Campaign failed");
    } else if (data.checkout_url) {
      toast.success("Redirecting to Stripe…");
      window.location.href = data.checkout_url;
    } else if (form.payment_method === "mpesa") {
      toast.success("Check your phone to complete payment");
    } else {
      toast.success("Campaign is live!");
    }
    setSubmitting(false);
    if (!data.checkout_url) {
      setShowForm(false);
      setForm((f) => ({
        ...f,
        title: "",
        headline: "",
        description: "",
        image_urls: [],
        product_id: "",
        service_id: "",
      }));
    }
    load();
    loadWallet();
  }

  function toggleCat(cat: string) {
    setForm((f) => ({
      ...f,
      target_categories: f.target_categories.includes(cat)
        ? f.target_categories.filter((c) => c !== cat)
        : [...f.target_categories, cat],
    }));
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard/creator-studio" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-3">
              <ArrowLeft className="w-4 h-4" /> Creator Studio
            </Link>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h1 className="text-2xl font-bold">Ad Campaigns</h1>
            </div>
            <p className="text-sm text-white/40">
              Set your budget — we calculate duration, impressions & bids. Wallet pre-flight before launch.
            </p>
            {walletBalance !== null && (
              <p className="text-xs text-emerald-400/80 mt-1">
                Wallet balance: KES {walletBalance.toLocaleString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-90 text-black font-semibold text-sm px-5 py-2.5 rounded-2xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Impressions", value: totalImpressions.toLocaleString(), icon: Eye, color: "text-blue-400" },
            { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, color: "text-emerald-400" },
            { label: "Avg. CTR", value: `${avgCtr.toFixed(2)}%`, icon: TrendingUp, color: "text-amber-400" },
            { label: "Total Spent", value: `KES ${totalSpent.toLocaleString()}`, icon: DollarSign, color: "text-rose-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <Icon className={`w-4 h-4 ${color} mb-2`} aria-hidden />
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-white/40 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {showForm && (
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              Create Ad Campaign
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Campaign Title" required>
                  <input className={input} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Summer Sale Campaign" required />
                </Field>
                <Field label="Headline (carousel)" required>
                  <input className={input} value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} placeholder="Up to 50% off — This Weekend Only" required />
                </Field>
              </div>
              <Field label="Description (optional)">
                <input className={input} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short tagline" />
              </Field>

              <Field label="Ad images" required>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadImages(e.target.files)} />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 w-full justify-center py-3 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 text-sm"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload to Supabase storage
                </button>
                {form.image_urls.length > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {form.image_urls.map((url) => (
                      <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                        <Image src={url} alt="Ad preview" fill className="object-cover" sizes="64px" unoptimized />
                      </div>
                    ))}
                  </div>
                )}
              </Field>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Link product (auto CTA)">
                  <select
                    className={input}
                    value={form.product_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      const p = catalogProducts.find((x) => x.id === id);
                      setForm((f) => ({
                        ...f,
                        product_id: id,
                        service_id: id ? "" : f.service_id,
                        image_urls: p?.image_url && f.image_urls.length === 0 ? [p.image_url] : f.image_urls,
                      }));
                    }}
                  >
                    <option value="">None</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Link service (auto CTA)">
                  <select
                    className={input}
                    value={form.service_id}
                    onChange={(e) => {
                      const id = e.target.value;
                      setForm((f) => ({
                        ...f,
                        service_id: id,
                        product_id: id ? "" : f.product_id,
                      }));
                    }}
                  >
                    <option value="">None</option>
                    {catalogServices.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Target Categories">
                <div className="flex flex-wrap gap-2 mt-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCat(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all ${
                        form.target_categories.includes(cat)
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                          : "bg-white/5 border-white/10 text-white/50"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={`Campaign budget: KES ${form.total_budget.toLocaleString()}`}>
                <input
                  type="range"
                  min={500}
                  max={50000}
                  step={500}
                  value={form.total_budget}
                  onChange={(e) => setForm((f) => ({ ...f, total_budget: Number(e.target.value) }))}
                  className="w-full accent-amber-400"
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-[11px]">
                  <Breakdown label="Duration" value={`${budgetPreview.durationDays} days`} />
                  <Breakdown label="Daily budget" value={`KES ${budgetPreview.dailyBudget.toLocaleString()}`} />
                  <Breakdown label="Est. impressions" value={budgetPreview.estimatedImpressions.toLocaleString()} />
                  <Breakdown label="Bid / impression" value={`KES ${budgetPreview.bidPerImpression}`} />
                </div>
              </Field>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Start Date">
                  <input type="datetime-local" className={input} value={form.start_at} onChange={(e) => setForm((f) => ({ ...f, start_at: e.target.value }))} />
                </Field>
                <Field label="Geo Target (optional)">
                  <input className={input} value={form.target_location} onChange={(e) => setForm((f) => ({ ...f, target_location: e.target.value }))} placeholder="e.g. Nairobi" />
                </Field>
              </div>

              <Field label="Payment Method">
                <select className={input} value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}>
                  <option value="wallet">Vendor Wallet / Escrow</option>
                  <option value="stripe">Stripe</option>
                  <option value="mpesa">M-Pesa</option>
                </select>
              </Field>

              {form.payment_method === "mpesa" && (
                <Field label="M-Pesa phone">
                  <input className={input} value={form.mpesa_phone} onChange={(e) => setForm((f) => ({ ...f, mpesa_phone: e.target.value }))} placeholder="0712345678" />
                </Field>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={submitting} className="bg-gradient-to-r from-amber-500 to-rose-500 disabled:opacity-50 text-black font-bold px-6 py-2.5 rounded-2xl">
                  {submitting ? "Submitting…" : "Launch Campaign"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="text-sm text-white/40 hover:text-white/70">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          <SearchInput
            onChange={setCampaignSearch}
            placeholder="Search campaigns…"
            className="max-w-md"
          />
          {loading || vendorLoading ? (
            [1, 2].map((i) => (
              <div key={i} className="bg-white/5 border border-white/8 rounded-3xl h-28 animate-pulse" />
            ))
          ) : filteredCampaigns.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="w-10 h-10 text-white/20 mx-auto mb-3" aria-hidden />
              <p className="text-white/40 font-medium">
                {campaignSearch ? "No campaigns match your search" : "No campaigns yet"}
              </p>
            </div>
          ) : (
            filteredCampaigns.map((c) => (
              <CampaignRow
                key={c.id}
                campaign={c}
                expanded={expandedId === c.id}
                onToggleExpand={() => setExpandedId(expandedId === c.id ? null : c.id)}
                onToggleStatus={() => toggleStatus(c)}
                onDelete={() => deleteCampaign(c.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Breakdown({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl px-3 py-2 border border-white/8">
      <div className="text-white/35">{label}</div>
      <div className="font-semibold text-white mt-0.5">{value}</div>
    </div>
  );
}

function CampaignRow({
  campaign: c,
  expanded,
  onToggleExpand,
  onToggleStatus,
  onDelete,
}: {
  campaign: Campaign;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const ctr = c.total_impressions > 0 ? ((c.total_clicks / c.total_impressions) * 100).toFixed(2) : "0.00";
  const isLive = c.status === "live" || c.status === "active";

  return (
    <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl overflow-hidden">
      <div className="flex items-center gap-4 p-4 md:p-5">
        <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-white/5">
          <Image src={c.image_url} alt={c.title} fill className="object-cover" sizes="56px" unoptimized />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[c.status] ?? ""} capitalize`}>
              {c.status.replace("_", " ")}
            </span>
          </div>
          <p className="font-semibold text-sm truncate">{c.title}</p>
          <p className="text-xs text-white/40 truncate">{c.headline}</p>
        </div>
        <div className="hidden md:flex items-center gap-6 shrink-0 text-center">
          <MiniStat label="Impressions" value={c.total_impressions.toLocaleString()} />
          <MiniStat label="CTR" value={`${ctr}%`} />
          <MiniStat label="Spent" value={`KES ${c.total_spent.toLocaleString()}`} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {(isLive || c.status === "paused") && (
            <button type="button" onClick={onToggleStatus} className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
              {isLive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-green-400" />}
            </button>
          )}
          <button type="button" onClick={onDelete} className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
            <Trash2 className="w-3.5 h-3.5 text-white/50" />
          </button>
          <button type="button" onClick={onToggleExpand} className="w-8 h-8 rounded-xl bg-white/8 flex items-center justify-center">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-white/8 px-5 py-4 bg-white/2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Breakdown label="Total budget" value={`KES ${(c.total_budget ?? c.daily_budget * 7).toLocaleString()}`} />
            <Breakdown label="Bid / impression" value={`KES ${c.bid_amount}`} />
            <Breakdown label="Start" value={new Date(c.start_at).toLocaleDateString()} />
            <Breakdown label="End" value={new Date(c.end_at).toLocaleDateString()} />
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-bold">{value}</div>
      <div className="text-[10px] text-white/30">{label}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-white/50 font-medium mb-1.5">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const input =
  "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-500/50 transition-colors";
