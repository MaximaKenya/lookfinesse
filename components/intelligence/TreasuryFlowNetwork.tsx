"use client";

export default function TreasuryFlowNetwork() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 overflow-hidden">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white">
          Treasury Flow Network
        </h2>

        <p className="text-zinc-400 mt-2">
          Live liquidity movement across settlement infrastructure
        </p>
      </div>

      <div className="relative h-[320px] flex items-center justify-center">
        <div className="absolute w-[500px] h-[2px] bg-gradient-to-r from-green-500 via-cyan-500 to-yellow-500 animate-pulse" />

        <div className="absolute left-10 bg-green-500/10 border border-green-500/20 rounded-3xl p-5">
          <div className="text-green-400 font-bold">Treasury</div>
        </div>

        <div className="absolute right-10 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl p-5">
          <div className="text-cyan-400 font-bold">Settlement Rails</div>
        </div>
      </div>
    </div>
  );
}