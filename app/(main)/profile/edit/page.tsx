"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Loader2, ArrowLeft, MapPin, User, FileText, CheckCircle2, Award } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import MediaUploader, { type MediaValue } from "@/components/ui/MediaUploader";

type ProfileForm = {
  display_name: string;
  bio: string;
  city: string;
  lat: number | null;
  lng: number | null;
  avatar: MediaValue;
  banner: MediaValue;
};

const blankMedia: MediaValue = { mode: "image", url: "", items: [] };

function buildMediaFromProfile(url: string, type: string | undefined, carousel: unknown): MediaValue {
  if (Array.isArray(carousel) && carousel.length > 0) {
    const items = carousel.map((item: { url?: string; type?: string }) => {
      const itemUrl = String(item?.url ?? "");
      const isVideo =
        item?.type === "video" || /\.(mp4|webm|mov)(\?|$)/i.test(itemUrl);
      return { url: itemUrl, type: isVideo ? "video" as const : "image" as const };
    }).filter((item) => item.url);
    return { mode: "carousel", url: items[0]?.url ?? "", items };
  }
  const mode = (type === "video" ? "video" : "image") as MediaValue["mode"];
  return { mode, url: url ?? "", items: url ? [{ url, type: mode === "video" ? "video" : "image" }] : [] };
}

export default function EditProfilePage() {
  const router = useRouter();
  const { userId, loading: authLoading } = useCurrentUser();

  const [form, setForm] = useState<ProfileForm>({
    display_name: "",
    bio: "",
    city: "",
    lat: null,
    lng: null,
    avatar: blankMedia,
    banner: blankMedia,
  });
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/profile?user_id=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setForm({
            display_name: data.display_name || "",
            bio: data.bio || "",
            city: data.city || "",
            lat: data.lat ?? null,
            lng: data.lng ?? null,
            avatar: buildMediaFromProfile(data.avatar_url, data.avatar_media_type, data.avatar_carousel),
            banner: buildMediaFromProfile(data.banner_url, data.banner_media_type, data.banner_carousel),
          });
        }
      })
      .finally(() => setLoadingProfile(false));
  }, [userId]);

  const DEFAULT_LAT = -1.2864;
  const DEFAULT_LNG = 36.8172;

  const applyNairobiFallback = () => {
    setForm((p) => ({
      ...p,
      lat: DEFAULT_LAT,
      lng: DEFAULT_LNG,
      city: p.city?.trim() || "Nairobi",
    }));
    toast.info("Using Nairobi as default. Enable location in browser settings to refine.");
  };

  const useGeolocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      applyNairobiFallback();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({
          ...p,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          city: p.city || "Current Location",
        }));
        toast.success("Location captured!");
      },
      () => {
        applyNairobiFallback();
      },
      { timeout: 8000, maximumAge: 1000 * 60 * 30 }
    );
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error("Sign in first");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        display_name: form.display_name,
        bio: form.bio,
        city: form.city,
        lat: form.lat,
        lng: form.lng,
        avatar_url: form.avatar.url,
        avatar_media_type: form.avatar.mode === "carousel" ? "image" : form.avatar.mode,
        avatar_carousel: form.avatar.mode === "carousel" ? form.avatar.items : [],
        banner_url: form.banner.url,
        banner_media_type: form.banner.mode === "carousel" ? "image" : form.banner.mode,
        banner_carousel: form.banner.mode === "carousel" ? form.banner.items : [],
      };
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === "string" ? err.error : "Save failed");
      }
      setSaved(true);
      toast.success("Profile saved!");
      setTimeout(() => {
        setSaved(false);
        router.push("/profile");
      }, 1000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed — try again");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4 animate-pulse">
        <div className="h-8 bg-white/5 rounded-xl w-48" />
        <div className="h-32 bg-white/5 rounded-3xl" />
        <div className="h-12 bg-white/5 rounded-2xl" />
        <div className="h-12 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-white/50">Sign in to edit your profile.</p>
        <Link href="/login" className="inline-block bg-white text-black px-6 py-3 rounded-2xl font-bold">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          className="text-white/40 hover:text-white transition-colors p-2 rounded-xl hover:bg-white/5"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
          <p className="text-sm text-white/40 mt-0.5">Photos, videos, bio & location</p>
        </div>
      </div>

      {/* Banner uploader */}
      <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 space-y-4">
        <MediaUploader
          label="Banner"
          aspect="banner"
          bucket="profile-media"
          pathPrefix={`${userId}/banner`}
          value={form.banner}
          onChange={(banner) => setForm((p) => ({ ...p, banner }))}
        />
      </div>

      {/* Avatar uploader */}
      <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 space-y-4">
        <MediaUploader
          label="Avatar / Profile Media"
          aspect="square"
          bucket="profile-media"
          pathPrefix={`${userId}/avatar`}
          value={form.avatar}
          onChange={(avatar) => setForm((p) => ({ ...p, avatar }))}
        />
      </div>

      {/* Fields */}
      <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 space-y-5">
        <p className="text-sm font-semibold text-white/40 uppercase tracking-widest">Info</p>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-white/60">
            <User className="w-4 h-4" />
            Display Name
          </label>
          <input
            value={form.display_name}
            onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="Your name or brand"
            maxLength={50}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 focus:bg-white/8 transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60">Email</label>
          <input
            value={email}
            readOnly
            className="w-full bg-white/3 border border-white/5 rounded-xl px-4 py-3 text-white/30 cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-white/60">
            <FileText className="w-4 h-4" />
            Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Tell creators and fans about yourself…"
            rows={3}
            maxLength={180}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 resize-none transition-all"
          />
          <div className="text-right text-[11px] text-white/25">{form.bio.length}/180</div>
        </div>
      </div>

      <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 space-y-4">
        <p className="text-sm font-semibold text-white/40 uppercase tracking-widest">Location</p>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/60">City</label>
          <input
            value={form.city}
            onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
            placeholder="e.g. Nairobi, Westlands"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 transition-all"
          />
        </div>
        <p className="text-xs text-white/40 leading-relaxed">
          We use your city to show nearby creators and weather tips. You can type a city manually or share GPS.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={useGeolocation}
            className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 text-blue-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          >
            <MapPin className="w-4 h-4" />
            Use GPS
          </button>
          <button
            type="button"
            onClick={applyNairobiFallback}
            className="px-4 py-2.5 rounded-xl text-sm font-medium border border-white/10 bg-white/5 text-white/60 hover:text-white"
          >
            Default to Nairobi
          </button>
        </div>
        {form.lat && form.lng && (
          <p className="text-xs text-green-400/70 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
          </p>
        )}
      </div>

      <Link
        href="/dashboard/vendor/profile"
        className="flex items-center gap-3 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 px-4 py-3.5 hover:bg-fuchsia-500/15 transition-all"
      >
        <Award className="w-5 h-5 text-fuchsia-300 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">Membership tiers</p>
          <p className="text-xs text-white/40">Subscribers, M-Pesa & Stripe billing</p>
        </div>
      </Link>

      <button
        onClick={handleSave}
        disabled={saving || saved}
        className="w-full flex items-center justify-center gap-2 bg-white hover:bg-white/90 text-black py-4 rounded-2xl font-bold text-base transition-all disabled:opacity-70"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Saving…
          </>
        ) : saved ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-600" /> Saved!
          </>
        ) : (
          "Save Profile"
        )}
      </button>
    </div>
  );
}
