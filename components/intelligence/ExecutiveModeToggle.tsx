"use client";

export default function ExecutiveModeToggle() {
  return (
    <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 w-fit">
      <button className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/20 text-green-400 font-semibold">
        Operator Mode
      </button>

      <button className="px-4 py-2 rounded-xl bg-black border border-zinc-700 text-zinc-400 font-semibold">
        Executive Mode
      </button>
    </div>
  );
}