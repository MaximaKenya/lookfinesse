"use client";

export default function VoiceOpsCopilot() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black text-white">
            Voice Operations Copilot
          </h2>

          <p className="text-zinc-400 mt-2">
            Natural language treasury and fraud operations
          </p>
        </div>

        <button className="bg-green-500/10 border border-green-500/20 text-green-400 px-5 py-3 rounded-2xl font-semibold">
          Start Listening
        </button>
      </div>

      <div className="bg-black border border-zinc-800 rounded-3xl p-8 text-zinc-500 text-center">
        Voice intelligence infrastructure ready.
      </div>
    </div>
  );
}