"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle2, Crown } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import MediaUploader, { type MediaValue } from "@/components/ui/MediaUploader";
import { toast } from "sonner";

const blank: MediaValue = { mode: "image", url: "", items: [] };

function buildMedia(url: string, type: string | undefined, carousel: any): MediaValue {
  if (Array.isArray(carousel) && carousel.length > 0) {
    return { mode: "carousel", url: carousel[0]?.url ?? "", items: carousel };
  }
  const mode = (type === "video" ? "video" : "image") as MediaValue["mode"];
  return { mode, url: url ?? "", items: url ? [{ url, type: mode === "video" ? "video" : "image" }] : [] };
}

export default function VendorProfileEditPage() {
  const router = useRouter();
  const { userId, loading: authLoading } = useCurrentUser();
  const [vendor, setVendor] = useState<any>(null);
  const [avatar, setAvatar] = useState<MediaValue>(blank);
  const [banner, setBanner] = useState<MediaValue>(blank);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("vendors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setVendor(data);
        if (data) {
          setName(data.business_name || data.name || "");
          setBio(data.description || "");
          setAvatar(buildMedia(data.avatar_url, data.avatar_media_type, data.avatar_carousel));
          setBanner(buildMedia(data.banner_url, data.banner_media_type, data.banner_carousel));
        }
      });
  }, [userId]);

  const save = async () => {
    if (!vendor) return toast.error("No vendor profile found");
    setSaving(true);
    const patch = {
      business_name: name,
      name,
      description: bio,
      avatar_url: avatar.url,
      avatar_media_type: avatar.mode === "carousel" ? "image" : avatar.mode,
      avatar_carousel: avatar.mode === "carousel" ? avatar.items : [],
      banner_url: banner.url,
      banner_media_type: banner.mode === "carousel" ? "image" : banner.mode,
      banner_carousel: banner.mode === "carousel" ? banner.items : [],
    };
    const { error } = await supabase.from("vendors").update(patch).eq("id", vendor.id);
    setSaving(false);
    if (error) return toast.error("Couldn't save: " + error.message);
    setSaved(true);
    toast.success("Vendor profile saved!");
    setTimeout(() => router.push(`/creator/${vendor.id}`), 800);
  };

  if (authLoading) {
    return <div className="max-w-2xl mx-auto px-4 py-12 text-white/60">Loading…</div>;
  }
  if (!userId) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-white/50">Sign in to edit your vendor profile.</p>
        <Link href="/login" className="inline-block bg-white text-black px-6 py-3 rounded-2xl font-bold">Sign In</Link>
      </div>
    );
  }
  if (!vendor) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-white/50">No vendor profile linked to your account yet.</p>
        <Link href="/dashboard/vendor/onboarding" className="inline-block bg-white text-black px-6 py-3 rounded-2xl font-bold">Become a vendor</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Link>

        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Vendor profile</h1>
            <p className="text-sm text-white/40">Branding & media shown on your creator page</p>
          </div>
          <Link
            href="/dashboard/subscription"
            className="inline-flex items-center gap-2 text-xs font-semibold text-amber-200 border border-amber-500/25 bg-amber-500/10 px-3 py-2 rounded-xl hover:bg-amber-500/20 shrink-0"
          >
            <Crown className="w-3.5 h-3.5" />
            Platform Plan
          </Link>
        </header>

        <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6">
          <MediaUploader
            label="Banner"
            aspect="banner"
            bucket="products"
            pathPrefix={`vendor-banners/${vendor.id}`}
            value={banner}
            onChange={setBanner}
          />
        </div>

        <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6">
          <MediaUploader
            label="Avatar / Logo"
            aspect="square"
            bucket="products"
            pathPrefix={`vendor-avatars/${vendor.id}`}
            value={avatar}
            onChange={setAvatar}
          />
        </div>

        <div className="bg-[#0f0f0f] border border-white/8 rounded-3xl p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Business name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/25"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/60">Bio</label>
            <textarea
              rows={3}
              maxLength={240}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/25 resize-none"
            />
            <p className="text-right text-[11px] text-white/25">{bio.length}/240</p>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving || saved}
          className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl font-bold text-base hover:bg-white/90 disabled:opacity-60"
        >
          {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving…</> :
           saved ? <><CheckCircle2 className="w-5 h-5 text-green-600" /> Saved!</> :
           "Save vendor profile"}
        </button>
      </div>
    </div>
  );
}
