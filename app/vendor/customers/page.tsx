"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Crown, Loader2, Users } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function VendorCustomersPage() {
  const { userId } = useCurrentUser();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!userId) return;
    fetch("/api/vendor/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d?.vendorId) setVendorId(d.vendorId);
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!vendorId) return;
    setLoading(true);
    fetch(`/api/subscriptions?as_vendor=1&vendor_id=${vendorId}`)
      .then((r) => r.json())
      .then((d) => setSubs(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [vendorId]);

  const filtered =
    filter === "all" ? subs : subs.filter((s) => s.status === filter);

  const mrr = subs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + Number(s.service_plans?.price_kes ?? 0), 0);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl">
      <header className="rounded-3xl border border-white/10 bg-gradient-to-br from-pink-950/30 via-black/50 to-purple-950/20 backdrop-blur-xl p-8">
        <p className="text-[10px] uppercase tracking-widest text-pink-300/80 font-semibold">Subscribers</p>
        <h1 className="text-3xl font-bold text-white mt-1">Membership Roster</h1>
        <p className="text-white/40 text-sm mt-2">
          {subs.filter((s) => s.status === "active").length} active · KES {mrr.toLocaleString()}/mo recurring
        </p>
      </header>

      <div className="flex gap-2 flex-wrap">
        {["all", "active", "pending", "past_due", "cancelled"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize ${
              filter === s ? "bg-white text-black" : "bg-white/5 text-white/50 border border-white/8"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-white/30" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-3xl border border-dashed border-white/10">
          <Users className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No subscribers yet</p>
          <Link href="/dashboard/provider" className="text-cyan-400 text-xs mt-2 inline-block hover:underline">
            Set up plans in Provider Hub
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((s) => (
            <li
              key={s.id}
              className="rounded-3xl border border-white/8 bg-white/[0.02] backdrop-blur-xl p-5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-purple-300" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{s.service_plans?.name ?? "Plan"}</p>
                  <p className="text-xs text-white/40">
                    KES {Number(s.service_plans?.price_kes ?? 0).toLocaleString()}/mo
                    {s.next_billing_at && (
                      <> · Renews {new Date(s.next_billing_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-bold capitalize px-3 py-1 rounded-full border ${
                  s.status === "active"
                    ? "text-green-400 border-green-400/30 bg-green-400/10"
                    : s.status === "past_due"
                      ? "text-amber-400 border-amber-400/30 bg-amber-400/10"
                      : "text-white/40 border-white/10 bg-white/5"
                }`}
              >
                {s.status}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Link href="/dashboard/provider" className="text-sm text-cyan-400 hover:underline">
        ← Provider Hub
      </Link>
    </div>
  );
}
