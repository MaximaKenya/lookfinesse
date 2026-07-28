import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

/**
 * POST /api/ads/track
 * Body:
 *   type        - "impression" | "click"
 *   campaign_id - uuid
 *   user_id     - uuid (optional)
 *   session_id  - string (optional, for anon freq-cap)
 *   impression_id - uuid (required for click events to link back)
 *   placement   - "hero_carousel" | "feed_inline" | "story"
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const {
    type,
    campaign_id,
    user_id,
    session_id,
    impression_id,
    placement = "hero_carousel",
  } = body as {
    type: "impression" | "click";
    campaign_id: string;
    user_id?: string;
    session_id?: string;
    impression_id?: string;
    placement?: string;
  };

  if (!type || !campaign_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = createSupabaseServer();

  if (type === "impression") {
    const { data, error } = await supabase
      .from("ad_impressions")
      .insert({
        campaign_id,
        user_id: user_id ?? null,
        session_id: session_id ?? null,
        placement,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Increment denormalized counter (fire-and-forget)
    supabase.rpc("increment_ad_impressions" as never, { p_campaign_id: campaign_id }).then(() => {});

    return NextResponse.json({ impression_id: data.id });
  }

  if (type === "click") {
    const { error } = await supabase.from("ad_clicks").insert({
      campaign_id,
      impression_id: impression_id ?? null,
      user_id: user_id ?? null,
      session_id: session_id ?? null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Increment denormalized click counter
    supabase.rpc("increment_ad_clicks" as never, { p_campaign_id: campaign_id }).then(() => {});

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
