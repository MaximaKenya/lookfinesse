import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { assertBookingCapacity, getServiceCapacity } from "@/lib/bookings/capacity";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userIdParam = new URL(req.url).searchParams.get("user_id");
  const userId = userIdParam ?? user.id;

  if (userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Plain select — independent of PostgREST FK relationships.
  const { data: rows, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[bookings GET]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bookings = Array.isArray(rows) ? rows : [];
  if (bookings.length === 0) return NextResponse.json([]);

  const serviceIds = [...new Set(bookings.map((b) => b.service_id).filter(Boolean))];
  const vendorIds = [...new Set(bookings.map((b) => b.vendor_id).filter(Boolean))];
  const slotIds = [...new Set(bookings.map((b) => b.availability_slot_id).filter(Boolean))];

  const [services, vendors, slots] = await Promise.all([
    serviceIds.length
      ? supabase
          .from("services")
          .select("id, title, cover_image, category, duration_minutes")
          .in("id", serviceIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    vendorIds.length
      ? supabase
          .from("vendors")
          .select("id, name, business_name, avatar_url")
          .in("id", vendorIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    slotIds.length
      ? supabase
          .from("availability_slots")
          .select("id, starts_at, ends_at")
          .in("id", slotIds)
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
  ]);

  const serviceMap = new Map(services.map((s: { id: string }) => [s.id, s]));
  const vendorMap = new Map(vendors.map((v: { id: string }) => [v.id, v]));
  const slotMap = new Map(slots.map((s: { id: string }) => [s.id, s]));

  const enriched = bookings.map((b) => ({
    ...b,
    services: b.service_id ? serviceMap.get(b.service_id) ?? null : null,
    vendors: b.vendor_id ? vendorMap.get(b.vendor_id) ?? null : null,
    availability_slots: b.availability_slot_id ? slotMap.get(b.availability_slot_id) ?? null : null,
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sign in to book" }, { status: 401 });
    }

    const body = await req.json();
    const {
      user_id,
      vendor_id,
      service_id,
      staff_member_id,
      availability_slot_id,
      participants,
      notes,
    } = body;

    if (user_id && user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!service_id || !vendor_id) {
      return NextResponse.json({ error: "Missing service_id or vendor_id" }, { status: 400 });
    }

    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id, price, category, vendor_id, max_participants")
      .eq("id", service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    if (service.vendor_id !== vendor_id) {
      return NextResponse.json({ error: "Vendor mismatch" }, { status: 400 });
    }

    const participantCount = Math.max(1, Number(participants || 1));

    // Block overbooking against live capacity (per-slot when a slot is chosen,
    // otherwise against the service total).
    const check = await assertBookingCapacity(
      supabase,
      service_id,
      availability_slot_id,
      participantCount
    );
    if (!check.ok) {
      return NextResponse.json(
        {
          error: check.error,
          code: "OVERBOOKED",
          remaining: check.capacity.remainingSpots,
          max: check.capacity.maxSpots,
        },
        { status: 409 }
      );
    }

    const total = Number(service.price) * participantCount;

    const { data, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: user.id,
        vendor_id,
        service_id,
        staff_member_id: staff_member_id ?? null,
        availability_slot_id: availability_slot_id ?? null,
        booking_type: service.category,
        participants: participantCount,
        notes: notes ?? null,
        total_amount: total,
        payment_status: "pending",
        status: "pending_payment",
      })
      .select()
      .single();

    if (bookingError) {
      console.error("[bookings POST]", bookingError.message);
      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    // Only flag the slot as fully booked once capacity is actually reached, so
    // multi-seat sessions stay bookable until the last spot is taken.
    if (availability_slot_id) {
      const after = await getServiceCapacity(supabase, service_id, availability_slot_id);
      if (!after || after.isFull) {
        await supabase
          .from("availability_slots")
          .update({ is_booked: true })
          .eq("id", availability_slot_id);
      }
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      booking: data,
      checkoutUrl: `/checkout?booking_id=${data.id}`,
    });
  } catch (err) {
    console.error("[bookings POST]", err);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
