"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, Sparkles, ShoppingBag, Users, FileText, Briefcase } from "lucide-react";

const INTENT_SUGGESTIONS = [
  "Outfit for rooftop dinner Nairobi",
  "Beginner home workout routine",
  "Natural hair salon Westlands",
  "Affordable skin care routine",
  "Personal trainer Karen",
  "Trendy streetwear under 3000",
];

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const search = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setFocused(false);
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal });
      clearTimeout(timeout);
      setResults(await res.json());
    } catch {
      // On timeout / network error show empty result envelope so the UI exits the spinner
      setResults({ products: [], services: [], creators: [], posts: [], _error: true });
    } finally {
      setLoading(false);
    }
  };

  const totalResults = results
    ? (["products", "services", "creators", "posts"] as const).reduce(
        (sum, key) => sum + (Array.isArray(results[key]) ? results[key].length : 0),
        0
      )
    : 0;

  const SECTIONS = [
    { key: "products", label: "Products", icon: ShoppingBag, href: (id: string) => `/product/${id}` },
    { key: "services", label: "Services", icon: Briefcase, href: (id: string) => `/services/${id}` },
    { key: "creators", label: "Creators", icon: Users, href: (id: string) => `/creator/${id}` },
    { key: "posts", label: "Posts", icon: FileText, href: (id: string) => `/feed/${id}` },
  ];

  return (
    <section className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-white">Search</h1>
        <p className="text-white/40 text-sm mt-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Intent-aware search — try natural phrases
        </p>
      </header>

      {/* Search input */}
      <div className="relative">
        <div className={`flex items-center gap-3 bg-white/5 border ${focused ? "border-white/30" : "border-white/10"} rounded-2xl px-4 py-3 transition-all`}>
          <Search className="w-5 h-5 text-white/40 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => e.key === "Enter" && search(q)}
            placeholder="Search products, services, creators..."
            className="flex-1 bg-transparent text-white placeholder:text-white/25 focus:outline-none text-sm"
          />
          {q && (
            <button onClick={() => { setQ(""); setResults(null); }} className="text-white/30 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {focused && !q && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-[#0f0f0f] border border-white/10 rounded-2xl overflow-hidden z-20">
            <div className="p-3">
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider px-2 mb-2">Trending Searches</p>
              {INTENT_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQ(s); search(s); }}
                  className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-white/5 text-white/60 hover:text-white text-sm transition-all"
                >
                  <Search className="w-3.5 h-3.5 text-white/20" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => search(q)}
        disabled={loading || !q.trim()}
        className="w-full bg-white text-black py-3.5 rounded-2xl font-bold hover:bg-white/90 disabled:opacity-40 transition-all"
      >
        {loading ? "Searching..." : "Search"}
      </button>

      {/* Results */}
      {results && (
        <div className="space-y-8">
          {totalResults === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Search className="w-10 h-10 text-white/15 mx-auto" />
              <p className="text-white/40">No results for &quot;{q}&quot;</p>
              <p className="text-white/25 text-sm">Try a different search phrase</p>
            </div>
          ) : (
            SECTIONS.map(({ key, label, icon: Icon, href }) =>
              results[key]?.length > 0 && (
                <section key={key}>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-purple-400" />
                    <h2 className="text-lg font-bold text-white">{label}</h2>
                    <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">{results[key].length}</span>
                  </div>
                  <div className="space-y-2">
                    {results[key].map((item: any) => (
                      <Link key={item.id} href={href(item.id)}>
                        <div className="flex items-center gap-4 bg-[#0f0f0f] border border-white/8 rounded-2xl p-4 hover:border-white/15 hover:bg-white/3 transition-all group">
                          {item.image_url || item.avatar_url || item.cover_image || item.thumbnail_url ? (
                            <img
                              src={item.image_url || item.avatar_url || item.cover_image || item.thumbnail_url}
                              alt=""
                              className="w-12 h-12 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                              <Icon className="w-5 h-5 text-white/20" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors truncate">
                              {item.name || item.title || item.business_name || item.caption}
                            </p>
                            {(item.price || item.short_description) && (
                              <p className="text-xs text-white/40 mt-0.5">
                                {item.price ? `KES ${item.price?.toLocaleString()}` : item.short_description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )
            )
          )}
        </div>
      )}
    </section>
  );
}
