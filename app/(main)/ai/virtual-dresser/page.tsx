"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Droplet, Loader2, Save, Shirt, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import MannequinAvatar from "@/components/dresser/MannequinAvatar";
import {
  CLOTHING_SIZES,
  SKIN_TONES,
  type DresserPrefs,
} from "@/lib/dresser/types";
import { checkTryOnCompat, type TryOnKind } from "@/lib/dresser/tryOn";
import { getZoneLayer, type DresserZone } from "@/lib/dresser/zones";
import { DEMO_PRODUCTS } from "@/lib/social/queries";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const inputCls =
  "w-full h-11 px-4 rounded-2xl bg-black/50 border border-white/12 text-white text-sm placeholder:text-white/35 outline-none focus:border-purple-500/50";

/**
 * Overlays a zone-appropriate indicator on the AI avatar photo WITHOUT ever
 * pasting the raw product image on the body:
 *  - cosmetics/oils → soft glow + bottle icon near the target zone (face/beard)
 *  - apparel/accessories → a translucent zone-shaped silhouette only
 * Zone geometry is shared with the SVG mannequin (120×200 viewBox).
 */
function PhotoZoneOverlay({
  zone,
  kind,
  label,
}: {
  zone: DresserZone;
  kind: TryOnKind;
  label?: string;
}) {
  const layer = getZoneLayer(zone);
  const style = {
    left: `${(layer.x / 120) * 100}%`,
    top: `${(layer.y / 200) * 100}%`,
    width: `${(layer.width / 120) * 100}%`,
    height: `${(layer.height / 200) * 100}%`,
  } as const;

  if (kind === "cosmetic") {
    const cx = `${((layer.x + layer.width / 2) / 120) * 100}%`;
    const cy = `${((layer.y + layer.height / 2) / 200) * 100}%`;
    return (
      <div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
        style={{ left: cx, top: cy }}
      >
        <span className="relative flex items-center justify-center w-12 h-12">
          <span className="absolute inset-0 rounded-full bg-amber-300/25 blur-md" />
          <span className="absolute inset-2 rounded-full bg-amber-200/30" />
          <Droplet className="relative w-5 h-5 text-amber-100" />
        </span>
        {label && (
          <span className="mt-1 rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-amber-100/90">
            Applied
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute rounded-2xl border border-white/40 bg-gradient-to-br from-white/25 to-white/5 backdrop-blur-[1px] flex items-end justify-center"
      style={style}
    >
      {label && (
        <span className="mb-1 max-w-[90%] truncate rounded-full bg-black/60 px-2 py-0.5 text-[9px] text-white/90">
          {label}
        </span>
      )}
    </div>
  );
}

export default function VirtualDresserPage() {
  const { userId } = useCurrentUser();
  const [prefs, setPrefs] = useState<DresserPrefs>({
    size: "M",
    heightCm: 170,
    weightKg: 65,
    gender: "female",
    skinTone: "medium",
  });
  const [selectedProduct, setSelectedProduct] = useState<(typeof DEMO_PRODUCTS)[0] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiAvatarUrl, setAiAvatarUrl] = useState<string | null>(null);
  const [avatarMode, setAvatarMode] = useState<"svg" | "openai">("svg");

  useEffect(() => {
    if (!userId) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        const d = p?.preferences?.dresser as DresserPrefs | undefined;
        if (d) {
          setPrefs((prev) => ({ ...prev, ...d }));
          if (d.avatarUrl) setAiAvatarUrl(d.avatarUrl);
          if (d.avatarMode) setAvatarMode(d.avatarMode);
        }
      })
      .catch(() => {});
  }, [userId]);

  const generateAvatar = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/virtual-dresser/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json();
      if (data.avatarUrl) {
        setAiAvatarUrl(data.avatarUrl);
        setAvatarMode("openai");
        toast.success("AI avatar generated!");
      } else {
        setAvatarMode("svg");
        toast.info(data.message ?? "Using demo mannequin");
      }
    } catch {
      toast.error("Could not generate avatar");
    } finally {
      setGenerating(false);
    }
  };

  const savePrefs = async () => {
    if (!userId) {
      toast.error("Sign in to save your dresser profile");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: {
            dresser: {
              ...prefs,
              avatarUrl: aiAvatarUrl,
              avatarMode,
            },
          },
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success("Dresser preferences saved");
    } catch {
      toast.error("Could not save preferences");
    } finally {
      setSaving(false);
    }
  };

  const update = useCallback(
    <K extends keyof DresserPrefs>(key: K, value: DresserPrefs[K]) => {
      setPrefs((p) => ({ ...p, [key]: value }));
    },
    []
  );

  const catalog = DEMO_PRODUCTS.slice(0, 12);

  // Try-on compatibility for the selected product against the current avatar.
  const compat = selectedProduct
    ? checkTryOnCompat(prefs, selectedProduct.category, selectedProduct.name)
    : null;

  // Warn (and skip the overlay) when an item isn't suited to this avatar —
  // e.g. beard oil on a female avatar.
  useEffect(() => {
    if (selectedProduct && compat && !compat.ok) {
      toast.info("Item not suited to this avatar");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct?.id, compat?.ok]);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 space-y-8 pb-24">
      <header className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/40 via-[#0c0c0c] to-pink-950/30 p-8">
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 blur-[90px] pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Shirt className="w-7 h-7 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-white">Virtual Dresser</h1>
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-white/70 text-sm mt-1">
              Build your avatar, try on shop looks — demo mode works without OpenAI
            </p>
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-6">
          <h2 className="text-lg font-bold text-white">Your measurements</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 block">
              <span className="text-xs text-white/70">Clothing size</span>
              <select
                className={inputCls}
                value={prefs.size}
                onChange={(e) => update("size", e.target.value)}
              >
                {CLOTHING_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 block">
              <span className="text-xs text-white/70">Gender presentation</span>
              <select
                className={inputCls}
                value={prefs.gender}
                onChange={(e) =>
                  update("gender", e.target.value as DresserPrefs["gender"])
                }
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="neutral">Neutral</option>
              </select>
            </label>
            <label className="space-y-1.5 block">
              <span className="text-xs text-white/70">Height (cm)</span>
              <input
                type="number"
                className={inputCls}
                value={prefs.heightCm}
                onChange={(e) => update("heightCm", Number(e.target.value))}
              />
            </label>
            <label className="space-y-1.5 block">
              <span className="text-xs text-white/70">Weight (kg)</span>
              <input
                type="number"
                className={inputCls}
                value={prefs.weightKg}
                onChange={(e) => update("weightKg", Number(e.target.value))}
              />
            </label>
          </div>

          <div>
            <span className="text-xs text-white/70 block mb-2">Skin tone (optional)</span>
            <div className="flex flex-wrap gap-2">
              {SKIN_TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update("skinTone", t.id)}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${
                    prefs.skinTone === t.id
                      ? "border-white scale-110"
                      : "border-white/20 hover:border-white/50"
                  }`}
                  style={{ backgroundColor: t.color }}
                  aria-label={t.id}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={generateAvatar}
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-100 text-sm font-semibold hover:bg-purple-500/30 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              Generate AI avatar
            </button>
            <button
              type="button"
              onClick={savePrefs}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 border border-white/15 text-white text-sm font-semibold hover:bg-white/15 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save prefs
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-black/40 p-6 flex flex-col items-center min-h-[360px]">
          {avatarMode === "openai" && aiAvatarUrl ? (
            <div className="relative w-full max-w-[280px] aspect-[3/4] rounded-2xl overflow-hidden border border-white/10">
              <Image src={aiAvatarUrl} alt="AI avatar" fill className="object-cover" unoptimized />
              {/* Zone-aware try-on overlay — never slaps the full product photo
                  onto the body (that produced the opaque-square bug). */}
              {selectedProduct && compat?.ok && (
                <PhotoZoneOverlay
                  zone={compat.zone}
                  kind={compat.kind}
                  label={selectedProduct.name}
                />
              )}
              {selectedProduct && compat && !compat.ok && (
                <div className="absolute inset-x-3 bottom-3 rounded-xl bg-black/70 border border-amber-500/30 px-3 py-2 text-center text-[11px] text-amber-200/90">
                  Item not suited to this avatar
                </div>
              )}
            </div>
          ) : (
            <MannequinAvatar
              prefs={prefs}
              garmentUrl={selectedProduct?.image_url}
              garmentName={selectedProduct?.name}
              garmentCategory={selectedProduct?.category}
              className="flex-1 w-full py-4"
            />
          )}
          {selectedProduct && (
            <p className="mt-4 text-sm text-white/80 text-center">
              Trying on: <strong className="text-white">{selectedProduct.name}</strong>
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white">Try on catalog</h2>
          <Link href="/shop" className="text-sm text-purple-300 hover:text-purple-200">
            Browse shop →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {catalog.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProduct(p)}
              className={`text-left rounded-2xl overflow-hidden border transition-all ${
                selectedProduct?.id === p.id
                  ? "border-purple-400 ring-2 ring-purple-500/30"
                  : "border-white/10 hover:border-white/25"
              }`}
            >
              <div className="relative aspect-square bg-white/5">
                {p.image_url && (
                  <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />
                )}
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-white line-clamp-1">{p.name}</p>
                <p className="text-[10px] text-white/55">KES {p.price?.toLocaleString()}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
