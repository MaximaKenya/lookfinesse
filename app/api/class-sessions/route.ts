import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendor_id");
  const upcoming = searchParams.get("upcoming") === "1";

  const supabase = await createSupabaseServer();
  let q = supabase
    .from("class_sessions")
    .select("*")
    .order("starts_at", { ascending: true });

  if (vendorId) q = q.eq("vendor_id", vendorId);
  if (upcoming) q = q.gte("starts_at", new Date().toISOString());

  const { data, error } = await q.limit(50);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(Array.isArray(data) ? data : []);
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { vendor_id, title, description, starts_at, ends_at, capacity, is_online, live_session_id } = body;

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("id", vendor_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vendor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("class_sessions")
    .insert({
      vendor_id,
      title,
      description: description ?? null,
      starts_at,
      ends_at,
      capacity: capacity ?? 20,
      is_online: !!is_online,
      live_session_id: live_session_id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
