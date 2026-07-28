"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Sparkles, TrendingDown } from "lucide-react";
import { sourceHref, type SentimentLabel } from "@/lib/ai/sentimentTypes";

type Overview = {
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  feedHealthScore: number;
  trendingNegativeTopics: { topic: string; count: number; sourceType: string; sourceId: string }[];
  recent: {
    id: string;
    sourceType: string;
    sourceId: string;
    sentiment: SentimentLabel;
    score: number;
    textSnippet: string;
    topics: string[];
    createdAt: string;
  }[];
  total: number;
};

const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  positive: "text-green-300 border-green-500/25 bg-green-500/10",
  neutral: "text-amber-200 border-amber-500/25 bg-amber-500/10",
  negative: "text-rose-300 border-rose-500/25 bg-rose-500/10",
};

export default function SentimentOverview({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/analytics/sentiment/overview");
        if (res.ok) setData(await res.json());
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
    const id = setInterval(load, 45000);
    return () => clearInterval(id);
  }, []);

  const healthScore = data?.feedHealthScore ?? 0;
  const healthTone =
    healthScore >= 75 ? "text-green-300" : healthScore >= 50 ? "text-amber-300" : "text-rose-300";

  return (
    <section
      className={`rounded-3xl border border-amber-500/15 bg-gradient-to-br from-amber-950/20 via-black to-rose-950/20 backdrop-blur-xl ${
        compact ? "p-5" : "p-6 md:p-8"
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200">
            <Sparkles className="h-3 w-3" />
            Content Sentiment
          </div>
          <h2 className={`font-bold text-white mt-3 ${compact ? "text-xl" : "text-2xl"}`}>
            Feed & comment health
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            AI-scored user content across posts, comments, and reviews
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">Feed health</div>
          <div className={`text-4xl font-black ${healthTone}`}>
            {loading ? "—" : `${healthScore}%`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Positive", value: data?.positivePercent ?? 0, tone: "text-green-300" },
          { label: "Neutral", value: data?.neutralPercent ?? 0, tone: "text-amber-200" },
          { label: "Negative", value: data?.negativePercent ?? 0, tone: "text-rose-300" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/8 bg-black/30 px-4 py-3 text-center"
          >
            <div className={`text-2xl font-black ${stat.tone}`}>
              {loading ? "—" : `${stat.value}%`}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div className={`grid gap-6 ${compact ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-rose-300" />
            <h3 className="text-sm font-semibold text-white">Trending negative topics</h3>
          </div>
          {loading ? (
            <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
          ) : (data?.trendingNegativeTopics?.length ?? 0) === 0 ? (
            <p className="text-sm text-zinc-500 rounded-2xl border border-dashed border-white/10 p-4">
              No negative topic clusters yet. Run{" "}
              <code className="text-zinc-400">POST /api/analytics/sentiment/sync</code> to backfill.
            </p>
          ) : (
            <ul className="space-y-2">
              {data?.trendingNegativeTopics.map((item) => (
                <li key={item.topic}>
                  <Link
                    href={sourceHref(item.sourceType as "feed_post" | "comment" | "review" | "booking_note", item.sourceId)}
                    className="group flex items-center justify-between rounded-2xl border border-rose-500/15 bg-rose-500/5 px-4 py-3 hover:bg-rose-500/10 transition-all"
                  >
                    <div>
                      <span className="text-sm font-medium text-white capitalize">{item.topic}</span>
                      <span className="ml-2 text-xs text-rose-200/70">{item.count} mentions</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-zinc-500 group-hover:text-white" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-amber-200" />
            <h3 className="text-sm font-semibold text-white">Recent analyzed content</h3>
          </div>
          {loading ? (
            <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
          ) : (data?.recent?.length ?? 0) === 0 ? (
            <p className="text-sm text-zinc-500 rounded-2xl border border-dashed border-white/10 p-4">
              Sentiment appears when users post or comment. Total analyzed: {data?.total ?? 0}.
            </p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
              {data?.recent.map((row) => (
                <li key={row.id}>
                  <Link
                    href={sourceHref(row.sourceType as "feed_post" | "comment" | "review" | "booking_note", row.sourceId)}
                    className={`group block rounded-2xl border px-4 py-3 transition-all hover:brightness-110 ${SENTIMENT_COLORS[row.sentiment]}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] uppercase tracking-wider opacity-80">
                        {row.sourceType.replace("_", " ")} · {row.sentiment}
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100" />
                    </div>
                    <p className="text-sm text-white/90 mt-1 line-clamp-2">{row.textSnippet}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
