"use client";

import { useEffect, useState } from "react";
import { Download, Loader2, Wallet } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useVendorContext } from "@/hooks/useVendorContext";
import Link from "next/link";

type Totals = {
  tips?: number;
  affiliate?: number;
  brand_deal?: number;
  available?: number;
};

export default function CreatorWalletPage() {
  const { userId } = useCurrentUser();
  const { vendorId } = useVendorContext();
  const [ledger, setLedger] = useState<Array<Record<string, unknown>>>([]);
  const [totals, setTotals] = useState<Totals>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId && !vendorId) return;
    const params = new URLSearchParams();
    if (userId) params.set("user_id", userId);
    if (vendorId) params.set("vendor_id", vendorId);
    fetch(`/api/creator-wallet?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setLedger(d.ledger ?? []);
        setTotals(d.totals ?? {});
      })
      .finally(() => setLoading(false));
  }, [userId, vendorId]);

  const csvHref =
    userId || vendorId
      ? `/api/creator-wallet?${new URLSearchParams({
          ...(userId ? { user_id: userId } : {}),
          ...(vendorId ? { vendor_id: vendorId } : {}),
          format: "csv",
        })}`
      : "#";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wallet className="h-6 w-6 text-emerald-400" />
            Creator wallet
          </h1>
          <p className="text-sm text-white/45 mt-1">
            Tips, affiliate commissions, and brand deals — export CSV for tax.
          </p>
        </div>
        <a
          href={csvHref}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </a>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-white/40" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              ["Available", totals.available],
              ["Tips", totals.tips],
              ["Affiliate", totals.affiliate],
              ["Brand deals", totals.brand_deal],
            ].map(([label, val]) => (
              <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
                <p className="text-xl font-bold text-white mt-1">
                  KES {Number(val ?? 0).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <ul className="space-y-2">
            {ledger.map((row) => (
              <li
                key={String(row.id)}
                className="rounded-xl border border-white/8 px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white capitalize">{String(row.source)}</p>
                  <p className="text-xs text-white/40 truncate">{String(row.description ?? "")}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-emerald-300">
                    +{Number(row.amount_kes ?? 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-white/30">{String(row.tax_category ?? "")}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-center text-xs text-white/35">
            Payouts via{" "}
            <Link href="/dashboard/vendor/wallet" className="text-cyan-400 hover:underline">
              vendor wallet
            </Link>{" "}
            (M-Pesa / Stripe) after KYC.
          </p>
        </>
      )}
    </div>
  );
}
