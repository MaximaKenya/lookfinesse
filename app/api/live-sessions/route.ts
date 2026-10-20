import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("live_sessions")
    .select(`*, vendors ( id, name, avatar_url )`)
    .order("scheduled_for", { ascending: true });

  if (error || !data || data.length === 0) {
    return NextResponse.json([]);
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();

  // Create a new live session
  if (!body.type) {
    const { vendor_id, title, description, scheduled_for, is_live, cover_url, stream_url, product_ids } = body;
    if (!vendor_id || !title || !scheduled_for) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("live_sessions")
      .insert({
        vendor_id,
        title,
        description,
        scheduled_for,
        is_live: is_live ?? false,
        cover_url,
        stream_url,
        product_ids: Array.isArray(product_ids) ? product_ids : [],
        viewer_count: 0,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }

  // Tip handling
  const { type, user_id, session_id, amount, message } = body;

  if (type === "tip") {
    if (!user_id || !session_id || !amount) {
      return NextResponse.json({ error: "Missing tip fields" }, { status: 400 });
    }

    const { data: session } = await supabase
      .from("live_sessions")
      .select("vendor_id")
      .eq("id", session_id)
      .single();

    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const { data, error } = await supabase
      .from("live_tips")
      .insert({
        session_id,
        user_id,
        vendor_id: session.vendor_id,
        amount,
        message,
        status: "completed",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update tip total (non-blocking — RPC may not exist in all environments)
    void supabase.rpc("increment_live_tip_total", {
      session_id_param: session_id,
      amount_param: amount,
    });

    return NextResponse.json(data, { status: 201 });
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

// PATCH /api/live-sessions — go live / end session
export async function PATCH(req: Request) {
  const body = await req.json();
  const { id, is_live, stream_url, ended_at } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (is_live !== undefined) updates.is_live = is_live;
  if (stream_url !== undefined) updates.stream_url = stream_url;
  if (ended_at !== undefined) updates.ended_at = ended_at;
  if (is_live === false) updates.ended_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("live_sessions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}