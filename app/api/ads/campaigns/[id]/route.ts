import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

/**
 * GET    /api/ads/campaigns/[id]  — fetch single campaign with stats
 * PATCH  /api/ads/campaigns/[id]  — update campaign (status, budget, etc.)
 * DELETE /api/ads/campaigns/[id]  — delete/cancel campaign
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseServer();

  const { data, error } = await supabase
    .from("ad_campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Attach daily impression/click breakdown for last 7 days
  const { data: impressionsByDay } = await supabase
    .from("ad_impressions")
    .select("created_at")
    .eq("campaign_id", id)
    .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString());

  const { data: clicksByDay } = await supabase
    .from("ad_clicks")
    .select("created_at")
    .eq("campaign_id", id)
    .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString());

  return NextResponse.json({
    ...data,
    _analytics: {
      impressions_7d: impressionsByDay?.length ?? 0,
      clicks_7d: clicksByDay?.length ?? 0,
      ctr_7d:
        impressionsByDay?.length
          ? ((clicksByDay?.length ?? 0) / impressionsByDay.length) * 100
          : 0,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseServer();
  const body = await req.json().catch(() => ({}));

  const allowed = [
    "title",
    "headline",
    "description",
    "image_url",
    "cta_text",
    "cta_url",
    "target_categories",
    "target_location",
    "daily_budget",
    "total_budget",
    "bid_amount",
    "start_at",
    "end_at",
    "status",
  ] as const;

  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("ad_campaigns")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseServer();

  // Soft-delete by setting status to 'completed'
  const { error } = await supabase
    .from("ad_campaigns")
    .update({ status: "completed" })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
