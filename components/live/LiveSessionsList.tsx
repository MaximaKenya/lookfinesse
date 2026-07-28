"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SearchInput from "@/components/ui/SearchInput";

type Session = {
  id: string;
  title?: string;
  caption?: string;
  is_live?: boolean;
  cover_url?: string;
  vendors?: { name?: string };
};

export default function LiveSessionsList({
  liveSessions,
  upcoming,
}: {
  liveSessions: Session[];
  upcoming: Session[];
}) {
  const [query, setQuery] = useState("");

  const filterSessions = (list: Session[]) => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (s) =>
        (s.title ?? s.caption ?? "").toLowerCase().includes(q) ||
        (s.vendors?.name ?? "").toLowerCase().includes(q)
    );
  };

  const live = useMemo(() => filterSessions(liveSessions), [liveSessions, query]);
  const up = useMemo(() => filterSessions(upcoming), [upcoming, query]);

  return (
    <div className="space-y-8">
      <SearchInput onChange={setQuery} placeholder="Search live sessions…" />

      {live.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            Live Now
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {live.map((session) => (
              <Link key={session.id} href={`/live/${session.id}`}>
                <div className="relative bg-[#0f0f0f] border border-red-500/20 rounded-3xl overflow-hidden hover:border-red-500/40 transition-all group">
                  {session.cover_url ? (
                    <div className="relative aspect-video">
                      <Image
                        src={session.cover_url}
                        alt=""
                        fill
                        className="object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-red-900/30 to-black flex items-center justify-center">
                      <span className="text-4xl">🔴</span>
                    </div>
                  )}
                  <div className={`p-4 ${session.cover_url ? "-mt-16 relative z-10" : ""}`}>
                    <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mb-2">
                      LIVE NOW
                    </span>
                    <h3 className="font-bold text-white">{session.title ?? session.caption}</h3>
                    <p className="text-white/60 text-sm">{session.vendors?.name}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {up.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Upcoming</h2>
          <div className="space-y-3">
            {up.map((session) => (
              <Link key={session.id} href={`/live/${session.id}`}>
                <div className="flex items-center gap-4 bg-[#0f0f0f] border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-all">
                  <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden relative shrink-0">
                    {session.cover_url && (
                      <Image src={session.cover_url} alt="" fill className="object-cover" unoptimized />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      {session.title ?? session.caption}
                    </p>
                    <p className="text-white/60 text-sm">{session.vendors?.name}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {live.length === 0 && up.length === 0 && (
        <div className="text-center py-12 text-white/60">
          {query ? "No sessions match your search" : "No live sessions scheduled"}
        </div>
      )}
    </div>
  );
}
