"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Layers,
  Plus,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";

const EMOJI_OPTIONS = [
  "👗","💄","💪","🧘","👟","👜","✨","💇","🥗","🏋️",
  "💈","🏃","💊","💍","🛍️","🎽","🌿","🧴","🪮","🎯",
];

export default function AdminCategoriesPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("📦");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setFetching(true);
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    setCategories(data ?? []);
    setFetching(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!name.trim()) return alert("Category name required");
    setAdding(true);

    const autoSlug = slug.trim() || name.trim().toLowerCase().replace(/\s+/g, "-");

    const { error } = await supabase.from("categories").insert([
      {
        name: name.trim(),
        slug: autoSlug,
        icon,
        sort_order: categories.length + 1,
      },
    ]);

    setAdding(false);

    if (error) return alert(error.message);

    setName("");
    setSlug("");
    setIcon("📦");
    setShowForm(false);
    load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase
      .from("categories")
      .update({ is_active: !current })
      .eq("id", id);
    load();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    load();
  };

  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white px-4 md:px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard/admin")}
              className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-zinc-600 transition-all"
            >
              <ArrowLeft size={18} className="text-zinc-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-red-400 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                  Admin Only
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight mt-1">
                Manage Categories
              </h1>
              <p className="text-zinc-500 text-sm mt-1">
                These are the categories vendors pick from when creating products.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 transition-all text-black font-bold text-sm shadow-lg shadow-cyan-500/20"
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="relative overflow-hidden bg-zinc-900 border border-cyan-500/20 rounded-[32px] p-8">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 blur-3xl rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Tag className="text-cyan-400" size={18} />
                </div>
                <h2 className="text-xl font-bold">New Category</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm text-zinc-400">Category Name *</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gym Equipment"
                    className="w-full h-12 px-4 rounded-2xl bg-black border border-zinc-800 text-white placeholder-zinc-600 outline-none focus:border-cyan-500/60 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-zinc-400">Slug (optional)</label>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="gym-equipment"
                    className="w-full h-12 px-4 rounded-2xl bg-black border border-zinc-800 text-white placeholder-zinc-600 outline-none focus:border-cyan-500/60 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <label className="text-sm text-zinc-400">Pick Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setIcon(e)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        icon === e
                          ? "bg-cyan-500/20 border-2 border-cyan-500/50 scale-110"
                          : "bg-zinc-800 border border-zinc-700 hover:border-zinc-600"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="h-12 px-8 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 transition-all text-black font-bold flex items-center gap-2"
                >
                  {adding ? "Adding..." : "Add Category"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="h-12 px-6 rounded-2xl border border-zinc-700 hover:border-zinc-600 text-zinc-400 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Categories List */}
        {fetching ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 animate-pulse h-20" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className={`flex items-center justify-between bg-zinc-900 border rounded-3xl p-5 transition-all ${
                  c.is_active
                    ? "border-zinc-800 hover:border-zinc-700"
                    : "border-zinc-800/50 opacity-50"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-zinc-800 flex items-center justify-center text-2xl">
                    {c.icon || "📦"}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{c.name}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">
                      /{c.slug} · #{c.sort_order}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      c.is_active
                        ? "text-green-400 bg-green-500/10 border border-green-500/20"
                        : "text-zinc-500 bg-zinc-800"
                    }`}
                  >
                    {c.is_active ? "Active" : "Hidden"}
                  </span>

                  <button
                    onClick={() => toggleActive(c.id, c.is_active)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-700 hover:border-zinc-600 transition-all"
                    title={c.is_active ? "Hide from vendors" : "Show to vendors"}
                  >
                    {c.is_active ? (
                      <XCircle size={16} className="text-zinc-400" />
                    ) : (
                      <CheckCircle2 size={16} className="text-green-400" />
                    )}
                  </button>

                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-700 hover:border-red-500/50 hover:bg-red-500/10 transition-all"
                    title="Delete category"
                  >
                    <Trash2 size={16} className="text-zinc-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
                <Layers size={40} className="text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-400 font-medium">No categories yet</p>
                <p className="text-zinc-600 text-sm mt-2">
                  Run migration 005_categories.sql or add categories above.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
