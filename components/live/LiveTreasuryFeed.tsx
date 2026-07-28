"use client";

export default function LiveTreasuryFeed() {
  return (
    <div className="bg-gray-900 p-5 rounded-2xl">
      <h2 className="text-xl font-semibold mb-4">
        Treasury Stream
      </h2>

      <div className="space-y-2">
        <div className="bg-gray-800 p-2 rounded">
          Reserve movement detected
        </div>

        <div className="bg-gray-800 p-2 rounded">
          FX hedge updated
        </div>
      </div>
    </div>
  );
}