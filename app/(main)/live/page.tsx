import Link from "next/link";
import { getLiveSessions } from "@/lib/social/queries";
import LiveSessionsList from "@/components/live/LiveSessionsList";
import { Plus } from "lucide-react";

export default async function LivePage() {
  const sessions = await getLiveSessions(false);
  const liveSessions = sessions.filter((s: any) => s.is_live);
  const upcoming = sessions.filter((s: any) => !s.is_live);

  return (
    <section className="max-w-4xl mx-auto px-4 py-8 space-y-10">
      <header className="relative bg-gradient-to-br from-red-900/20 via-[#0f0f0f] to-orange-900/10 border border-red-500/15 rounded-3xl p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
        <div className="relative flex items-center gap-3 mb-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-sm font-bold uppercase tracking-wider">Live & Upcoming</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="relative text-3xl font-bold text-white">Live Sessions</h1>
            <p className="relative text-white/70 mt-1">Workouts, fashion drops, tutorials & masterclasses</p>
          </div>
          <Link
            href="/dashboard/create-live"
            className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-2xl text-sm font-semibold hover:bg-red-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Go Live
          </Link>
        </div>
      </header>

      <LiveSessionsList liveSessions={liveSessions} upcoming={upcoming} />
    </section>
  );
}
