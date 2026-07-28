"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Trophy, Flame, ChevronRight, Zap } from "lucide-react";
import { toast } from "sonner";

export default function ChallengesPage() {
  const { userId } = useCurrentUser();
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/gamification?user_id=${userId}`).then((r) => r.json()).then(setData);
  }, [userId]);

  const join = async (challengeId: string) => {
    if (!userId) { toast.error("Sign in to join challenges"); return; }
    await fetch("/api/gamification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, challenge_id: challengeId }),
    });
    toast.success("Challenge joined! 🏆");
    router.push(`/challenges/${challengeId}`);
  };

  const CATEGORY_STYLES: Record<string, string> = {
    fitness: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    beauty: "text-pink-400 bg-pink-400/10 border-pink-400/20",
    style: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    wellness: "text-green-400 bg-green-400/10 border-green-400/20",
  };

  return (
    <section className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <header className="relative bg-gradient-to-br from-purple-900/25 via-[#0f0f0f] to-orange-900/15 border border-purple-500/15 rounded-3xl p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/8 blur-[80px] pointer-events-none" />
        <div className="relative flex items-center gap-3 mb-2">
          <Trophy className="w-7 h-7 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">Challenges</h1>
        </div>
        <p className="relative text-white/40">Fitness streaks, glow-ups & style weeks</p>
      </header>

      {/* Streak card */}
      {data?.streak && (
        <div className="relative bg-gradient-to-br from-orange-500/15 via-red-500/10 to-yellow-500/5 border border-orange-500/25 rounded-3xl p-6 overflow-hidden">
          <div className="absolute top-0 right-0 text-[80px] opacity-5 leading-none">🔥</div>
          <div className="relative flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Current Streak</p>
              <p className="text-5xl font-black text-white mt-1">{data.streak.current_streak}<span className="text-2xl text-white/40 ml-1">days</span></p>
              <p className="text-xs text-white/30 mt-1">Best: {data.streak.longest_streak} days</p>
            </div>
            <div className="ml-auto">
              <Zap className="w-8 h-8 text-yellow-400/30" />
            </div>
          </div>
        </div>
      )}

      {/* Active Challenges */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Active Challenges</h2>
        </div>
        <div className="space-y-4">
          {(data?.challenges ?? []).map((c: any) => (
            <div key={c.id} className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-5 hover:border-white/12 transition-all">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/challenges/${c.id}`} className="flex-1 block">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${CATEGORY_STYLES[c.category] ?? "text-white/40 bg-white/5 border-white/10"}`}>
                      {c.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-white flex items-center gap-1">
                    {c.title}
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  </h3>
                  <p className="text-white/40 text-sm mt-1 line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                    <span>{c.participant_count} participants</span>
                    {c.end_date && (
                      <span>Ends {new Date(c.end_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => join(c.id)}
                  className="bg-white text-black px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shrink-0"
                >
                  Join
                </button>
              </div>
            </div>
          ))}

          {!data?.challenges?.length && (
            <div className="text-center py-12 space-y-3">
              <Trophy className="w-12 h-12 text-white/15 mx-auto" />
              <p className="text-white/30 text-sm">No active challenges</p>
              <p className="text-white/20 text-xs">Sign in to see personalized challenges</p>
            </div>
          )}
        </div>
      </section>

      {/* Achievements */}
      {data?.achievements?.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Achievements</h2>
            <span className="text-xs text-white/30">{data.achievements.length} earned</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.achievements.map((a: any) => (
              <div key={a.id} className="bg-[#0f0f0f] border border-white/8 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-semibold text-white text-sm">{a.title}</p>
                  {a.description && (
                    <p className="text-xs text-white/30 mt-0.5">{a.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
