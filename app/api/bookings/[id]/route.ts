import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Plain select first — never depends on PostgREST FK relationships, so a
  // missing services/vendors foreign key can't turn a valid booking into a 404.
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[booking GET]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Enrich with related resources via separate queries (FK-independent).
  const [service, vendor, slot] = await Promise.all([
    booking.service_id
      ? supabase
          .from("services")
          .select("title, cover_image, category, duration_minutes")
          .eq("id", booking.service_id)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
    booking.vendor_id
      ? supabase
          .from("vendors")
          .select("id, name, business_name, avatar_url")
          .eq("id", booking.vendor_id)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
    booking.availability_slot_id
      ? supabase
          .from("availability_slots")
          .select("starts_at, ends_at")
          .eq("id", booking.availability_slot_id)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    ...booking,
    services: service,
    vendors: vendor,
    availability_slots: slot,
  });
}
