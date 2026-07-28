"use client";

import { useEffect, useState } from "react";

export default function VendorTrustPanel() {
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/intelligence/vendor-trust");
      if (!res.ok) {
        setVendors([]);
        return;
      }
      const json = await res.json();
      setVendors(Array.isArray(json) ? json : []);
    }

    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
      <h2 className="text-2xl font-bold mb-6">Vendor Trust Intelligence</h2>

      {vendors.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No vendor trust scores yet — scores appear after KYC and transaction history builds.
        </p>
      ) : (
        <div className="space-y-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.vendor_id}
              className="bg-black border border-zinc-800 rounded-2xl p-4"
            >
              <div className="flex justify-between">
                <div>
                  <div className="text-white font-semibold">
                    {vendor.vendor_name ?? vendor.vendor_id}
                  </div>
                  <div className="text-sm text-zinc-500 mt-1">
                    Treasury Risk: {vendor.treasury_risk ?? 0}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-green-400 text-2xl font-bold">
                    {Math.round(vendor.trust_score ?? 0)}
                  </div>
                  <div className="text-xs text-zinc-500">Trust Score</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
