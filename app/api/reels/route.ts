import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { DEMO_REELS, dedupeReels, normalizeReelRow } from "@/lib/social/queries";

const REEL_SELECTS = [
  `*, vendors ( id, name, avatar_url, logo_url, is_verified ), products ( id, name, price, image_url ), services ( id, title, price )`,
  `*, vendors ( id, business_name, avatar_url, logo_url, is_verified ), products ( id, name, price, image_url ), services ( id, title, price )`,
  `*, vendors ( id, name, avatar_url ), products ( id, name, price )`,
  `*, vendors ( id, name ), products ( id, name, price )`,
  `*, products ( id, name, price )`,
  `*`,
];

async function fetchReels(limit = 25) {
  for (const select of REEL_SELECTS) {
    const { data, error } = await supabase
      .from("reels")
      .select(select)
      .order("engagement_score", { ascending: false })
      .limit(limit);
    if (!error) {
      if (!data?.length) return DEMO_REELS;
      return dedupeReels(
        data.map((row) => normalizeReelRow(row as Record<string, unknown>)!)
      );
    }
    const msg = error.message?.toLowerCase() ?? "";
    if (!msg.includes("does not exist") && !msg.includes("column") && !msg.includes("relationship")) {
      break;
    }
  }
  return DEMO_REELS;
}

export async function GET() {
  const reels = await fetchReels();
  return NextResponse.json(reels);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      vendor_id,
      caption,
      video_url,
      thumbnail_url,
      product_id,
      product_ids,
      service_id,
      service_ids,
      hashtags,
      category,
    } = body;

    if (!vendor_id || !video_url?.trim() || !caption?.trim()) {
      return NextResponse.json(
        { error: "vendor_id, video_url, and caption are required" },
        { status: 400 }
      );
    }

    const primaryProductId = product_id ?? product_ids?.[0] ?? null;
    const primaryServiceId = service_id ?? service_ids?.[0] ?? null;

    const payload: Record<string, unknown> = {
      vendor_id,
      caption: caption.trim(),
      video_url: video_url.trim(),
      thumbnail_url: thumbnail_url || null,
      product_id: primaryProductId,
      service_id: primaryServiceId,
      engagement_score: 0,
    };

    if (hashtags) {
      payload.hashtags = Array.isArray(hashtags)
        ? hashtags
        : String(hashtags)
            .split(/[,#\s]+/)
            .filter(Boolean);
    }
    if (category) payload.category = category;

    const { data, error } = await supabase.from("reels").insert(payload).select().single();
    if (error) throw error;

    return NextResponse.json({ success: true, reel: normalizeReelRow(data as Record<string, unknown>) }, { status: 201 });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create reel" },
      { status: 500 }
    );
  }
}
