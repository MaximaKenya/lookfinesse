"use client";

import { useEffect, useState } from "react";
import { Loader2, Ruler } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Link from "next/link";

export default function FitProfilePage() {
  const { userId } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    size_top: "",
    size_bottom: "",
    size_shoe: "",
    skin_tone: "",
    style_tags: "",
  });

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetch(`/api/fit-profile?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        const p = d.profile;
        if (!p) return;
        setForm({
          size_top: p.size_top ?? "",
          size_bottom: p.size_bottom ?? "",
          size_shoe: p.size_shoe ?? "",
          skin_tone: p.skin_tone ?? "",
          style_tags: Array.isArray(p.style_tags) ? p.style_tags.join(", ") : "",
        });
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Sign in to save fit profile");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/fit-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          ...form,
          style_tags: form.style_tags
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.ok) toast.success("Fit profile synced across vendors");
      else toast.error(data.error ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
        <Ruler className="h-6 w-6 text-pink-300" />
        Size & fit profile
      </h1>
      <p className="text-sm text-white/45 mb-6">
        Reused across vendors for recommendations. Syncs with{" "}
        <Link href="/ai/virtual-dresser" className="text-cyan-400 hover:underline">
          Virtual Dresser
        </Link>
        .
      </p>

      {!userId ? (
        <p className="text-white/40 text-sm">Sign in to manage your fit profile.</p>
      ) : loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-white/40" />
      ) : (
        <form onSubmit={save} className="space-y-3">
          {(
            [
              ["size_top", "Top size (e.g. M, 42)"],
              ["size_bottom", "Bottom size"],
              ["size_shoe", "Shoe size"],
              ["skin_tone", "Skin tone / undertone"],
              ["style_tags", "Style tags (comma-separated)"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-xs text-white/40">{label}</span>
              <input
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white"
              />
            </label>
          ))}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-white text-black font-semibold py-3 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save & sync"}
          </button>
        </form>
      )}
    </div>
  );
}
