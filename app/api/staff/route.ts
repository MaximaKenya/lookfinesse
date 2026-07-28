import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// GET /api/staff?vendor_id=xxx — list staff
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendor_id");
  if (!vendorId) return NextResponse.json({ error: "Missing vendor_id" }, { status: 400 });

  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/staff — create staff member
export async function POST(req: Request) {
  const body = await req.json();
  const { vendor_id, name, role, avatar_url } = body;
  if (!vendor_id || !name) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const { data, error } = await supabase
    .from("staff_members")
    .insert({ vendor_id, name, role, avatar_url, is_active: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/staff — update staff member
export async function PATCH(req: Request) {
  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await supabase
    .from("staff_members")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/staff?id=xxx
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("staff_members").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
