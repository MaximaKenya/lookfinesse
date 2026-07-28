"use client";

import { useEffect, useState } from "react";

type Vendor = {
  name: string;
  risk: number;
};

export default function VendorRiskTrajectory() {

  const [vendors, setVendors] =
    useState<Vendor[]>([]);

  useEffect(() => {

    const load = async () => {

      const res = await fetch(
        "/api/intelligence/vendor-risk"
      );

      const data = await res.json();

      setVendors(data.vendors || []);
    };

    load();

  }, []);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">

      <h2 className="text-2xl font-bold mb-6">
        Vendor Risk Trajectory
      </h2>

      <div className="space-y-6">

        {vendors.map((vendor) => (

          <div key={vendor.name}>

            <div className="flex justify-between mb-2">

              <div>{vendor.name}</div>

              <div>{vendor.risk}%</div>

            </div>

            <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">

              <div
                className="h-full bg-red-500"
                style={{
                  width: `${vendor.risk}%`,
                }}
              />

            </div>

          </div>
        ))}

      </div>
    </div>
  );
}