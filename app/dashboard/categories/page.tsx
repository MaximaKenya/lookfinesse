"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Layers,
  Lock,
  Tag,
} from "lucide-react";
import Link from "next/link";

const CATEGORY_ICONS: Record<string, string> = {
  fashion: "👗", beauty: "💄", fitness: "💪", wellness: "🧘",
  footwear: "👟", accessories: "👜", skincare: "✨", hair: "💇",
  nutrition: "🥗", "gym-equipment": "🏋️", grooming: "💈",
  activewear: "🏃", supplements: "💊", yoga: "🧘", jewellery: "💍",
};

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setCategories(data ?? []);
        setFetching(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white px-4 md:px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-600 transition-all"
            >
              <ArrowLeft size={18} className="text-zinc-400" />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Product Categories
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                Marketplace categories managed by admin
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/admin/categories"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-cyan-500/50 text-zinc-300 hover:text-white text-sm font-semibold transition-all"
          >
            <Lock size={14} className="text-cyan-400" />
            Admin Panel
            <ExternalLink size={12} className="text-zinc-500" />
          </Link>
        </div>

        {/* Read-only notice */}
        <div className="flex items-center gap-3 px-5 py-4 bg-blue-500/5 border border-blue-500/15 rounded-2xl">
          <Lock size={16} className="text-blue-400 shrink-0" />
          <p className="text-sm text-zinc-400">
            Categories are centrally managed by admin to ensure consistency.
            Vendors pick from this list when creating products.
            Contact admin to request a new category.
          </p>
        </div>

        {/* Category Grid */}
        {fetching ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 animate-pulse"
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800 mb-3" />
                <div className="h-4 bg-zinc-800 rounded-full w-2/3" />
              </div>
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center text-2xl group-hover:border-zinc-700 transition-all">
                    {c.icon || CATEGORY_ICONS[c.slug] || "📦"}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-base">
                      {c.name}
                    </p>
                    {c.slug && (
                      <p className="text-zinc-600 text-xs mt-0.5">
                        /{c.slug}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 rounded-3xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Layers size={28} className="text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-medium">No categories yet</p>
            <p className="text-zinc-600 text-sm mt-2">
              Run migration 005_categories.sql in Supabase SQL Editor to seed categories.
            </p>
            <Link
              href="/dashboard/admin/categories"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-semibold hover:bg-cyan-500/15 transition-all"
            >
              <Tag size={14} />
              Add via Admin Panel
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
