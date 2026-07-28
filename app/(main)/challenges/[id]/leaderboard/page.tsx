"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Trophy, ArrowLeft } from "lucide-react";

const ROWS = [
  { name: "Wanjiru K.", points: 920, streak: 22 },
  { name: "Achieng O.", points: 880, streak: 19 },
  { name: "Kamau M.", points: 705, streak: 14 },
  { name: "Njeri W.", points: 640, streak: 12 },
  { name: "Ali H.", points: 530, streak: 9 },
  { name: "Mwende N.", points: 510, streak: 9 },
  { name: "Sang K.", points: 470, streak: 8 },
  { name: "Joy A.", points: 410, streak: 7 },
  { name: "Brian O.", points: 380, streak: 6 },
  { name: "Liz M.", points: 320, streak: 6 },
];

export default function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
      <Link href={`/challenges/${id}`} className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm">
        <ArrowLeft className="w-4 h-4" /> Challenge
      </Link>
      <header className="flex items-center gap-3">
        <Trophy className="w-7 h-7 text-yellow-400" />
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-sm text-white/40">Live rankings update every 60s</p>
        </div>
      </header>
      <ol className="space-y-2">
        {ROWS.map((row, i) => (
          <li
            key={row.name}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 border ${
              i < 3
                ? "bg-gradient-to-r from-yellow-500/8 to-orange-500/5 border-yellow-500/15"
                : "bg-[#0f0f0f] border-white/8"
            }`}
          >
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              i === 0 ? "bg-yellow-400/25 text-yellow-300" :
              i === 1 ? "bg-zinc-300/25 text-zinc-100" :
              i === 2 ? "bg-orange-400/25 text-orange-300" : "bg-white/5 text-white/60"
            }`}>{i + 1}</span>
            <span className="flex-1 font-semibold text-white">{row.name}</span>
            <span className="text-xs text-white/40">🔥 {row.streak}d</span>
            <span className="text-base font-bold text-white">{row.points}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
