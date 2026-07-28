import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { getServiceCapacity } from "@/lib/bookings/capacity";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const slotId = new URL(req.url).searchParams.get("slot_id");

  if (id.startsWith("demo-")) {
    return NextResponse.json({ error: "Demo services cannot be booked" }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  const capacity = await getServiceCapacity(supabase, id, slotId);

  if (!capacity) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  return NextResponse.json(capacity);
}
