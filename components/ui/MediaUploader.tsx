"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Camera, Loader2, X, Plus, Film, Image as ImageIcon, Link as LinkIcon, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

export type MediaMode = "image" | "video" | "carousel";

export interface MediaValue {
  mode: MediaMode;
  /** primary url (image src OR video src OR first carousel item) */
  url: string;
  /** carousel items when mode === 'carousel' */
  items: { url: string; type: "image" | "video" }[];
}

interface Props {
  label?: string;
  bucket?: string;
  pathPrefix?: string;
  value: MediaValue;
  onChange: (next: MediaValue) => void;
  aspect?: "square" | "banner" | "auto";
  className?: string;
}

const MAX_CAROUSEL = 8;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

function isBucketMissingError(error: { message?: string; statusCode?: string | number }): boolean {
  const msg = (error.message ?? "").toLowerCase();
  return (
    msg.includes("bucket not found") ||
    msg.includes("invalid bucket") ||
    msg.includes("bucket does not exist") ||
    msg.includes("404")
  );
}

function uploadErrorMessage(error: { message?: string; statusCode?: string | number }): string {
  const msg = (error.message ?? "").toLowerCase();
  const code = String(error.statusCode ?? "");
  if (isBucketMissingError(error)) {
    return "Storage bucket missing — see storage setup guide";
  }
  if (msg.includes("row-level security") || msg.includes("policy") || code === "403") {
    return "Upload denied — sign in again or check storage permissions";
  }
  if (code === "413" || msg.includes("413") || msg.includes("too large") || msg.includes("payload too large") || msg.includes("exceeded")) {
    return "File too large — max 10MB images, 50MB videos";
  }
  return error.message ?? "Upload failed";
}

function resolveStorageUrl(raw: string, bucket: string): string {
  if (!raw) return "";
  if (raw.startsWith("blob:") || raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
    return raw;
  }
  const path = raw.replace(/^\//, "");
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

function isSupabaseImageUrl(url: string): boolean {
  return url.startsWith("https://") && !url.startsWith("blob:") && !/\.(mp4|webm|mov)(\?|$)/i.test(url);
}

function MediaPreview({
  url,
  type,
  bucket,
  fill = false,
}: {
  url: string;
  type: "image" | "video";
  bucket: string;
  fill?: boolean;
}) {
  const resolved = resolveStorageUrl(url, bucket);
  if (!resolved) return null;

  const className = fill
    ? "absolute inset-0 w-full h-full object-cover"
    : "w-full h-full object-cover";

  if (type === "video") {
    return <video src={resolved} className={className} muted playsInline controls={fill} />;
  }

  if (isSupabaseImageUrl(resolved)) {
    return (
      <Image
        src={resolved}
        alt=""
        fill={fill}
        unoptimized
        className={fill ? "object-cover" : className}
        sizes={fill ? "100vw" : undefined}
        width={fill ? undefined : 800}
        height={fill ? undefined : 800}
      />
    );
  }

  return <img src={resolved} alt="" className={className} />;
}

export default function MediaUploader({
  label = "Media",
  bucket = "profile-media",
  pathPrefix = "media",
  value,
  onChange,
  aspect = "auto",
  className = "",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [bucketMissing, setBucketMissing] = useState(false);
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    };
  }, []);

  const clearLocalPreview = () => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
    setLocalPreview(null);
  };

  const aspectClass =
    aspect === "square" ? "aspect-square" :
    aspect === "banner" ? "aspect-[3/1]" : "min-h-[8rem]";

  const uploadOne = async (file: File): Promise<{ url: string; type: "image" | "video" } | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const isVideo = file.type.startsWith("video/") || ["mp4", "webm", "mov"].includes(ext);
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      toast.error(isVideo ? "Video too large — max 50MB" : "Image too large — max 10MB");
      return null;
    }
    try {
      const fileName = `${pathPrefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, {
        upsert: true,
        contentType: file.type || undefined,
      });
      if (error) throw error;
      const storagePath = data.path ?? fileName;
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      return { url: pub.publicUrl, type: isVideo ? "video" : "image" };
    } catch (err) {
      const e = err as { message?: string; statusCode?: string | number };
      if (isBucketMissingError(e)) setBucketMissing(true);
      toast.error(uploadErrorMessage(e));
      return null;
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;

    const first = files[0];
    clearLocalPreview();
    const blobUrl = URL.createObjectURL(first);
    blobRef.current = blobUrl;
    setLocalPreview(blobUrl);

    setUploading(true);
    try {
      if (value.mode === "carousel") {
        const uploaded: { url: string; type: "image" | "video" }[] = [];
        for (const file of Array.from(files).slice(0, MAX_CAROUSEL - value.items.length)) {
          const r = await uploadOne(file);
          if (r) uploaded.push(r);
        }
        const items = [...value.items, ...uploaded].slice(0, MAX_CAROUSEL);
        onChange({ mode: "carousel", url: items[0]?.url ?? "", items });
      } else {
        const r = await uploadOne(first);
        if (r) {
          const mode: MediaMode = r.type === "video" ? "video" : "image";
          onChange({ mode, url: r.url, items: [{ url: r.url, type: r.type }] });
        }
      }
    } finally {
      setUploading(false);
      clearLocalPreview();
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(u);
    const type: "image" | "video" = isVideo ? "video" : "image";
    if (value.mode === "carousel") {
      const items = [...value.items, { url: u, type }].slice(0, MAX_CAROUSEL);
      onChange({ mode: "carousel", url: items[0].url, items });
    } else {
      const mode: MediaMode = isVideo ? "video" : "image";
      onChange({ mode, url: u, items: [{ url: u, type }] });
    }
    setUrlInput("");
    setUrlInputOpen(false);
  };

  const removeAt = (i: number) => {
    const items = value.items.filter((_, idx) => idx !== i);
    onChange({
      mode: value.mode,
      url: items[0]?.url ?? "",
      items,
    });
  };

  const primaryUrl = localPreview || value.url;
  const primaryType: "image" | "video" =
    localPreview
      ? (value.mode === "video" ? "video" : "image")
      : value.mode === "video"
        ? "video"
        : "image";

  return (
    <div className={`space-y-3 ${className}`}>
      {bucketMissing && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5">
          <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-100/90 leading-relaxed">
            The <code className="text-amber-200">profile-media</code> bucket is missing.{" "}
            <Link href="/help/storage" className="underline font-semibold text-amber-200 hover:text-white">
              Storage setup guide
            </Link>{" "}
            — create the bucket and policies in Supabase Dashboard (migration 019 is bucket-only).
          </p>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">{label}</p>
        <div className="flex gap-1 bg-white/5 border border-white/8 rounded-xl p-0.5">
          {(["image", "video", "carousel"] as const).map((m) => {
            const Icon = m === "image" ? ImageIcon : m === "video" ? Film : Plus;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onChange({ ...value, mode: m })}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold capitalize transition-all ${
                  value.mode === m ? "bg-white text-black" : "text-white/50 hover:text-white"
                }`}
              >
                <Icon className="w-3 h-3" />
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className={`relative w-full ${aspectClass} bg-black/40 border border-white/10 rounded-2xl overflow-hidden`}>
        {value.mode === "carousel" ? (
          <div className="absolute inset-0 grid grid-cols-3 gap-1 p-1 overflow-y-auto">
            {value.items.map((it, i) => (
              <div key={`${it.url}-${i}`} className="relative aspect-square bg-black/60 rounded-xl overflow-hidden group">
                <MediaPreview url={it.url} type={it.type} bucket={bucket} fill />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="absolute top-1 right-1 z-10 bg-black/70 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {value.items.length < MAX_CAROUSEL && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="aspect-square border border-dashed border-white/15 rounded-xl flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/30 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
            {value.items.length === 0 && (
              <div className="col-span-3 flex items-center justify-center text-white/30 text-sm min-h-[8rem]">
                No carousel items yet
              </div>
            )}
          </div>
        ) : primaryUrl ? (
          <MediaPreview url={primaryUrl} type={primaryType} bucket={bucket} fill />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/30 text-sm">
            No {value.mode} yet
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white px-3 py-2 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5" />
          {value.mode === "carousel" ? "Add Files" : "Upload"}
        </button>
        <button
          type="button"
          onClick={() => setUrlInputOpen((v) => !v)}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 px-3 py-2 rounded-xl text-xs font-medium transition-all"
        >
          <LinkIcon className="w-3.5 h-3.5" />
          URL
        </button>
        {(value.url || value.items.length > 0) && (
          <button
            type="button"
            onClick={() => {
              clearLocalPreview();
              onChange({ mode: value.mode, url: "", items: [] });
            }}
            className="flex items-center gap-1.5 text-white/40 hover:text-red-400 px-3 py-2 rounded-xl text-xs font-medium transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={value.mode === "video" ? "video/*" : value.mode === "carousel" ? "image/*,video/*" : "image/*"}
          multiple={value.mode === "carousel"}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {urlInputOpen && (
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addUrl()}
            placeholder="https://… (image or video URL)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/25"
          />
          <button
            type="button"
            onClick={addUrl}
            className="bg-white text-black px-4 py-2 rounded-xl text-xs font-semibold hover:bg-white/90"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

/** A small carousel viewer (autoplay, dots) — for displaying MediaValue on profiles */
export function MediaViewer({ value, className = "", bucket = "profile-media" }: { value: MediaValue; className?: string; bucket?: string }) {
  const [idx, setIdx] = useState(0);
  const items =
    value.mode === "carousel" && value.items.length > 0
      ? value.items
      : value.url
      ? [{ url: value.url, type: value.mode === "video" ? "video" as const : "image" as const }]
      : [];

  if (items.length === 0) return null;

  const item = items[idx % items.length];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <MediaPreview url={item.url} type={item.type} bucket={bucket} fill />
      {items.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
