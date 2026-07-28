import { NextResponse } from "next/server";
import { getServices } from "@/lib/social/queries";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const category = new URL(req.url).searchParams.get("category") ?? undefined;
  const services = await getServices(category ?? undefined);
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      vendor_id, title, short_description, description, category,
      cover_image, gallery, price, duration_minutes,
      is_virtual, is_in_person, requires_deposit, deposit_amount, max_participants,
    } = body;

    const { data, error } = await supabase
      .from("services")
      .insert({
        vendor_id, title, short_description, description, category,
        cover_image, gallery, price, duration_minutes,
        is_virtual, is_in_person, requires_deposit, deposit_amount, max_participants,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, service: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}