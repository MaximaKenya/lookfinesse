import type { SupabaseClient } from "@supabase/supabase-js";

const ACTIVE_STATUSES = ["pending", "pending_payment", "confirmed"] as const;

export type CapacitySnapshot = {
  serviceId: string;
  slotId?: string | null;
  maxSpots: number;
  bookedSpots: number;
  remainingSpots: number;
  isFull: boolean;
};

export async function getServiceCapacity(
  supabase: SupabaseClient,
  serviceId: string,
  slotId?: string | null
): Promise<CapacitySnapshot | null> {
  // Preferred path: SECURITY DEFINER RPC returns aggregate counts across ALL
  // users' bookings. A direct count would be wrong here because bookings RLS
  // only exposes the caller's own rows, so a shopper would always see "0 of N".
  const rpc = await readCapacityViaRpc(supabase, serviceId, slotId);
  if (rpc) return rpc;

  // Fallback (RPC not installed yet): confirm the service exists, then count
  // whatever rows RLS allows. Under-counts for shoppers but never blocks UI.
  const { data: service, error } = await supabase
    .from("services")
    .select("id, max_participants")
    .eq("id", serviceId)
    .maybeSingle();

  if (error || !service) return null;

  const maxSpots = Math.max(1, Number(service.max_participants ?? 1));

  let query = supabase
    .from("bookings")
    .select("participants, status")
    .eq("service_id", serviceId)
    .in("status", [...ACTIVE_STATUSES]);

  if (slotId) query = query.eq("availability_slot_id", slotId);

  const { data: rows } = await query;
  const bookedSpots = (rows ?? []).reduce(
    (sum, row) => sum + Math.max(1, Number(row.participants ?? 1)),
    0
  );
  const remainingSpots = Math.max(0, maxSpots - bookedSpots);

  return {
    serviceId,
    slotId: slotId ?? null,
    maxSpots,
    bookedSpots,
    remainingSpots,
    isFull: remainingSpots <= 0,
  };
}

async function readCapacityViaRpc(
  supabase: SupabaseClient,
  serviceId: string,
  slotId?: string | null
): Promise<CapacitySnapshot | null> {
  try {
    const { data, error } = await supabase.rpc("service_slot_capacity", {
      p_service_id: serviceId,
      p_slot_id: slotId ?? null,
    });
    if (error || !data) return null;

    const usingSlot = !!slotId;
    const maxSpots = Math.max(1, Number((usingSlot ? data.slot_max : data.service_max) ?? 1));
    const bookedSpots = Number((usingSlot ? data.slot_booked : data.service_booked) ?? 0);
    const remainingSpots = Math.max(0, maxSpots - bookedSpots);

    return {
      serviceId,
      slotId: slotId ?? null,
      maxSpots,
      bookedSpots,
      remainingSpots,
      isFull: remainingSpots <= 0,
    };
  } catch {
    return null;
  }
}

export async function assertBookingCapacity(
  supabase: SupabaseClient,
  serviceId: string,
  slotId: string | null | undefined,
  requestedParticipants: number
): Promise<{ ok: true; capacity: CapacitySnapshot } | { ok: false; error: string; capacity: CapacitySnapshot }> {
  const capacity = await getServiceCapacity(supabase, serviceId, slotId);
  if (!capacity) {
    return { ok: false, error: "Service not found", capacity: { serviceId, slotId, maxSpots: 0, bookedSpots: 0, remainingSpots: 0, isFull: true } };
  }

  if (capacity.isFull || requestedParticipants > capacity.remainingSpots) {
    return {
      ok: false,
      error: `Fully booked — ${capacity.bookedSpots} of ${capacity.maxSpots} spots taken`,
      capacity,
    };
  }

  return { ok: true, capacity };
}
