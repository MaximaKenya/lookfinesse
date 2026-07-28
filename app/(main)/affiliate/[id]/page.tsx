"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link2, Copy, TrendingUp, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils/copyToClipboard";

type AffiliateLink = {
  id: string;
  code: string;
  commission_pct: number;
  clicks?: number;
  conversions?: number;
};

export default function AffiliatePage() {
  const { id: vendorId } = useParams<{ id: string }>();
  const [links, setLinks] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!vendorId) return;
    fetch(`/api/affiliate?vendor_id=${vendorId}`)
      .then((r) => r.json())
      .then((data) => {
        const next = Array.isArray(data?.links)
          ? data.links
          : Array.isArray(data)
            ? data
            : [];
        setLinks(next);
      })
      .catch(() => setLinks([]));
  }, [vendorId]);

  const generate = async () => {
    setLoading(true);
    const res = await fetch("/api/affiliate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_id: vendorId }),
    });
    const data = await res.json();
    if (res.ok) {
      setLinks((prev) => [data, ...(Array.isArray(prev) ? prev : [])]);
      toast.success("Affiliate link created!");
    } else {
      toast.error(data.error ?? "Failed");
    }
    setLoading(false);
  };

  const [manualUrl, setManualUrl] = useState<string | null>(null);

  const safeLinks = Array.isArray(links) ? links : [];

  const copy = async (code: string) => {
    const url = `${window.location.origin}/creator/${vendorId}?ref=${code}`;
    const result = await copyToClipboard(url);
    if (result.ok) {
      toast.success("Link copied!");
      setManualUrl(null);
      return;
    }
    setManualUrl(result.text);
    toast.error(result.reason ?? "Could not copy — use the link below");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <Link2 className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Affiliate Dashboard</h1>
        </div>
        <p className="text-white/40 text-sm">Generate links and track referrals for this creator</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Links", value: safeLinks.length, icon: Link2, color: "text-cyan-400" },
          { label: "Total Clicks", value: safeLinks.reduce((s, l) => s + (l.clicks ?? 0), 0), icon: Users, color: "text-purple-400" },
          { label: "Conversions", value: safeLinks.reduce((s, l) => s + (l.conversions ?? 0), 0), icon: TrendingUp, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-4 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-2`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-white/40 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Generate */}
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-2 bg-white text-black px-5 py-3 rounded-2xl font-bold hover:bg-white/90 disabled:opacity-50 transition-all"
      >
        <Link2 className="w-4 h-4" />
        {loading ? "Generating..." : "Generate New Affiliate Link"}
      </button>

      {/* Links list */}
      <div className="space-y-3">
        {manualUrl && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 space-y-2">
            <p className="text-xs text-amber-200 font-medium">
              Copy manually (clipboard unavailable on this connection):
            </p>
            <input
              readOnly
              value={manualUrl}
              onFocus={(e) => e.target.select()}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
            />
          </div>
        )}
        {safeLinks.map((link) => (
          <div key={link.id} className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-sm text-cyan-400 font-mono">{link.code}</code>
                  <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{link.commission_pct}% commission</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {link.clicks ?? 0} clicks</span>
                  <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {link.conversions ?? 0} conversions</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {((link.conversions ?? 0) * (link.commission_pct / 100) * 1000).toFixed(0)} est. KES</span>
                </div>
              </div>
              <button
                onClick={() => copy(link.code)}
                className="flex items-center gap-1.5 bg-white/8 hover:bg-white/15 border border-white/10 text-white/70 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            </div>
          </div>
        ))}
        {!safeLinks.length && (
          <div className="text-center py-12 space-y-3">
            <Link2 className="w-10 h-10 text-white/15 mx-auto" />
            <p className="text-white/30 text-sm">No affiliate links yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
