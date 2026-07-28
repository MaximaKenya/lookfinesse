"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

interface StoryItem {
  id: string;
  vendor_id?: string | null;
  name: string;
  avatar: string;
  hasNew: boolean;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  href?: string;
}

const DEMO: StoryItem[] = [
  { id: "ds1", name: "EliteFit",   avatar: "https://api.dicebear.com/7.x/initials/svg?seed=EliteFit",  hasNew: true,  mediaUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80", mediaType: "image", caption: "Morning class @ 7AM — book your spot 🔥", href: "/services" },
  { id: "ds2", name: "GlowSalon",  avatar: "https://api.dicebear.com/7.x/initials/svg?seed=GlowSalon", hasNew: true,  mediaUrl: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=900&q=80", mediaType: "image", caption: "New facial drop — 20% off this week ✨", href: "/shop" },
  { id: "ds3", name: "StyleBnk",   avatar: "https://api.dicebear.com/7.x/initials/svg?seed=StyleBank", hasNew: false, mediaUrl: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80", mediaType: "image", caption: "Fresh fits dropping today 💧" },
  { id: "ds4", name: "ZenWell",    avatar: "https://api.dicebear.com/7.x/initials/svg?seed=ZenWell",   hasNew: true,  mediaUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=900&q=80", mediaType: "image", caption: "Sunday flow — go time 🧘🏾‍♀️" },
  { id: "ds5", name: "FitQueen",   avatar: "https://api.dicebear.com/7.x/initials/svg?seed=FitQueen",  hasNew: false, mediaUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=80", mediaType: "image", caption: "Leg day burn 🦵" },
];

const STORY_DURATION = 5000;

export default function Stories() {
  const { userId } = useCurrentUser();
  const [stories, setStories] = useState<StoryItem[]>(DEMO);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    fetch("/api/stories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setStories(
            data.map((s: any) => ({
              id: s.id,
              vendor_id: s.vendor_id,
              name: s.vendors?.business_name || s.vendors?.name || "Creator",
              avatar: s.vendors?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.id}`,
              hasNew: true,
              mediaUrl: s.media_url,
              mediaType: s.media_type === "video" ? "video" : "image",
              caption: s.caption,
              href: s.vendor_id ? `/creator/${s.vendor_id}` : undefined,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Auto-advance progress bar
  useEffect(() => {
    if (openIdx === null) return;
    setProgress(0);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / STORY_DURATION, 1);
      setProgress(p);
      if (p >= 1) {
        if (openIdx >= stories.length - 1) {
          setOpenIdx(null);
        } else {
          setOpenIdx((i) => (i === null ? null : i + 1));
        }
      } else {
        timerRef.current = window.requestAnimationFrame(tick);
      }
    };
    timerRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [openIdx, stories.length]);

  const handleAdd = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!userId) {
      toast.error("Sign in to post stories");
      return;
    }
    setUploading(true);
    try {
      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const isVideo = file.type.startsWith("video/") || ["mp4", "webm", "mov"].includes(ext);
      const path = `stories/${userId}/${Date.now()}.${ext}`;
      const { data: up, error: upErr } = await supabase.storage.from("products").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("products").getPublicUrl(up.path);

      const { data: vendor } = await supabase.from("vendors").select("id").eq("user_id", userId).maybeSingle();
      if (!vendor?.id) {
        toast.error("Become a vendor to post stories");
        return;
      }
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendor.id,
          media_url: pub.publicUrl,
          media_type: isVideo ? "video" : "image",
          caption,
          duration_seconds: 5,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const newStory = await res.json();
      setStories((prev) => [
        {
          id: newStory.id,
          vendor_id: vendor.id,
          name: "You",
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${userId}`,
          hasNew: true,
          mediaUrl: pub.publicUrl,
          mediaType: isVideo ? "video" : "image",
          caption,
          href: `/creator/${vendor.id}`,
        },
        ...prev,
      ]);
      toast.success("Story posted ✨");
      setAddOpen(false);
      setCaption("");
    } catch (e: any) {
      toast.error(e.message ?? "Could not post");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const open = openIdx !== null ? stories[openIdx] : null;

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide px-4 md:px-6">
        <button
          onClick={() => setAddOpen(true)}
          className="flex flex-col items-center gap-1.5 shrink-0"
        >
          <div className="w-14 h-14 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center hover:border-purple-400/60">
            <Plus className="w-5 h-5 text-white/40" />
          </div>
          <span className="text-[10px] text-white/40 font-medium">Your Story</span>
        </button>

        {stories.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setOpenIdx(i)}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer hover:opacity-90"
          >
            <div className={`p-0.5 rounded-full ${s.hasNew ? "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" : "bg-white/10"}`}>
              <div className="w-12 h-12 rounded-full bg-[#111] overflow-hidden border-2 border-black">
                <img src={s.avatar} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-[10px] text-white/50 font-medium truncate w-14 text-center">{s.name}</span>
          </button>
        ))}
      </div>

      {/* Viewer */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <button
            onClick={() => setOpenIdx(null)}
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 rounded-full p-2"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="relative w-full max-w-md aspect-[9/16] bg-black overflow-hidden rounded-xl">
            {/* Progress bars */}
            <div className="absolute top-2 left-2 right-2 z-10 flex gap-1">
              {stories.map((_, i) => (
                <div key={i} className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white"
                    style={{
                      width:
                        i < (openIdx ?? 0)
                          ? "100%"
                          : i === openIdx
                          ? `${progress * 100}%`
                          : "0%",
                    }}
                  />
                </div>
              ))}
            </div>
            {/* Header */}
            <div className="absolute top-6 left-2 right-12 z-10 flex items-center gap-2 px-2 pt-2">
              <img src={open.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
              <span className="text-white font-semibold text-sm">{open.name}</span>
            </div>
            {/* Media */}
            {open.mediaType === "video" ? (
              <video src={open.mediaUrl} autoPlay muted playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={open.mediaUrl} className="w-full h-full object-cover" alt="" />
            )}
            {/* Caption */}
            {open.caption && (
              <div className="absolute bottom-16 left-4 right-4 text-white text-base font-medium drop-shadow-lg">
                {open.caption}
              </div>
            )}
            {/* CTA */}
            {open.href && (
              <Link
                href={open.href}
                onClick={() => setOpenIdx(null)}
                className="absolute bottom-4 left-4 right-4 bg-white text-black py-3 rounded-full font-bold text-sm text-center"
              >
                View profile →
              </Link>
            )}
            {/* Tap zones */}
            <button
              className="absolute inset-y-0 left-0 w-1/3"
              onClick={() => setOpenIdx((i) => (i === null || i === 0 ? i : i - 1))}
            />
            <button
              className="absolute inset-y-0 right-0 w-1/3"
              onClick={() =>
                setOpenIdx((i) => (i === null || i >= stories.length - 1 ? null : i + 1))
              }
            />
          </div>
        </div>
      )}

      {/* Add modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Add to your story</h3>
              <button onClick={() => setAddOpen(false)} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/40 text-sm">Pick a photo or video. Lasts 24 hours.</p>
            <textarea
              placeholder="Caption (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25 resize-none"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full bg-white text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : "Choose photo / video"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleAdd(e.target.files)}
            />
          </div>
        </div>
      )}
    </>
  );
}
