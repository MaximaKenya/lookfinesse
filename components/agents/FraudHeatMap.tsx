"use client";

export default function FraudHeatMap() {
  const locations = [
    {
      city: "Nairobi",
      risk: 82,
    },
    {
      city: "Lagos",
      risk: 95,
    },
    {
      city: "Dubai",
      risk: 61,
    },
  ];

  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-3xl p-6">

      <h2 className="text-2xl font-bold text-white mb-6">
        AI Fraud Heatmap
      </h2>

      <div className="space-y-5">

        {locations.map((l) => (
          <div key={l.city}>

            <div className="flex justify-between mb-2">

              <div className="text-sm text-gray-300">
                {l.city}
              </div>

              <div className="text-sm text-red-400">
                {l.risk}%
              </div>

            </div>

            <div className="w-full bg-zinc-800 rounded-full h-4">

              <div
                className="bg-red-500 h-4 rounded-full"
                style={{
                  width: `${l.risk}%`,
                }}
              />

            </div>

          </div>
        ))}

      </div>
    </div>
  );
}