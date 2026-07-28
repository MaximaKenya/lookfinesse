"use client";

import Link from "next/link";
import { AlertTriangle, Store } from "lucide-react";

type Props = {
  isDemoMode: boolean;
  hasVendorStore: boolean;
};

export default function VendorGateBanner({ isDemoMode, hasVendorStore }: Props) {
  if (!isDemoMode) return null;

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90 flex items-start gap-3">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-300" />
      <div>
        {hasVendorStore ? (
          <p>
            Publishing with your store in <strong>demo vendor mode</strong>. Link a vendor profile
            for full commerce features, or continue to preview content on the feed.
          </p>
        ) : (
          <p>
            No vendor store found — content will publish under the demo vendor.{" "}
            <Link href="/dashboard/create-store" className="underline font-semibold text-amber-50">
              Create a store
            </Link>{" "}
            to sell under your brand.
          </p>
        )}
        {!hasVendorStore && (
          <Link
            href="/dashboard/create-store"
            className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-50 hover:text-white"
          >
            <Store className="w-3.5 h-3.5" />
            Set up storefront
          </Link>
        )}
      </div>
    </div>
  );
}
