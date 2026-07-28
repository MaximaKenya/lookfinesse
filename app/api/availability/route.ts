import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { getAvailabilitySlots } from "@/lib/social/queries";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("service_id");
  const vendorId = searchParams.get("vendor_id");

  if (serviceId?.startsWith("demo-")) {
    return NextResponse.json(
      { error: "Demo services have no real availability. Browse live services instead." },
      { status: 400 }
    );
  }

  if (serviceId) {
    const slots = await getAvailabilitySlots(serviceId);
    return NextResponse.json(slots);
  }

  if (vendorId) {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("vendor_id", vendorId)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  return NextResponse.json({ error: "Missing service_id or vendor_id" }, { status: 400 });
}

export async function POST(req: Request) {
  const auth = await createSupabaseServer();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { vendor_id, service_id, staff_member_id, starts_at, ends_at } = body;

  if (!vendor_id || !starts_at || !ends_at) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await auth
    .from("availability_slots")
    .insert({
      vendor_id,
      service_id: service_id || null,
      staff_member_id: staff_member_id || null,
      starts_at,
      ends_at,
      is_booked: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
