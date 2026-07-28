"use client";

type Vendor = {
  name: string;
  risk: number;
};

export default function RiskHeatmap({
  vendors,
}: {
  vendors: Vendor[];
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">

      <h2 className="text-2xl font-bold mb-6">
        Treasury Risk Heatmap
      </h2>

      <div className="space-y-4">

        {vendors.map((vendor) => (
          <div
            key={vendor.name}
            className="space-y-2"
          >
            <div className="flex justify-between">
              <span>{vendor.name}</span>

              <span>
                {vendor.risk}%
              </span>
            </div>

            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">

              <div
                className={`h-full ${
                  vendor.risk > 80
                    ? "bg-red-500"
                    : vendor.risk > 50
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
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